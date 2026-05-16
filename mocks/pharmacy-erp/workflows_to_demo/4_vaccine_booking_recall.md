# Workflow 4 — Vaccine Appointment Booking & Recall Campaign

> Two halves of the same skill. (a) On-demand: a patient calls and the
> pharmacist books a vaccine. (b) Scheduled: every Monday RxBrain finds
> eligible patients and runs a recall.

---

## Trigger

- Patient phone/walk-in asking about flu / COVID / pneumococcal
- OR Weekly Monday 8:00 AM recall sweep
- OR Workflow 1 noted patient is "due" during refill processing (cross-sell moment)

## Screens touched

1. `patients` — find patient
2. Patient profile — review allergies, vaccine history
3. `appointments-vaccine` — open vaccine booking
4. `inventory` — confirm vaccine stock (M016 Flu, M017 COVID, M018 Pneumovax)
5. `appointments` — confirm slot on schedule
6. `insurance-verify` — confirm coverage (most plans 100% preventive)
7. Send confirmation (SMS / printed slip)

## Inputs

- Patient: `id`, `dob` (age gates eligibility), `allergies`, `insurancePlan`
- Vaccine inventory: `M016 Fluzone`, `M017 Moderna COVID`, `M018 Pneumovax 23`
- Schedule slots (15-min granularity, refrigerator-adjacent counter capacity)

## Eligibility rules (the company brain learns these)

| Vaccine | Age gate | Other gates |
|---|---|---|
| Influenza (M016) | ≥ 6 mo | Once per season; egg allergy → alternate |
| COVID-19 (M017) | ≥ 6 mo | ≥ 2 mo since last dose for boosters |
| Pneumovax 23 (M018) | ≥ 65 OR high-risk under 65 | Once-in-lifetime for most adults |

## Step-by-step (on-demand path)

1. Patient calls: "Can I get a flu shot Thursday?"
2. Search patient (e.g., **Anderson, M. P001**, DOB 1947-03-14 → age 79 ✓).
3. Check allergies: "Penicillin, Sulfa" — no vaccine conflict.
4. Vaccine history check: no flu this season → eligible.
5. Confirm M016 Fluzone stock = 145 ✓.
6. Open Thursday in `appointments-vaccine`, find a 15-min slot.
7. Verify insurance (BCBS-IL covers preventive 100%).
8. Book. Append note: "Pneumovax also eligible — offer at visit."
9. SMS confirmation.

## Step-by-step (recall sweep path)

Every Monday 8:00 AM, scan the patient roster:

1. Build cohort: `age >= 65` AND no `vaccine: Pneumovax` in history.
   - Seed hits: P001 Anderson (79), P004 Davis (70), P008 Hayes (83), P011 Kowalski (76).
2. Build cohort: any patient with no flu shot since 2025-09-01.
3. For each, draft an outreach message + propose 3 slots.
4. Submit list to pharmacist for approval (single "Send 47 messages" button).
5. Track responses, auto-book confirmed slots.

## Decision points

| Condition | Branch |
|---|---|
| Patient under age gate | Skip / refer to pediatrician |
| Allergy collision (egg, latex, prior reaction) | Switch product OR refer |
| Vaccine stock < threshold | Trigger Workflow 2 restock; defer outreach |
| Patient declined recently | Suppress for 60 days |
| Auto-refill patient (P008 Hayes) | Bundle vaccine reminder with refill pickup |

## Exceptions

- **Cold-chain failure** if vaccine sat out → log lot, do not administer, replace.
- **VAERS-reportable event** post-administration → escalate to pharmacist immediately.

## Suggested agent decomposition

- **Eligibility Cohort Agent** — runs the age/history rules over the patient set.
- **Stock-Aware Scheduler Agent** — gates outreach on fridge inventory.
- **Recall Outreach Agent** — drafts and queues SMS/letter campaigns (human approval gate).
- **Slot Finder Agent** — proposes 3 nearest slots given the patient's typical visit times.
- **Cross-Sell Hint Agent** — during refill workflow, surface "also eligible for X".
- **Post-Visit Follow-Up Agent** — schedules dose 2 / next-season reminder.

## Demo "tomorrow" payoff

> "Every Monday, RxBrain hands the pharmacist a one-click campaign: 47
> patients eligible for pneumococcal, 112 due for flu, each with proposed
> slots and pre-checked insurance. Approving sends the lot."
