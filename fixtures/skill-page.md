# Daily Opening Routine

> Skill captured from observed work. Compiled truth above the line, append-only evidence below it. Review and refine before turning into agents.

**Trigger:** Start of the business day, before lunch service prep begins
**Apps involved:** Toast POS, Google Sheets, Supplier Portal, WhatsApp
**Status:** Draft — pending operator review

## Required inputs

- Yesterday's sales report
- Current inventory spreadsheet
- Supplier portal credentials

## Procedure

1. Open the POS dashboard and review yesterday's sales by item
2. Compare top-selling dishes against the inventory spreadsheet
3. Identify ingredients below the reorder threshold
4. Log into the supplier portal and add low-stock items to the cart
5. Submit the produce order
6. Send the prep list to the kitchen staff chat

## Decision points

- If an ingredient is above its reorder threshold, skip it from the order
- If a top seller is at risk of selling out, flag it as a menu availability concern

## Exceptions

- Supplier portal is down — fall back to phoning the order in
- An item is out of stock at the supplier — pick a substitute or alert the chef

## Suggested automations

- Sales Summary Agent — pulls and summarizes yesterday's POS sales
- Inventory Gap Agent — flags ingredients below threshold
- Supplier Ordering Agent — drafts the produce cart for approval
- Staff Briefing Agent — posts the prep list to the kitchen chat

---

## Timeline

### 2026-05-16 — Captured from screen recording

Source session `session_2026-05-16_11-53-52` (44.6s recording, 89 frames, model gemini-2.5-flash).

**Narration:** Maria walks through her morning routine, checking yesterday's sales and ordering produce before service.

#### Observed steps

- **0–14.9s — Toast POS:** Reviewing yesterday's sales by menu item _(confidence 86%)_
  - Opened the Toast POS dashboard
  - Selected yesterday's date range
  - Sorted the sales report by quantity sold
- **15–29.8s — Google Sheets:** Comparing top sellers against the inventory sheet _(confidence 79%)_
  - Opened the inventory tracking spreadsheet
  - Cross-referenced best-selling dishes with stock counts
  - Highlighted ingredients below the reorder threshold
- **30–44.6s — Supplier Portal:** Placing a produce order and notifying kitchen staff _(confidence 83%)_
  - Logged into the produce supplier portal
  - Added low-stock items to the cart
  - Submitted the order
  - Sent the prep list to the kitchen WhatsApp group

#### Clarifying questions for the operator

- How do you decide an ingredient is low enough to reorder? — _Pins down the exact rule the Inventory Gap Agent should apply._
- Should the supplier order be submitted automatically or wait for your approval? — _Determines whether the Supplier Ordering Agent acts or only drafts._
- Who on the kitchen team needs the prep list, and on which channel? — _Defines where the Staff Briefing Agent should post._
