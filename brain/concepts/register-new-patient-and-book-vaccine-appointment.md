---
title: Register New Patient and Book Vaccine Appointment
type: workflow
apps: [Pharmacy Management System]
trigger: A new patient requires registration in the pharmacy system and needs a vaccine appointment scheduled.
captured_at: 2026-05-16T22:20:16.888Z
session_id: b266a5c7-168c-4743-812a-181cdf1252e1
captured_from: session_2026-05-16_13-40-52
confirmed_by: Tomer Moran
---

# Register New Patient and Book Vaccine Appointment

**Trigger:** A new patient requires registration in the pharmacy system and needs a vaccine appointment scheduled.

**Apps involved:** Pharmacy Management System

**Required inputs:**
- Patient Last Name
- Patient First Name
- Patient Date of Birth
- Patient Sex
- Patient Phone Number
- Patient Email
- Patient Address
- Patient Allergies
- Insurance Plan
- Insurance Group
- General Patient Notes
- Copay Amount
- Vaccine Type
- Vaccine Appointment Notes
- Desired Appointment Date
- Desired Appointment Time

## Procedure

1. Navigate to 'New Patient' under 'Patient Records' in the Navigator sidebar.
2. Enter the patient's Last Name.
3. Enter the patient's First Name.
4. Enter the patient's Date of Birth.
5. Select the patient's Sex.
6. Enter the patient's Phone Number.
7. Enter the patient's Email address.
8. Enter the patient's Address.
9. Enter the patient's Allergies.
10. Enter the Insurance Plan details.
11. Enter the Insurance Group details.
12. Enter any general patient notes.
13. Enter the Copay amount.
14. Navigate to 'Vaccine Booking' under 'Appointments' in the Navigator panel.
15. Select the desired Vaccine Type from the dropdown.
16. Enter specific notes for the vaccine appointment.
17. View available appointment slots.
18. Select an available time slot for the appointment.
19. Book the appointment.

## Decision points

- What is the patient's sex (M/F)?
- What are the patient's allergies (e.g., NKDA, specific medications)?
- Which insurance plan and group details are applicable?
- Which vaccine type needs to be selected?
- Which available time slot should be chosen for the vaccine appointment?

## Exceptions

- Patient already exists in the system (duplicate record).
- Required fields are missing or contain invalid data during patient registration.
- No available vaccine stock for the selected vaccine type.
- No available appointment slots for the desired date/time.
- Insurance details are invalid or cannot be verified.
- System error occurs during patient registration or appointment booking.

## Suggested automations

- Patient Data Entry Agent: An agent that can input patient demographic, allergy, and insurance information into the 'New Patient Registration' form.
- Vaccine Appointment Booking Agent: An agent that can select the vaccine type, add notes, check for available slots, and book an appointment based on provided preferences.
- Duplicate Patient Check Agent: An agent that can automatically check if a patient with similar details already exists before initiating a new registration.
- Insurance Verification Agent: An agent that can verify insurance plan and group details against a database.

---

## Timeline

- 2026-05-16T22:20:16.888Z: Captured from session_2026-05-16_13-40-52 by Tomer Moran
