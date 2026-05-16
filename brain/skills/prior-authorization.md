# Prior Authorization Processing

A reusable skill captured from the pharmacy owner handling an insurance prior authorization request.
Lives at `brain/skills/prior-authorization.md` once committed.

**Trigger:** Insurance rejects a prescription claim and returns a PA (prior authorization) required denial code, or a prescriber submits a new high-cost medication that the payer flags for review.

**Apps involved:** Pharmacy ERP / management system, payer portal (web), fax machine or electronic PA submission system (CoverMyMeds or equivalent).

**Required inputs:**
- Patient name and date of birth
- Prescription details: drug name, strength, quantity, days supply
- Prescriber name, NPI, and fax number
- Insurance payer ID and group/member number
- Rejection code from the claim (e.g. 75 — prior authorization required)

**Procedure:**
1. Open the pharmacy management system and locate the rejected claim.
2. Record the rejection code and note the payer name and plan type.
3. Log into the payer portal (or CoverMyMeds) and start a new PA request for the drug.
4. Enter the patient demographics, prescriber NPI, and medication details.
5. Answer the payer's clinical criteria questions (diagnosis code, step therapy tried, clinical notes).
6. If clinical notes are required, contact the prescriber's office by phone or fax to request supporting documentation.
7. Submit the PA request electronically or by fax to the payer.
8. Note the PA reference number and expected decision turnaround time (typically 24–72 hours for non-urgent; same-day for urgent).
9. Set a follow-up reminder for 24 hours before the turnaround deadline.
10. When the PA decision arrives, update the claim in the pharmacy ERP and notify the patient of the outcome.
11. If approved, process the claim and fill the prescription.
12. If denied, explain the denial to the patient and offer alternatives (generic, cash price, manufacturer coupon).

**Decision points:**
- Is the denial code PA-required (75) or a different rejection type?
- Does the payer require step therapy documentation (e.g. patient tried a cheaper drug first)?
- Is the case urgent enough to request an expedited PA (patient safety or acute condition)?
- Has the prescriber responded with supporting clinical notes in time?

**Exceptions — what to do when it goes wrong:**
- **Prescriber unresponsive:** leave a detailed fax + phone message; if no reply within 4 hours for urgent cases, escalate to the pharmacy owner. Offer the patient a 3-day emergency supply if state law allows.
- **PA denied:** provide the patient with the written denial notice, explain the appeals process, and ask the prescriber if an alternative covered drug could work.
- **PA approved but claim still rejects:** re-adjudicate the claim with the PA reference number entered in field BIN/PCN; if it still fails, call payer helpdesk.
- **Payer portal is down:** submit by fax using the payer's standard PA form; note the fax confirmation number in the patient's record.
- **Patient cannot wait:** check if a manufacturer patient-assistance program or GoodRx covers the medication at an affordable cash price while PA is pending.

**Suggested automations:**
- Auto-detect PA-required rejection codes and pre-fill the CoverMyMeds request with patient and drug data from the ERP.
- Auto-send a fax template to the prescriber requesting clinical notes the moment a PA is initiated.
- Auto-set a follow-up task in the ERP when a PA is submitted, due 24 hours before the expected decision date.
- Auto-notify the patient by text when the PA is approved and the prescription is ready for pickup.

---

## Timeline

- **2026-05-16** — Skill captured from the pharmacy owner walking through a live PA
  rejection for a brand-name statin (session `session_2026-05-16_16-22-05`, 210s).
  Analyzer identified 8 steps; owner added the prescriber-unresponsive and portal-down
  exception cases during review.
