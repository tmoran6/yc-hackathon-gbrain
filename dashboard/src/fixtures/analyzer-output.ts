// Fixture data from fixtures/analyzer-output.json — kept in sync with root fixtures/
export const analyzerOutput = {
  generated_at: "2026-05-16T15:10:00.000Z",
  model: "gemini-2.0-flash",
  session: "session_2026-05-16_15-04-12",
  session_path: "~/Movies/ScreenRecorder/session_2026-05-16_15-04-12",
  duration_sec: 142.5,
  chunk_seconds: 15,
  frame_count: 285,
  audio: {
    summary:
      "Owner explains she is processing a medication refill request that came in by phone, checking the patient record, insurance, and stock.",
  },
  steps: [
    {
      chunk: 0,
      app: "Pharmacy ERP",
      doing: "Opening the pharmacy management system and searching the patient by name",
      intent: "Locate the patient record for the refill",
    },
    {
      chunk: 1,
      app: "Pharmacy ERP",
      doing: "Checking refill eligibility and last fill date",
      intent: "Confirm the refill is allowed",
    },
    {
      chunk: 2,
      app: "Pharmacy ERP",
      doing: "Verifying insurance coverage for the medication",
      intent: "Make sure insurance will pay",
    },
    {
      chunk: 3,
      app: "Pharmacy ERP",
      doing: "Checking on-hand inventory for the medication",
      intent: "Confirm the drug is in stock",
    },
    {
      chunk: 4,
      app: "Pharmacy ERP",
      doing: "Marking the prescription for fulfillment and notifying the patient",
      intent: "Complete the refill",
    },
  ],
  workflow: {
    title: "Medication Refill Processing",
    trigger: "A patient requests a prescription refill by phone, app, or in person.",
    apps_involved: ["Pharmacy ERP / management system"],
    required_inputs: [
      "Patient name or date of birth",
      "Prescription or medication name",
      "Insurance information on file",
    ],
    procedure: [
      "Open the pharmacy management system.",
      "Search for the patient by name or date of birth.",
      "Open the prescription and check refill eligibility (refills remaining, last fill date).",
      "Verify insurance coverage for the medication.",
      "Check on-hand inventory for the medication.",
      "If in stock, mark the prescription for fulfillment.",
      "If out of stock, create a supplier restock order.",
      "Notify the patient when the prescription is ready for pickup.",
    ],
    decision_points: [
      "Is the refill still eligible (refills remaining, not too early)?",
      "Is the medication covered by the patient's insurance?",
      "Is the medication currently in stock?",
    ],
    exceptions: [
      "Insurance is rejected: contact the prescriber for a prior authorization, or offer the patient the cash price; do not dispense until resolved.",
      "Refill is too early: tell the patient the earliest eligible date and note the request.",
      "Medication out of stock: create a supplier restock order and give the patient an estimated ready date.",
      "No refills remaining: fax or message the prescriber for a new prescription before proceeding.",
    ],
    suggested_automations: [
      "Auto-check refill eligibility and insurance the moment a refill request arrives.",
      "Auto-draft a supplier restock order when stock is below threshold.",
      "Auto-send the patient a pickup-ready text message.",
    ],
  },
  clarifying_questions: [
    {
      id: "rejection-handling",
      question:
        "When insurance is rejected, do you always call the prescriber, or sometimes offer cash price first?",
      why: "The exception branch changes the steps.",
    },
    {
      id: "early-refill-window",
      question: "How many days early will you still fill a refill?",
      why: "Defines the 'too early' decision point.",
    },
  ],
};
