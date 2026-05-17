---
title: Process New Client Appointment Request
type: workflow
apps: [Google Chrome, Gmail, Google Sheets]
trigger: A new email arrives from a client expressing interest in booking an appointment.
captured_at: 2026-05-16T23:33:36.781Z
session_id: 1c72be78-8532-4e26-bb43-ed635f5a6654
captured_from: session_2026-05-16_15-19-49
confirmed_by: Elith Palomino
---

# Process New Client Appointment Request

**Trigger:** A new email arrives from a client expressing interest in booking an appointment.

**Apps involved:** Google Chrome, Gmail, Google Sheets

**Required inputs:**
- New client email (containing client name, desired appointment date, and time)
- URL/location of the "New clients" Google Sheet

## Procedure

1. Open the new client request email in Gmail.
2. Extract the client's full name from the email.
3. Switch to the "New clients" Google Sheet.
4. Locate the next available row for a new client entry.
5. Input the extracted client's name into the 'Client Name' column of that row.
6. Extract the desired appointment date from the email.
7. Input the extracted appointment date into the 'Appointment Date' column of that row.
8. Extract the desired appointment time from the email.
9. Input the extracted appointment time into the 'Appointment Time' column of that row.
10. Save or finalize the entry in the Google Sheet.

## Decision points

- Is the email a new client request?
- Are all required details (name, date, time) present in the email?
- Which row in the Google Sheet should be used for the new client?

## Exceptions

- Email does not contain all necessary information (name, date, time).
- Client name is ambiguous or not clearly stated.
- Google Sheet is not accessible or the "New clients" tab is missing.
- Incorrect cell is selected for data entry.
- Date or time format in the email is inconsistent or unclear.

## Suggested automations

- Email Parser Agent: An agent that monitors a specific inbox/label for new client request emails, extracts client name, desired date, and time.
- Spreadsheet Update Agent: An agent that takes extracted client details and automatically inputs them into the next available row in the "New clients" Google Sheet.
- Appointment Confirmation Agent: After recording, an agent could draft a confirmation email to the client with the recorded details.

---

## Timeline

- 2026-05-16T23:33:36.781Z: Captured from session_2026-05-16_15-19-49 by Elith Palomino
