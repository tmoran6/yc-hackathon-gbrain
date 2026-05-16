# Workflow 3 — Morning Bay & Technician Plan

> Pete's 7:30 AM ritual. Sort today's work by promise time, fit it into 5
> bays and N techs, and have the staff briefing ready before the first car
> rolls in. Recording this one captures all the "shop-floor common sense"
> that lives only in Pete's head.

---

## Trigger

- Daily 7:30 AM
- OR any same-day add (walk-in, breakdown tow-in) forces a replan
- OR a tech calls in sick

## Screens touched

1. `dashboard` — count open ROs (status bar: `OPEN RO: N`, `BAY: 0/5`)
2. `workorders` — filter status SCHEDULED or IN-PROGRESS for today
3. `bays` → Bay/Tech Schedule grid
4. `techs` — see who's in today, their skills & flat-rate book this week
5. `parts-orders` — confirm anything promised "today" actually arrived
6. `report-tech-prod` — yesterday's productivity (over/under flag)
7. Print or send Slack/text "morning briefing" to staff

## Inputs

- Today's scheduled work orders (each with: vehicle, labor hours, promise time, parts status)
- Bay constraints (5 bays; some have lift size or alignment rack)
- Tech roster: name, certifications, today's hours
- Parts arrival schedule (vendor cutoffs / morning deliveries)

## Step-by-step

1. Pull all WO for today: SCHEDULED + carried-over IN-PROGRESS.
2. For each, mark **parts-ready** (stock or arriving today before slot).
   - If a WO has parts NOT arriving → push to next slot OR call customer to reschedule.
3. Sort by promise time. Pack into bays:
   - Long jobs (timing belt, water pump, alternator) → first slot in their bay.
   - Quick services (oil + rotation, wipers, batteries) → interleave in fast lane.
   - Alignment requires the rack bay.
   - Hybrid (V009) requires HV-certified tech (cert constraint).
4. Resolve conflicts. Each bay gets a printable schedule.
5. Compute each tech's *book hours* for the day (sum of flat-rate ops assigned).
   - Target: 7.5+ billable hours per 8-hour shift.
   - Under-loaded tech → pull a job from the backlog (deferred customer estimates).
   - Over-loaded tech → push a job to tomorrow, message customer.
6. Generate morning briefing:
   - "Today: 12 ROs, 38 book hours, 5 bays full from 9-3."
   - Per-tech assignment cards (RO #, vehicle, ops, promise time).
   - Heads-up list: BMW front brakes (Euro, Bay 3, OEM parts arrived), Ram warranty check (call dealer first), Prius HV coolant (HV-cert tech only).
7. Print to bay-side printer; SMS techs.

## Decision points

| Condition | Branch |
|---|---|
| Parts not arriving | Reschedule WO, customer notification needed |
| Tech sick | Reassign their ROs by skill match; may need to push some |
| Walk-in adds a job | Insert into earliest fitting slot; recompute promise times |
| Over capacity (more book hours than tech hours available) | Push lowest-priority WO, message that customer |
| Alignment needed | Reserve alignment bay; if rack down for service, push |
| Hybrid / EV work | Block HV-certified tech window |
| Diagnostics with unknown labor | Allocate 1.0 hr ceiling, plan to revise at noon |

## Exceptions

- **Loaner unavailable** for C012 Thomas → reschedule her drop-off only.
- **Fleet vehicles** (C003, C009) → fleet manager may want batch scheduling on a slow day.
- **Customer-supplied parts** — accept but no warranty on those; mark RO accordingly.

## Suggested agent decomposition

- **Parts-Readiness Agent** — confirms every WO has all parts on-shelf or arriving in time.
- **Schedule Packer Agent** — bin-packs ROs into bays respecting capacity and skill.
- **Promise-Time Agent** — keeps each customer's promised completion realistic.
- **Tech Load-Balancer Agent** — watches per-tech book hours, redistributes to hit 7.5 hr target.
- **Briefing Drafter Agent** — generates the morning per-bay/per-tech printout + Slack/SMS to staff.
- **Replan Agent** — kicks in on disruptions (sick call, parts no-show, walk-in emergency).

## Demo "tomorrow" payoff

> "ShopBrain hands Pete a packed bay schedule at 7:25 AM. Every tech sees
> their day on their phone. Every customer's promise time is realistic.
> When something slips, the plan reshapes and the right customer gets the
> right text."
