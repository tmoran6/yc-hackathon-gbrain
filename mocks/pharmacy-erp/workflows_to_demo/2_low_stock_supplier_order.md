# Workflow 2 — Low-Stock Review & Supplier Order

> The "Inventory → Purchasing" loop. Sweeps the shelf for items below reorder
> point, decides between primary wholesaler (McKesson) and generic source,
> and creates a draft PO that the pharmacist approves with one click.

---

## Trigger

- Daily 10:00 AM after refill queue is drained
- OR low-stock count on dashboard ≥ 3
- OR hand-off from Workflow 1 with specific NDCs flagged

## Screens touched

1. `dashboard` — read **LOW STOCK ITEMS** KPI
2. `inventory-low` — sortable list of all items where `stock < reorderPt`
3. `inventory` — click NDC → see usage/velocity history
4. `purchasing-suppliers` — confirm which supplier covers this NDC (primary/generic)
5. `purchasing` — create new PO, add lines
6. `purchasing-receive` — (next day) check in delivery, reconcile invoice

## Inputs

- Med record: `ndc`, `stock`, `reorderPt`, `reorderQty`, `awp`, `mfr`
- Supplier list (seeded: S001 McKesson primary, S002 Cardinal, S003 ABC, S004 Generic Source)
- Last 30-day fill velocity (derive from `activityLog` + `prescriptions.lastFilled`)

## Step-by-step (concrete on seed data)

Low-stock items as of 2026-05-16:

| NDC | Name | Stock | Reorder Pt | Reorder Qty | Goes to |
|---|---|---|---|---|---|
| M003 | Atorvastatin 20mg | 95 | 100 | 500 | S004 (generic) |
| M005 | Omeprazole 20mg | 64 | 80 | 300 | S004 (generic) |
| M006 | Levothyroxine 50mcg | 22 | 60 | 300 | S001 (primary, narrow TI) |
| M007 | Albuterol HFA | 8 | 10 | 24 | S001 (brand) |
| M011 | Januvia 100mg | 12 | 20 | 60 | S001 (brand, PA item) |
| M012 | Advair 250/50 | 4 | 8 | 16 | S001 (brand, expensive) |
| M018 | Pneumovax 23 | 18 | 10 | 40 | refrigerated — S001 only |

1. Sort by `(stock / reorderPt)` ascending — Advair surfaces first.
2. For each line, pick supplier:
   - Generic (Mylan, Teva, Sandoz, Watson) → **S004 Generic Source** (cheapest)
   - Brand / cold-chain / narrow-therapeutic-index → **S001 McKesson** (primary, 1-day lead time)
3. Build two POs:
   - **PO to S001** (cutoff 15:00): M006, M007, M011, M012, M018
   - **PO to S004** (cutoff 12:00): M003, M005
4. Estimate landed cost: `Σ (awp * reorderQty)` per PO.
5. Submit. Receive confirmation IDs.
6. Update expected delivery on dashboard.

## Decision points

| Condition | Branch |
|---|---|
| Item is controlled (C-II/C-IV) | DEA 222 form required, ONLY primary supplier, separate PO |
| Item is cold-chain (`location: FRIDGE-*` / `vaccine: true`) | Confirm fridge capacity before ordering |
| Cutoff already passed today | Schedule PO for tomorrow's cutoff, alert if patient is waiting |
| `awp * reorderQty > $5000` | Require pharmacist approval before submit |
| Item has been flagged on backorder (history check) | Try secondary supplier first |

## Exceptions seen on this run

- **Advair (M012)** is below reorder AND has Q-107 waiting on a PA → notify Garcia, E. that fill is delayed pending both PA and stock.
- **Pneumovax (M018)** is borderline — if appointment volume picks up, will deplete fast.

## Suggested agent decomposition

- **Low-Stock Scanner Agent** — runs hourly, computes the gap list.
- **Supplier Router Agent** — applies the supplier-selection policy above.
- **PO Drafting Agent** — fills the PO form per supplier, computes totals.
- **Cutoff Awareness Agent** — knows each supplier's cutoff time and warns.
- **Cold-Chain / Controlled Guard Agent** — enforces the special-handling rules.
- **Backorder Memory Agent** — remembers NDCs that came up short last time and prefers an alternate supplier.

## Demo "tomorrow" payoff

> "RxBrain drafts the day's purchase orders before the pharmacist's coffee is
> cold. Each PO is pre-routed to the right wholesaler, includes the right
> quantities, and respects supplier cutoffs. The pharmacist clicks Approve;
> the PO transmits."
