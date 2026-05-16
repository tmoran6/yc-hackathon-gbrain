# Workflow 5 — Controlled Substance Daily Close & DEA Compliance

> The end-of-day workflow nobody wants to do but everybody has to. Reconcile
> physical safe counts against the system, log all C-II/C-IV dispenses, flag
> any variance, and stage the perpetual inventory entries the DEA wants.

---

## Trigger

- End of shift / store close (default: 21:00)
- OR `reports-compliance` shows variance pending
- OR any single C-II transaction (real-time perpetual update)

## Screens touched

1. `reports` → `reports-compliance` — open DEA Compliance dashboard
2. `inventory` — filter `controlled: true` (M009 Hydrocodone, M010 Alprazolam)
3. `rx-history` — list of today's controlled dispenses
4. `reports-sales` — sanity check totals
5. Modal: enter physical count for each controlled NDC
6. Print/export DEA Form 41 / perpetual inventory snapshot

## Inputs

- Controlled meds: M009 (C-II, location SAFE-1), M010 (C-IV, location SAFE-2)
- Today's `activityLog` entries for `RX_FILLED` where med is controlled
- Previous closing count (from yesterday's reconciliation)
- Any returns / wastage events

## Step-by-step

1. Open `reports-compliance` — system shows expected counts:
   - **M009 Hydrocodone-APAP 5/325** expected = (prev close) − (today dispensed) + (received).
   - **M010 Alprazolam 0.5mg** expected = same formula.
2. Walk to safe, count tablets. Enter physical count.
3. System computes variance.
   - Variance = 0 → close shift, print attestation.
   - Variance ≠ 0 → trigger investigation sub-workflow:
     - Recount (two-person, witnessed).
     - Walk back today's RX_FILLED logs.
     - Check for waste events (broken tablet, partial fill).
     - If unresolved, escalate to pharmacist-in-charge.
4. Confirm DEA Form 222 ledger is current for any received C-II shipments.
5. Lock the day. Append to perpetual inventory log.

## Decision points

| Condition | Branch |
|---|---|
| Variance within ±2 tablets | Pharmacist judgment, log explanation |
| Variance > 2 tablets OR > 1% | Two-person recount required |
| Unresolved variance after recount | File DEA Form 106 (theft/loss) within 1 business day |
| Received C-II today | Verify DEA Form 222 carbon copy filed |
| Patient picked up C-II | Verify photo ID was logged at pickup |

## Exceptions

- **Pharmacist-in-charge sign-off** required to close with any variance.
- **State PMP submission** — most states require same-day upload of controlled dispenses.
- **Broken/expired controlled** → witnessed destruction log, NOT inventory adjustment.

## Suggested agent decomposition

- **Perpetual Inventory Agent** — debits the safe count in real time per dispense.
- **Variance Detector Agent** — diff expected vs. counted, classify size.
- **Investigation Helper Agent** — pulls activityLog + pickup logs for the variance window.
- **PMP Submission Agent** — formats today's C-II/C-IV dispenses for state upload.
- **DEA Form 222 Auditor Agent** — pairs every C-II receive with its 222 entry.
- **End-of-Day Close Agent** — orchestrates: count → reconcile → submit → lock.

## Demo "tomorrow" payoff

> "Closing shift goes from 25 minutes of paperwork to 3. RxBrain has the
> expected count, the dispense log, and the PMP file ready. The pharmacist
> counts, types two numbers, and signs."
