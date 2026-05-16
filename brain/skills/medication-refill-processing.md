# Medication Refill Processing

A reusable skill captured from the pharmacy owner doing the task once.

**Trigger:** A patient requests a prescription refill by phone, app, or in person.

**Apps involved:** Pharmacy ERP / management system.

**Required inputs:**
- Patient name or date of birth
- Prescription or medication name
- Insurance information on file

**Procedure:**
1. Open the pharmacy management system.
2. Search for the patient by name or date of birth.
3. Open the prescription and check refill eligibility (refills remaining, last fill date).
4. Verify insurance coverage for the medication.
5. Check on-hand inventory for the medication.
6. If in stock, mark the prescription for fulfillment.
7. If out of stock, create a supplier restock order.
8. Notify the patient when the prescription is ready for pickup.

**Decision points:**
- Is the refill still eligible — refills remaining, not too early?
- Is the medication covered by the patient's insurance?
- Is the medication currently in stock?

**Exceptions — what to do when it goes wrong:**
- **Insurance rejected:** contact the prescriber for a prior authorization, or
  offer the patient the cash price. Do not dispense until resolved.
  See `insurance-prior-authorization.md`.
- **Refill too early:** tell the patient the earliest eligible date and note the request.
- **Out of stock:** create a supplier restock order and give an estimated ready date.
- **No refills remaining:** message the prescriber for a new prescription before proceeding.

**Suggested automations:**
- Auto-check refill eligibility and insurance the moment a request arrives.
- Auto-draft a supplier restock order when stock falls below threshold.
- Auto-send the patient a pickup-ready text message.

---

## Timeline

- **2026-05-16** — Skill captured from a screen recording of the owner processing
  one refill (session `session_2026-05-16_15-04-12`, 142s). Analyzer segmented
  5 steps; owner confirmed the insurance-rejection and early-refill handling via
  clarifying questions.
