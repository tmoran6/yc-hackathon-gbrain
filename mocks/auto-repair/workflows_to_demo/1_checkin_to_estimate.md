# Workflow 1 — Vehicle Check-In to Estimate

> The customer rolls in with a complaint. By the time they sit down with
> coffee, Pete has a printable estimate. This is the bread-and-butter
> recording for the auto-shop demo.

---

## Trigger

- Walk-in customer at front counter
- OR scheduled drop-off appointment
- OR phone-in "can you look at my brakes today"

## Screens touched

1. `dashboard` — Service Desk view, see today's bays & open ROs
2. `customers` — search customer by phone/last name
3. `vehicles` — pick correct vehicle (a customer may own several)
4. `checkin` — capture concern, mileage in, fuel level, walk-around notes
5. `labor-book` — pick labor ops by code
6. `parts` — search parts by category / vehicle
7. `estimates` — assemble lines, see totals (parts + labor + tax + shop fee)
8. Print/email estimate to customer

## Inputs

- Customer record: phone, email, preferred contact (seed `pref` field)
- Vehicle: VIN, mileage, last service mileage (from `serviceHistory`)
- Concern: free-text from customer ("squeak when braking")
- Shop config: `laborRate=135.00`, `taxRate=8.25%`, `shopFeePct=7%`

## Step-by-step (concrete on seed data)

Scenario: **Linda Williams (C004)** rolls up in her 2019 Subaru Outback (V005,
64,300 mi) saying "the brakes are squealing on the highway."

1. `customers` → search "Williams" → C004.
2. Pick V005 Outback. Last visit: 2026-02-15 at 60,100 mi (CVT fluid + cabin air).
3. `checkin`:
   - Mileage in: **64,300** (matches her own reading; flag if jump > 5,000)
   - Fuel: 1/2
   - Concern (verbatim): "brake squeal at highway speeds, started this week"
   - Walk-around: photos of corners, note any dents
4. `labor-book` — likely ops:
   - `LB-INSPECT` Multi-Point Inspection (0.3 hr, $40.50)
   - `LB-BRAKEFR` Brake Pad Replacement Front (1.5 hr, $202.50)
   - `LB-ROTORFR` Brake Rotor Replacement Front (0.5 hr, $67.50) — *if* rotors are out of spec
5. `parts` — Subaru not in current pads catalog → use Wagner equivalent or
   note **special-order**; surface a "Vendors → check Worldpac" task.
6. Build `estimates`:
   - Lines: inspection + front pads (parts + labor) + optional rotors line
   - Subtotal → tax 8.25% on parts → shop fee 7% on labor → total
   - Mark **estimate**, not work order, until customer approves.
7. Print or text estimate (her `pref` is empty; default to text). Total ~ $480-$650.

## Decision points

| Condition | Branch |
|---|---|
| New customer | Branch to `customer-new` flow first (collect name/phone/email) |
| VIN unknown | Use `vin-decoder` to populate year/make/model/engine |
| Vehicle under warranty (V010 Ram, V011 BMW) | Flag dealer-coverage check before estimating |
| Vehicle has open TSB / recall | Surface from `tsb` — could be free fix |
| Mileage in jumps > 5,000 since last visit | Suggest catch-up services (e.g., tire rotation, fluid checks) |
| Customer is fleet (C003, C009 `pref: 'Fleet account'`) | Different price book, PO required from fleet manager |
| Customer wants OEM only (C010 Taylor, V011 BMW) | Filter `parts` to OEM list; pricing higher |

## Exceptions

- **Loaner needed** (C012 Thomas `pref: 'Loaner needed'`) → check loaner inventory before promising same-day.
- **Diagnostic-only** start (CEL on, customer doesn't know what's wrong) → estimate is for `LB-DIAG` first, then revised estimate after.
- **Customer can't approve in person** → set follow-up reminder; estimate expires in 7 days.

## Suggested agent decomposition

- **Check-In Capture Agent** — turns the front-counter conversation into a structured concern + mileage + photos.
- **History-Aware Service Advisor Agent** — looks at `serviceHistory` and proposes catch-up items.
- **Labor-Op Mapper Agent** — converts free-text concern → labor codes from `laborBook`.
- **Parts Lookup Agent** — for each labor op, finds the matching part for this VIN.
- **Warranty/TSB Guard Agent** — flags work that may be covered elsewhere.
- **Customer Preference Agent** — applies `pref` (text vs call, OEM only, fleet PO).
- **Estimate Formatter Agent** — produces the printable/textable PDF.

## Demo "tomorrow" payoff

> "Pete asks one question — what's the concern? — and ShopBrain spits out a
> printable estimate that includes the right labor ops, the right parts for
> that VIN, catch-up services based on history, and a TSB check. Pete
> reviews, edits, sends to the customer."
