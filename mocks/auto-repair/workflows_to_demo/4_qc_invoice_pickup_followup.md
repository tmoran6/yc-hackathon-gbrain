# Workflow 4 — QC, Invoice, Pickup, Follow-Up

> The completion-side flow. A tech finishes the job, the writer QCs it,
> invoices it, hands the keys back, and seeds the next service. This is
> where most shops leak revenue — the "we'll call you" that never happens.

---

## Trigger

- Tech marks an RO as **READY** in `workorders`
- OR `qc-queue` has aging items (over an hour idle)
- OR scheduled "30 days after service" follow-up tickler fires

## Screens touched

1. `qc-queue` — newly completed ROs awaiting inspection
2. `workorders` — open the RO, review labor + parts + tech notes
3. Vehicle inspection sheet (test drive note, fluid top-off, lights, brakes)
4. `invoices` — convert RO → invoice
5. Payment screen — card / cash / fleet PO / financing
6. Customer record — log service, set next-service reminder
7. `report-warranty` — note any warranty-covered lines
8. (Days later) Follow-up message + review request

## Inputs

- RO with completed labor lines, parts used, tech notes
- Pricing: labor rate, shop fee %, tax rate, customer-specific discounts
- Customer preferred contact (`pref` field)
- Service intervals (oil = 5,000 mi; alignment after suspension work; etc.)

## Step-by-step (concrete on seed data)

Scenario: BMW 330i (V011, Patricia Taylor C010) front brakes from Workflow 2
are done. Tech marks READY.

1. `qc-queue` — pick the BMW RO.
2. Test-drive checklist: brake feel, no pull, no noise, ABS light off.
3. Verify parts used match the estimate (Akebono pads + Brembo rotors, OEM as promised).
4. Lift inspection: torque check, fluid top-off, take after-photos.
5. Convert to `invoices`:
   - Parts: P-BPAD-FRBMW $158 + P-ROT-FRBMW $248 = $406
   - Labor: 2.0 hr × $135 = $270
   - Subtotal: $676
   - Tax 8.25% on parts: $33.50
   - Shop fee 7% on labor: $18.90
   - **Total: $728.40**
6. Text "ready for pickup, $728.40, accept cards / cash."
7. At pickup: take payment, hand keys, deliver inspection sheet + photos.
8. Log to vehicle history (V011, mileage out, work summary).
9. Schedule next-service reminder: next oil service due at +5,000 mi or 6 months.
10. **+3 days:** automated check-in: "How are the brakes?" with review-link if positive.
11. **+30 days:** "Time to check tire wear after that brake work?" — soft upsell.

## Decision points

| Condition | Branch |
|---|---|
| QC finds a problem | Bounce back to tech, do NOT invoice |
| Customer disputes a line | Service writer reviews; reissue or partial discount |
| Warranty job (under powertrain warranty, e.g., V010) | Internal invoice to OEM, not customer |
| Comeback (same issue within 30 days) | Investigate, no charge; logged for tech feedback |
| Fleet account (C003, C009) | Invoice with PO #, terms (Net 30), no card swipe |
| OEM-only customer (C010) | Verify OEM parts used; attach part numbers to invoice |
| 5-star customer history | Skip review request to avoid fatigue |

## Exceptions

- **Tech note flags additional finding** ("noticed CV boot tear") — generate
  a *future* estimate, not a surprise charge.
- **Customer wants pickup after hours** (C005 Brown `pref: 'Pickup after 5pm'`)
  → secure-drop key with code.
- **Payment declined** — hold vehicle per shop policy, contact customer.

## Suggested agent decomposition

- **QC Checklist Agent** — guides the writer through the per-job checklist; blocks invoicing on red flags.
- **Invoice Compiler Agent** — math + tax + shop fee + discounts.
- **Pickup Notification Agent** — drafts ready-for-pickup text in the customer's preferred channel.
- **Service-History Logger Agent** — appends to `serviceHistory` with mileage out and summary.
- **Next-Service Forecaster Agent** — computes when each maintenance item is next due.
- **Follow-Up Cadence Agent** — fires the +3-day and +30-day messages, respecting fatigue.
- **Review-Request Agent** — sends Google review link only on healthy signals.
- **Comeback Detector Agent** — watches for repeat ROs on the same component within 30 days.

## Demo "tomorrow" payoff

> "When a tech hits READY, ShopBrain runs the QC checklist, builds the
> invoice, texts the customer in their preferred channel, logs the work to
> vehicle history, and schedules the next-service reminder. Three days
> later it asks how the car is driving. Pete just signs."
