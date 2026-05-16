# Workflow 2 — Estimate Approval → Parts Order → Work Order

> The "say yes and we'll start" loop. Customer approves the estimate from
> Workflow 1; the shop orders parts, books a bay, and the estimate becomes
> a live work order assigned to a tech.

---

## Trigger

- Customer texts/calls/emails "approved" on an outstanding estimate
- OR walk-up "go ahead, do it" right at the counter
- OR fleet manager (C003 Johnson, C009 Moore) returns a signed PO

## Screens touched

1. `estimates` — open the approved estimate, mark APPROVED
2. `parts` → `parts-orders` — order any parts not in stock
3. `vendors` — pick supplier per part category
4. `workorders` — convert estimate → work order (status: SCHEDULED)
5. `bays` — assign a bay
6. `techs` — assign a technician; flag certifications if needed
7. Customer notification: parts ETA, bay drop-time

## Inputs

- Approved estimate (lines, totals, customer ID, vehicle ID)
- Parts catalog with `stock` and per-vehicle compatibility
- Vendor list (need to seed; e.g., Worldpac, NAPA, dealer-direct)
- Technician roster + skill tags (need to seed; e.g., "Euro," "Hybrid HV cert")
- Bay capacity (5 bays per status bar `BAY: 0/5`)

## Step-by-step (concrete on seed data)

Scenario: **Patricia Taylor (C010)** approved the front-brake job on her
2018 BMW 330i xDrive (V011). Estimate included `LB-BRAKEFR` + Akebono Euro
pads (P-BPAD-FRBMW) + Brembo OE rotors (P-ROT-FRBMW). Both parts show
**stock: 0** → must order.

1. Open estimate in `estimates`, mark **APPROVED**, attach approval evidence
   (screenshot of SMS or signed paper).
2. Check `parts`:
   - P-BPAD-FRBMW stock 0 → order
   - P-ROT-FRBMW stock 0 → order
3. `parts-orders`:
   - For BMW OEM parts → primary vendor for Euro is Worldpac or dealer.
   - Customer wants OEM (`notes: 'Customer requests OEM parts only'`).
   - Create one PO covering both lines, expected delivery: tomorrow before 11AM.
4. Compute promised completion: **earliest = parts ETA + labor hours**.
   - Labor: 1.5 + 0.5 = 2.0 hours.
   - Parts arrive Friday 11AM → bay slot Friday 11:30-13:30.
5. `workorders` — convert estimate to RO. Status: SCHEDULED. Assign bay & tech:
   - `bays` — pick Bay 3 (lift, Euro tooling).
   - `techs` — pick a tech with Euro experience.
6. Notify customer: "Parts arrive Friday morning, your appointment is 11:30,
   ready by 2pm."
7. Set parts-arrival alert. If parts slip → re-message customer.

## Decision points

| Condition | Branch |
|---|---|
| All parts in stock | Skip parts order, go straight to bay scheduling |
| Part has multiple vendors with different cost/ETA | Pick by `cost` if non-urgent, by `ETA` if customer waiting |
| Vehicle requires special tooling (Euro, hybrid HV, diesel) | Constrain bay & tech selection |
| Same-day promise made | Force bay slot today; surface conflicts |
| Loaner needed (C012) | Reserve loaner before confirming appointment |
| Approved by phone / SMS | Capture approval text/recording, attach to RO |
| No-show risk (estimate > 5 days old) | Confirm with customer before ordering non-returnable parts |

## Exceptions

- **Hybrid (V009 Prius)** → only HV-certified tech may touch the high-voltage system.
- **Powertrain warranty** (V010 Ram, V011 BMW partial) → call dealer for coverage before ordering parts customer pays for.
- **Returnable vs non-returnable** parts — ECUs, painted body parts, etc. require a deposit before ordering.

## Suggested agent decomposition

- **Approval Capture Agent** — accepts SMS/email/voice "yes," timestamps it, attaches to the estimate.
- **Stock Resolver Agent** — splits estimate lines into in-stock vs needs-order.
- **Vendor Routing Agent** — applies the OEM/aftermarket and cost-vs-ETA policy.
- **Bay/Tech Scheduler Agent** — packs the bay calendar respecting labor-hour and certification constraints.
- **Promise-Time Agent** — computes earliest completion, exposes a single "promise" timestamp to text the customer.
- **Parts-Arrival Watcher Agent** — polls vendor confirmations, re-messages customer on slips.

## Demo "tomorrow" payoff

> "When a customer says yes, ShopBrain orders the right parts from the right
> vendor, picks a tech who can actually do the work, books the bay, and
> texts a real promise time. Pete confirms; the wrench turns."
