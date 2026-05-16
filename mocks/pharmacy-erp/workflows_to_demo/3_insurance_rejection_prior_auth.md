# Workflow 3 — Insurance Rejection & Prior Authorization Triage

> Where margin gets lost. A rejected claim either gets re-billed correctly,
> dropped to cash, or escalated to a prior auth. This workflow watches the
> pharmacist do that triage once and learns the per-payer rules.

---

## Trigger

- Real-time NCPDP rejection comes back on a claim (most rejections happen
  within seconds of the fill click)
- OR `rx-pa` queue has aging items (> 24h since submission)
- OR Workflow 1 routed an item here because `med.paRequired === true`

## Screens touched

1. `dashboard` — **REJECTED CLAIMS** KPI tile, **PA pending** subtitle
2. `insurance` (Claims Queue) — sorted by status REJECTED
3. Click a row → claim detail with NCPDP reject codes
4. `insurance-verify` — re-run eligibility, confirm BIN/PCN/Group
5. `insurance-pa` — start a PA: payer form, clinical justification fields
6. `rx-pa` (Prior Auth Queue) — track status: PENDING → SUBMITTED → APPROVED/DENIED
7. Patient record → log note + outreach (SMS/phone)

## Inputs

- Claim object: `payer`, `bin`, `pcn`, `group`, `rejectCode`, `rejectMsg`
- Patient insurance: `insuranceBin`, `insurancePcn`, `insuranceGroup`, `copay`
- Med: `paRequired`, `awp`, `retail`
- Prescriber: `npi`, `dea` (needed on PA forms)

## Common reject codes → playbook

| Code | Meaning | Default action |
|---|---|---|
| 70 | Product/Service not covered | Try alternate NDC (generic equivalent); if none, start PA |
| 75 | Prior Authorization required | Start PA on `insurance-pa` |
| M/I (various) | Missing/Invalid field (BIN, PCN, Group, Cardholder ID) | Re-verify on `insurance-verify`, fix, resubmit |
| 79 | Refill too soon | Compute days early, decide vacation-override vs. wait |
| 88 | DUR reject (interaction) | Pharmacist review, contact prescriber if needed |
| 64 | Claim submitted past filing limit | Patient pays cash, then submit reimbursement claim |

## Step-by-step (concrete on seed data)

Likely rejection scenarios across seeded patients:

1. **Advair (M012) for Garcia, E. (P007), Aetna HMO** → 75 PA required.
   - Open `insurance-pa`, pick payer template "Aetna PA — Inhaled Corticosteroid".
   - Pull clinical from prescriber D002 (Williams, S. DO).
   - Justification: "prior trial of M007 Albuterol, inadequate control."
   - Submit. Note in `rx-pa` queue: PENDING-AETNA, expected 48h.
   - Text patient: "Your insurance needs extra paperwork; we're on it."
2. **Januvia (M011) for Becker, R. (P002), Aetna PPO** → 75 PA required.
   - Same template family, different patient.
3. **Eliquis (M015) for Davis, W. (P004), Medicare-Humana** → likely 79 if filled too soon, or covered (Part D tier 3).
   - If 79, wait or process vacation override.
4. **Lisinopril (M001) refill rejected as 70** (e.g., wrong PCN) → re-verify on
   `insurance-verify` and resubmit, no PA.

## Decision points

| Condition | Branch |
|---|---|
| Generic equivalent exists & is on formulary | Switch NDC, resubmit |
| PA approved | Re-bill original NDC, fill |
| PA denied | Offer cash price OR alternate therapy (clinician contact) |
| Patient is `LOW INCOME SUBSIDY` (P004) | Check LIS-specific copay tier before declaring rejection |
| Auto-refill enrolled patient (P008) | Suppress patient outreach until PA outcome known |

## Exceptions

- Some payers (Humana) require **CMR (comprehensive med review)** notes attached.
- BCBS-IL sometimes wants `step therapy documentation` (not just clinical justification).

## Suggested agent decomposition

- **Reject Classifier Agent** — maps NCPDP code → playbook entry.
- **Eligibility Re-Verify Agent** — refreshes BIN/PCN/Group when M/I codes hit.
- **Formulary Swap Agent** — proposes a covered alternative NDC.
- **PA Drafting Agent** — fills the payer-specific PA form using prescriber and patient data.
- **PA Status Watcher** — polls/checks status, ages items in `rx-pa`.
- **Patient Notifier Agent** — sends "we're working on it" SMS with a single approval gate.

## Demo "tomorrow" payoff

> "Rejections don't sit. Within minutes of an NCPDP reject, RxBrain has
> classified the reason, drafted a PA on the right payer template, or queued
> a formulary swap, and prepared a patient notification. The pharmacist
> approves; revenue stops leaking."
