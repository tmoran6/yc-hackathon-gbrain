// Tag helpers. Tags are short department/team labels on a session that make it
// easy to slice the workflow library by who owns each process.

// Curated department tags shown as quick-pick chips in the editor. These are
// just defaults — users can always type any custom tag.
export const SUGGESTED_TAGS = [
  "Administration",
  "Finance",
  "HR",
  "Sales",
  "Marketing",
  "Customer Service",
  "Operations",
  "IT",
  "Engineering",
  "Legal",
  "Data & Analytics",
  "Product",
] as const;

type Suggestable = {
  workflow?: {
    title?: string;
    trigger?: string;
    apps_involved?: string[];
    procedure?: string[];
  } | null;
};

// Lowercased keyword -> department tag. First match wins; we collect all hits.
const KEYWORD_TAG_MAP: Array<{ tag: string; keywords: string[] }> = [
  {
    tag: "Finance",
    keywords: [
      "invoice", "billing", "payment", "expense", "accounting", "ledger",
      "budget", "payroll", "reimburs", "quickbooks", "xero", "stripe", "tax",
    ],
  },
  {
    tag: "HR",
    keywords: [
      "employee", "hiring", "candidate", "onboard", "offboard", "recruit",
      "workday", "bamboohr", "greenhouse", "lever", "performance review",
    ],
  },
  {
    tag: "Sales",
    keywords: [
      "salesforce", "hubspot", "pipeline", "lead", "opportunity", "deal",
      "quote", "crm", "outreach", "prospect",
    ],
  },
  {
    tag: "Marketing",
    keywords: [
      "campaign", "mailchimp", "newsletter", "marketo", "seo", "content",
      "social media", "ad ", "facebook ads", "google ads",
    ],
  },
  {
    tag: "Customer Service",
    keywords: [
      "zendesk", "intercom", "ticket", "support", "helpdesk", "freshdesk",
      "customer issue", "complaint",
    ],
  },
  {
    tag: "IT",
    keywords: [
      "jira", "okta", "active directory", "vpn", "password reset",
      "provision", "service now", "servicenow", "helpdesk",
    ],
  },
  {
    tag: "Engineering",
    keywords: [
      "github", "gitlab", "deploy", "pull request", "merge", "terminal",
      "vscode", "jenkins", "ci/cd", "build", "kubernetes", "docker",
    ],
  },
  {
    tag: "Legal",
    keywords: [
      "contract", "agreement", "nda", "compliance", "docusign", "clause",
      "policy", "regulat",
    ],
  },
  {
    tag: "Data & Analytics",
    keywords: [
      "looker", "tableau", "power bi", "dashboard", "report", "metabase",
      "snowflake", "bigquery", "sql query", "analytics",
    ],
  },
  {
    tag: "Operations",
    keywords: [
      "schedule", "logistics", "inventory", "shipment", "warehouse",
      "fulfillment", "procurement", "vendor",
    ],
  },
  {
    tag: "Administration",
    keywords: [
      "calendar", "meeting invite", "google docs", "google sheets",
      "filing", "document", "scan", "spreadsheet",
    ],
  },
  {
    tag: "Product",
    keywords: [
      "linear", "notion", "roadmap", "feature request", "spec", "prd",
      "user research",
    ],
  },
];

// Derive a few tag suggestions by keyword-matching the workflow text. The goal
// is to seed the editor with a sensible guess — the user can always change it.
export function suggestTags(input: Suggestable): string[] {
  const wf = input.workflow;
  if (!wf) return [];
  const haystack = [
    wf.title,
    wf.trigger,
    ...(wf.apps_involved ?? []),
    ...(wf.procedure ?? []),
  ]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" \n ")
    .toLowerCase();
  if (!haystack) return [];
  const hits: string[] = [];
  for (const { tag, keywords } of KEYWORD_TAG_MAP) {
    if (keywords.some((k) => haystack.includes(k))) hits.push(tag);
  }
  return hits;
}

// Canonical tag form: trimmed, single internal spaces, max 40 chars.
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTag(t);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}
