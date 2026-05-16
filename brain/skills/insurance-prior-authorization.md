# Insurance Prior Authorization

A reusable skill captured from the pharmacy owner doing the task once. This is
the recovery workflow when a refill or new prescription is rejected by insurance
and the payer requires the prescriber to justify the medication before it is
covered.

**Trigger:** A claim is rejected at adjudication with a "prior authorization
required" code, or a known high-cost / non-formulary medication is prescribed.

**Apps involved:** Pharmacy ERP / management system, insurance payer portal,
fax or secure messaging to the prescriber's office.

**Required inputs:**
- Patient name and date of birth
- Medication name, strength, and quantity
- Prescriber name and contact (fax or office line)
- Insurance plan and the rejection / reject code from the claim

**Procedure:**
1. Open the rejected claim in the pharmacy management system and read the reject code.
2. Confirm the rejection reason is "prior authorization required" (not a refill-too-soon
   or coverage-terminated rejection, which are handled differently).
3. Look up the payer's prior authorization form or portal for that plan.
4. Fax or message the prescriber's office with the patient, medication, and
   payer details, requesting they submit the prior authorization.
5. Note the request on the prescription and set a follow-up reminder (typically 48-72h).
6. When the payer approves, re-run the claim and proceed with fulfillment.
7. Notify the patient of the outcome and the new expected ready date.

**Decision points:**
- Is the rejection actually a prior-authorization rejection, or a different reject code?
- Is the medication time-sensitive — should the patient be offered a short
  bridge supply or the cash price while the authorization is pending?
- Has the follow-up window elapsed without a payer response?

**Exceptions — what to do when it goes wrong:**
- **Prescriber unresponsive:** re-send the request and call the office; escalate
  to the pharmacist if the medication is time-sensitive.
- **Prior authorization denied:** inform the prescriber so they can appeal or
  switch to a covered alternative; offer the patient the cash price meanwhile.
- **Medication is urgent:** dispense a short emergency supply per pharmacist
  judgment and state law, then continue the authorization in parallel.
- **Wrong reject code:** if the rejection is refill-too-soon or coverage-ended,
  stop and handle it as a refill issue instead. See `medication-refill-processing.md`.

**Suggested automations:**
- Auto-detect "prior authorization required" reject codes and open a PA task.
- Auto-draft the prescriber fax with patient, medication, and payer details prefilled.
- Auto-remind staff when a pending authorization passes its follow-up window.
- Auto-notify the patient when the authorization clears and the claim re-runs.

---

## Timeline

- **2026-05-16** — Skill captured from a screen recording of the owner resolving
  an insurance-rejected refill (session `session_2026-05-16_15-21-08`, 168s).
  Analyzer segmented 6 steps; owner confirmed the prescriber-unresponsive and
  urgent-medication handling via clarifying questions. Cross-linked from the
  insurance-rejected exception in `medication-refill-processing.md`.
