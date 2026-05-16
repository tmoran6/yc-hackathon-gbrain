# Workflow 1 — Morning Refill Queue Processing

> The pharmacist's first 30 minutes of the day. Drains the overnight refill queue
> (IVR, mobile app, eRx, auto-refill) into either "ready to fill" or "blocked."
> This is the canonical "do it once on camera, capture the company brain" demo.

---

## Trigger

- New shift starts (default: 7:30 AM, weekdays)
- OR refill queue depth > 5
- OR operator clicks **Refill Queue** in toolbar

## Screens touched (in order)

1. `dashboard` — glance at PENDING REFILLS / LOW STOCK / REJECTED CLAIMS KPIs
2. `rx-queue` — open the refill queue list
3. `patients` → patient profile — verify allergies, last fill date
4. `inventory` — confirm stock on the NDC
5. `insurance-verify` — re-run eligibility if last fill > 30 days ago
6. `rx-queue` — mark **READY** or **BLOCKED** with reason
7. Back to `dashboard` to confirm count went down

## Inputs

- Refill queue items (seeded: Q-100 through Q-107)
- Each item carries: `rxId`, `patientId`, `medId`, `source`, `requestedAt`, `notes`

## Step-by-step (concrete on seed data)

1. Open queue — 8 pending items as of 2026-05-16.
2. **Q-100** Anderson, M. (P001) → Lisinopril 10mg (M001).
   - Refills remaining: 4 ✓
   - Allergies: Penicillin, Sulfa (no conflict) ✓
   - Stock: 240 ✓ → **READY**
3. **Q-101** Becker, R. (P002) → Metformin (M002). Standard refill → **READY**.
4. **Q-102** Davis, W. (P004) → Eliquis (M015). High-cost, recheck insurance. → **READY**.
5. **Q-103** Davis, W. (P004) → Lisinopril (M001). Bundle with Q-102 for pickup.
6. **Q-104** Hayes, T. (P008) → Levothyroxine (M006). **STOCK 22, reorder pt 60 → flag for restock workflow**, still fillable today.
7. **Q-105** Kowalski, B. (P011) → Lisinopril (M001). Caller requested same-day → priority lane.
8. **Q-106** Foster, D. (P006) → Albuterol HFA (M007). **STOCK 8, reorder pt 10 → flag**.
9. **Q-107** Garcia, E. (P007) → Advair 250/50 (M012). **STOCK 4, reorder pt 8 AND `paRequired: true` → route to Prior Auth queue.**

## Decision points

| Condition | Branch |
|---|---|
| `refillsRemaining === 0` | Route to prescriber — request renewal |
| Stock < quantity needed | Route to Workflow 2 (Restock) |
| `med.paRequired === true` AND no recent PA | Route to Workflow 3 (PA Triage) |
| Last insurance check > 30 days | Re-verify eligibility |
| Allergy hit on drug class | Pharmacist hard-stop, do NOT fill |
| Controlled (`schedule: C-II / C-IV`) | Require DEA log entry + photo ID at pickup |

## Exceptions seen on this run

- **M006 Levothyroxine** below reorder point → hand-off to Workflow 2.
- **M012 Advair** below reorder point AND requires prior auth → hand-off to Workflow 3.
- **M007 Albuterol** below reorder point → hand-off to Workflow 2.

## Suggested agent decomposition

- **Refill Intake Agent** — watches new queue inserts (IVR, mobile, eRx, auto-refill).
- **Eligibility Agent** — re-runs insurance check when last verified > 30 days.
- **Inventory Check Agent** — for each refill, asserts `stock >= qty` and flags `< reorderPt`.
- **Allergy/Interaction Guard Agent** — cross-checks med vs `patient.allergies` and active Rx list.
- **PA Router Agent** — when `med.paRequired` and no active PA, sends to Workflow 3.
- **Same-Day Priority Agent** — surfaces `notes` containing "same-day" / walk-in flags.

## Demo "tomorrow" payoff

> "Every morning at 7:30, RxBrain drains the overnight refill queue: it eligibility-checks,
> inventory-checks, allergy-checks, and labels every item READY, BLOCKED-STOCK,
> BLOCKED-PA, or NEEDS-RENEWAL. The pharmacist opens to a clean queue with
> the work already triaged."
