# Workflow 5 — Warranty, TSB & Recall Check

> The "don't charge the customer for what the manufacturer should fix"
> workflow. Before estimating, before ordering parts, before turning a
> wrench — check coverage. Pete already does this from memory for cars he
> knows; recording it lets ShopBrain do it for every car.

---

## Trigger

- Any new estimate is being built (proactive check from Workflow 1)
- Customer specifically asks "is this under warranty?"
- VIN-based weekly sweep of customer base for new recalls
- A failure pattern matches a known TSB symptom

## Screens touched

1. `vehicles` — pull VIN, year, make, model, in-service date, current mileage
2. `vin-decoder` — confirm build / options if VIN ambiguous
3. `tsb` (TSB / Recall Lookup) — search by year/make/model
4. `serviceHistory` — has this complaint been seen before on this VIN?
5. `report-warranty` — log any warranty work for OEM reimbursement claim
6. Customer record — outreach if recall is open

## Inputs

- Vehicle: VIN, year/make/model, mileage, in-service date, prior repairs
- Coverage matrices (need to seed; e.g., powertrain 5/60, hybrid 8/100, recall = lifetime/no-fee)
- TSB / recall feed (mocked entries)

## Coverage guidance (the company brain learns from Pete)

| Vehicle in seed | Coverage hints |
|---|---|
| V010 Ram 1500 2022, 18,400 mi | Basic 3/36, Powertrain 5/60 → **likely covered** |
| V011 BMW 330i 2018, 56,400 mi | Out of basic 4/50; check certified pre-owned extensions |
| V009 Prius 2014, 196,700 mi | Hybrid 8/100 LONG expired; hybrid battery may have CA extended coverage |
| V007 Mazda CX-5 2021, 28,100 mi | Inside basic 3/36 → check |
| V003 / V004 Ford fleet (2015/2017) | Out of basic; fleet may have its own warranty program |

## Step-by-step

1. Workflow 1 raises a complaint (e.g., V010 Ram 5.7 Hemi misfire).
2. Lookup vehicle → see in-service date, current mileage.
3. Compute coverage status:
   - Within basic? Within powertrain? Within emissions (federal 8/80 on emissions parts)?
4. Search `tsb` by year/make/model/engine for matching symptom.
5. Search NHTSA-style recall list by VIN.
6. Render coverage card to writer:
   - "Powertrain warranty — call Ram dealer, do not estimate."
   - OR "Open recall NHTSA-23V-789 covers this — referral letter to dealer."
   - OR "TSB 18-099 matches — known fix is X part."
   - OR "No coverage; proceed with normal estimate."
7. If covered: redirect customer to dealer with paperwork.
8. If TSB applies (paid work): include the TSB # on the estimate; quote the fix the manufacturer documented.
9. If recall: print recall notice; do not perform recall work unless authorized.

## Decision points

| Condition | Branch |
|---|---|
| Inside any active warranty | Refer to dealer, decline estimate |
| Inside emissions warranty AND symptom is emissions-related | Refer to dealer |
| Open recall on the VIN | Print notice, do not perform |
| TSB exists, NOT under warranty | Cite TSB on estimate, use TSB-documented procedure |
| Aftermarket warranty (extended) | Pre-auth call before work; collect plan info |
| Customer insists on shop performing covered work | Document waiver; bill customer; cannot also bill OEM |

## Exceptions

- **Lemon-law repeat** — customer has had same problem 3+ times. Different conversation.
- **Tire/battery prorated warranties** from prior shop visits → check `serviceHistory` for original install date.
- **Internal "goodwill" from manufacturer** (out-of-warranty but covered case-by-case) — escalate to Pete.

## Suggested agent decomposition

- **VIN/Coverage Agent** — for every estimate, computes warranty status against the coverage matrix.
- **Recall Lookup Agent** — VIN → open recalls (weekly sweep + on-estimate).
- **TSB Matcher Agent** — concern text → relevant TSB entries.
- **Dealer-Referral Agent** — drafts the "this is covered, here's where to go" letter.
- **Warranty Reimbursement Agent** — if shop does warranty work (rare for independents but happens), packages the claim for the OEM.
- **Fleet Warranty Agent** — handles C003/C009's fleet-program rules.

## Demo "tomorrow" payoff

> "Before Pete builds an estimate, ShopBrain has already checked basic
> warranty, powertrain, emissions, every open recall on that VIN, and any
> matching TSB. Customers leave Pete's shop trusting him — because he sent
> them to the dealer when the dealer should pay, and gave them a real
> answer when the dealer wouldn't."
