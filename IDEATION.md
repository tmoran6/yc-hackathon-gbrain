A strong framing: **“teach the company brain by doing the work once.”**

Instead of asking a non-technical owner to write SOPs, prompts, automations, or GStack skills, your tool watches real work, turns it into reusable workflows, and gradually builds the company brain from observation.

**Core Product**
Call it something like **Work Recorder**, **Skill Capture**, or **Brainseed**.

The user flow is simple:

1. Owner clicks **Record Work**
2. They do a normal task on screen
3. The system segments the work into steps
4. AI asks a few clarifying questions
5. It generates a reusable skill:
   - what triggers the workflow
   - what apps are involved
   - required inputs
   - step-by-step procedure
   - decision points
   - exceptions
   - suggested automations
6. The skill is committed to GStack and shared into GBrain
7. Over time, agents learn how the business runs

The key is: **the business does not adopt AI first. AI adapts to the business first.**

---

## Concrete Use Cases

### 1. Small Pharmacy

A neighborhood pharmacy probably has tons of repeatable workflows, but they live in employees’ heads.

Screen-based workflows:

- Processing refill requests
- Checking insurance coverage
- Handling prior authorizations
- Ordering low-stock medications
- Reconciling supplier invoices
- Scheduling vaccine appointments
- Responding to customer questions
- Preparing daily compliance reports

Example captured workflow:

**“Medication Refill Workflow”**

Observed steps:

1. Open pharmacy management system
2. Search patient
3. Check refill eligibility
4. Verify insurance
5. Check inventory
6. If medication is in stock, mark for fulfillment
7. If not in stock, create supplier order
8. Notify customer when ready

Generated agents:

- **Refill Intake Agent**: watches incoming refill requests
- **Inventory Check Agent**: checks whether item is available
- **Supplier Order Agent**: creates draft restock orders
- **Customer Notification Agent**: sends pickup messages
- **Exception Agent**: flags insurance rejections or pharmacist approval needs

Integrated company brain:

> “When refill demand spikes for a medication, check stock, forecast shortage, create supplier order, and notify staff before customers are affected.”

That is much more valuable than a single automation.

---

### 2. Small Restaurant

Restaurants have a lot of semi-digital workflows: POS, reservations, delivery tablets, supplier portals, payroll, scheduling.

Screen-based workflows:

- Checking yesterday’s sales
- Creating prep lists
- Ordering ingredients
- Updating menu availability
- Handling delivery platform issues
- Creating staff schedules
- Responding to catering inquiries
- Reconciling tips and payroll
- Posting daily specials

Example captured workflow:

**“Daily Opening Workflow”**

Observed steps:

1. Open POS dashboard
2. Check yesterday’s sales by item
3. Compare top-selling dishes against inventory
4. Open supplier portal
5. Order missing ingredients
6. Update prep list
7. Message kitchen staff
8. Update unavailable menu items on delivery apps

Generated agents:

- **Sales Summary Agent**
- **Prep Forecast Agent**
- **Supplier Ordering Agent**
- **Menu Availability Agent**
- **Staff Briefing Agent**

Integrated flow:

> Sales data feeds prep planning, prep planning feeds supplier orders, supplier orders affect menu availability, and menu changes update delivery platforms.

That starts to look like an operating system for the restaurant.

---

### 3. Local Retail Shop

Think boutique, hardware store, pet shop, flower shop, bookstore.

Screen-based workflows:

- Reordering inventory
- Uploading new products to Shopify/Square
- Handling returns
- Replying to customer emails
- Creating social posts
- Reconciling POS sales
- Sending invoices
- Updating vendor spreadsheets

Example captured workflow:

**“Restock Bestsellers”**

Observed steps:

1. Export sales report from POS
2. Sort by best-selling SKUs
3. Compare against inventory
4. Open vendor site
5. Add items to cart
6. Check minimum order quantities
7. Submit or save draft order
8. Update inventory spreadsheet

Generated agents:

- **Bestseller Monitor**
- **Inventory Gap Agent**
- **Vendor Cart Agent**
- **Restock Approval Agent**

Integrated flow:

> If a product sells faster than usual, the system drafts a reorder and suggests a social post while demand is high.

---

### 4. Hair Salon or Barbershop

Good mom-and-pop example because workflows are simple but high-friction.

Screen-based workflows:

- Booking appointments
- Confirming no-shows
- Managing stylist schedules
- Ordering supplies
- Sending birthday promos
- Following up after appointments
- Tracking client preferences

Example skill:

**“New Appointment Booking”**

Observed steps:

1. Open booking system
2. Search customer
3. Select stylist
4. Check availability
5. Book slot
6. Send confirmation
7. Add notes about service requested

Generated agents:

- **Booking Agent**
- **Reminder Agent**
- **Client Notes Agent**
- **Rebooking Agent**

Integrated flow:

> After a haircut, the system waits five weeks, checks stylist availability, and sends a personalized rebooking message.

---

### 5. Auto Repair Shop

These businesses often run on a mix of email, PDFs, parts websites, estimates, and phone calls.

Screen-based workflows:

- Creating repair estimates
- Looking up parts
- Ordering parts
- Scheduling repairs
- Sending customer approvals
- Updating job status
- Creating invoices
- Warranty claim filing

Example skill:

**“Repair Estimate Workflow”**

Observed steps:

1. Open customer record
2. Enter vehicle details
3. Look up parts
4. Add labor estimate
5. Create PDF estimate
6. Email customer
7. Wait for approval
8. Convert estimate to work order

Generated agents:

- **Estimate Drafting Agent**
- **Parts Lookup Agent**
- **Approval Follow-up Agent**
- **Invoice Agent**

Integrated flow:

> Customer approval triggers parts ordering, scheduling, and job-board updates automatically.

---

## Best Hackathon Demo Vertical

I would pick **small restaurant** or **local pharmacy**.

Restaurant is easier to explain and demo visually. Pharmacy is higher-value and more “company brain” serious, but you need to be careful around compliance and patient data.

For hackathon impact, I’d demo a restaurant:

**Demo story:**

> “Maria owns a small restaurant. She has never used AI. She presses record and does her normal morning routine: checks POS sales, updates inventory, orders ingredients, and messages staff. Our system watches, segments the workflow, generates four GStack skills, commits them, and wires them into GBrain. Tomorrow, GBrain can run the morning briefing for her.”

The generated skills might be:

- `summarize_daily_sales`
- `generate_prep_list`
- `draft_supplier_order`
- `send_staff_briefing`

Then show the combined workflow:

> “Every morning at 7 AM, generate sales summary, forecast prep needs, draft supplier order, and prepare staff message.”

That is concrete and understandable.

---

## How To Handle Work Outside The Computer

You are right that screen-watching is limited, but you can extend the same idea with lightweight capture methods.

Possible approaches:

- **Mobile camera mode**: worker records a physical task, like opening inventory boxes or setting up the kitchen.
- **Voice narration**: “I’m checking whether we have enough tomatoes for lunch service.”
- **Photo capture**: snap receipts, shelves, invoices, handwritten notes, delivery slips.
- **Barcode scanning**: scan products during restock or receiving.
- **POS/event integrations**: use digital traces from sales, appointments, payments, inventory systems.
- **Checklists on phone/tablet**: workers tap through physical steps, creating structured data.
- **QR codes on stations**: scan “opening checklist,” “cash drawer close,” “delivery received,” etc.
- **Before/after photos**: useful for cleaning, stocking, merchandising, repair work.

The broader principle:

> The screen recorder captures digital workflows. The phone captures physical workflows. GBrain unifies both into company memory.

---

## The Big Vision

The end state is not “AI writes SOPs.”

The end state is:

1. Observe how the company works
2. Convert repeated behavior into skills
3. Let humans approve/refine them
4. Turn skills into agents
5. Compose agents into business processes
6. Let the company brain run routine operations with human approval where needed

For non-technical businesses, the killer feature is that they do not need to understand agents, prompts, or automation.

They just do their job once while the system watches. Then the company brain learns.