/**
 * Self-test for to-skill-page: render the committed fixture and assert the
 * generated skill page is well-formed and contains every expected section.
 *
 * Run with:  node --experimental-strip-types --test to-skill-page.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { skillPageFromFile, toSkillPage, type AnalyzerOutput } from "./to-skill-page.ts";

const FIXTURE = join(import.meta.dirname, "..", "fixtures", "analyzer-output.json");

test("renders the fixture into a valid skill page", () => {
  const page = skillPageFromFile(FIXTURE);

  // Exactly one section divider: compiled truth above, timeline below.
  const dividers = page.split("\n").filter((l) => l.trim() === "---");
  assert.equal(dividers.length, 1, "expected exactly one `---` divider");

  const [truth, timeline] = page.split("\n---\n");
  assert.ok(truth && timeline, "page must split into truth + timeline");

  // Compiled-truth sections.
  assert.match(truth, /^# Daily Opening Routine$/m, "title heading");
  assert.match(truth, /\*\*Trigger:\*\* .+/, "trigger line");
  assert.match(truth, /\*\*Apps involved:\*\* .+/, "apps line");
  for (const heading of [
    "## Required inputs",
    "## Procedure",
    "## Decision points",
    "## Exceptions",
    "## Suggested automations",
  ]) {
    assert.ok(truth.includes(heading), `missing section: ${heading}`);
  }

  // Procedure is a numbered list.
  assert.match(truth, /^1\. Open the POS dashboard/m, "procedure step 1");

  // Timeline sections.
  assert.ok(timeline.includes("## Timeline"), "timeline heading");
  assert.match(timeline, /### \d{4}-\d{2}-\d{2} — Captured from screen recording/, "capture entry");
  assert.ok(timeline.includes("#### Observed steps"), "observed steps");
  assert.ok(timeline.includes("#### Clarifying questions for the operator"), "questions");
  assert.match(timeline, /0–14\.9s — Toast POS/, "first observed step window");
});

test("placeholders fill in for empty workflow arrays", () => {
  const minimal: AnalyzerOutput = {
    workflow: {
      title: "Empty workflow",
      trigger: "",
      apps_involved: [],
      required_inputs: [],
      procedure: [],
      decision_points: [],
      exceptions: [],
      suggested_automations: [],
    },
  };
  const page = toSkillPage(minimal);
  assert.ok(page.includes("# Empty workflow"));
  assert.ok(page.includes("_None recorded._"), "empty lists get a placeholder");
  assert.ok(page.includes("_Not captured._"), "empty trigger gets a placeholder");
  assert.equal(page.split("\n").filter((l) => l.trim() === "---").length, 1);
});

test("de-duplicates and trims list entries", () => {
  const dupes: AnalyzerOutput = {
    workflow: {
      title: "Dupes",
      trigger: "t",
      apps_involved: ["A", "A", " A ", "B"],
      required_inputs: [],
      procedure: ["  step one  ", "step one", "step two"],
      decision_points: [],
      exceptions: [],
      suggested_automations: [],
    },
  };
  const page = toSkillPage(dupes);
  assert.match(page, /\*\*Apps involved:\*\* A, B$/m, "apps de-duplicated");
  assert.match(page, /^1\. step one$/m);
  assert.match(page, /^2\. step two$/m);
  assert.ok(!/^3\./m.test(page), "duplicate procedure step dropped");
});

test("throws when the workflow object is missing", () => {
  assert.throws(() => toSkillPage({} as AnalyzerOutput), /missing the required `workflow`/);
});
