// Fixture: real recorded session b266a5c7-168c-4743-812a-181cdf1252e1 (Tomer Moran, tagged Demo)
export const analyzerOutput = {
  "audio": {
    "note": "no audio.m4a in session",
    "available": false
  },
  "model": "gemini-2.5-flash",
  "steps": [
    {
      "chunk": 0,
      "end_sec": 14.96,
      "analysis": {
        "apps": [
          "RxMaster Pharmacy Management System",
          "Google Chrome"
        ],
        "action": "The user is registering a new patient in the RxMaster Pharmacy Management System by inputting their demographic details into the 'New Patient Registration' form.",
        "intent": "To create a new patient record within the pharmacy management system for a patient named Tomer Moran.",
        "confidence": 1,
        "primary_app": "RxMaster Pharmacy Management System",
        "ui_elements": [
          "New Patient link in Navigator",
          "Last Name text field",
          "First Name text field",
          "Date of Birth text field",
          "Sex dropdown",
          "Phone text field"
        ],
        "step_by_step": [
          "Clicked on 'New Patient' under 'Patient Records' in the Navigator sidebar.",
          "Typed \"Moran\" into the 'Last Name' field.",
          "Typed \"Tomer\" into the 'First Name' field.",
          "Typed \"1996-10-23\" into the 'Date of Birth' field.",
          "Changed the 'Sex' field from 'F' to 'M'.",
          "Typed \"5146017195\" into the 'Phone' field."
        ]
      },
      "start_sec": 0,
      "frame_count": 21,
      "audio_excerpt": null,
      "sampled_frames": [
        "frame_000000_2026-05-16_13-40-52-899.png",
        "frame_000007_2026-05-16_13-40-57-360.png",
        "frame_000013_2026-05-16_13-41-01-352.png",
        "frame_000020_2026-05-16_13-41-07-859.png"
      ]
    },
    {
      "chunk": 1,
      "end_sec": 29.95,
      "analysis": {
        "apps": [
          "ProMaster Pharmacy Management System"
        ],
        "action": "The user is actively inputting patient demographic details, allergy information, and insurance specifics into a new patient registration form.",
        "intent": "To complete the registration of a new patient within the pharmacy management system.",
        "confidence": 1,
        "primary_app": "ProMaster Pharmacy Management System",
        "ui_elements": [
          "New Patient Registration form",
          "Email text field",
          "Address text field",
          "Allergies text field",
          "Plan text field",
          "Group text field",
          "Notes text area",
          "Save & Open button"
        ],
        "step_by_step": [
          "The user types \"suptom3@gmail.com\" into the Email field.",
          "The user types \"4211 ave West Hill\" into the Address field.",
          "The user types \"NKDA, Penicillin\" into the Allergies field.",
          "The user types \"do something\" into the Plan field under Insurance.",
          "The user types \"A\" into the Group field under Insurance.",
          "The user types \"walk-in\" into the Notes field."
        ]
      },
      "start_sec": 15.46,
      "frame_count": 19,
      "audio_excerpt": null,
      "sampled_frames": [
        "frame_000021_2026-05-16_13-41-08-358.png",
        "frame_000027_2026-05-16_13-41-13-853.png",
        "frame_000033_2026-05-16_13-41-18-357.png",
        "frame_000039_2026-05-16_13-41-22-851.png"
      ]
    },
    {
      "chunk": 2,
      "end_sec": 44.46,
      "analysis": {
        "apps": [
          "ProMaster Pharmacy Management System"
        ],
        "action": "The user is completing patient registration by updating the copay, then navigating through the appointment schedule, and finally initiating a vaccine appointment booking for the newly registered patient.",
        "intent": "To finalize the new patient's details, review existing appointments, and proceed with booking a vaccine appointment for the patient.",
        "confidence": 0.95,
        "primary_app": "ProMaster Pharmacy Management System",
        "ui_elements": [
          "ProMaster Pharmacy Management System application window",
          "New Patient Registration screen",
          "Copay input field",
          "Navigator panel",
          "Appointments section in Navigator",
          "Schedule item in Navigator",
          "Appointment Schedule screen",
          "Vaccine Booking item in Navigator",
          "Vaccine Appointment Booking screen",
          "Patient display field (showing \"Moran, Tomer (Age 26)\")",
          "Date input field (showing \"2026-05-16\")",
          "Vaccine dropdown",
          "Available Slots dropdown",
          "Patient screening & consent completed checkbox",
          "Book Appointment button"
        ],
        "step_by_step": [
          "Typed \"$1000\" into the \"Copay\" field on the \"New Patient Registration\" screen.",
          "Clicked \"Schedule\" under \"Appointments\" in the Navigator panel.",
          "Clicked \"Vaccine Booking\" under \"Appointments\" in the Navigator panel."
        ]
      },
      "start_sec": 30.45,
      "frame_count": 20,
      "audio_excerpt": null,
      "sampled_frames": [
        "frame_000040_2026-05-16_13-41-23-352.png",
        "frame_000046_2026-05-16_13-41-27-351.png",
        "frame_000053_2026-05-16_13-41-32-354.png",
        "frame_000059_2026-05-16_13-41-37-356.png"
      ]
    },
    {
      "chunk": 3,
      "end_sec": 59.96,
      "analysis": {
        "apps": [
          "PROMaster Pharmacy Management System",
          "Google Chrome"
        ],
        "action": "The user is booking a vaccine appointment for a patient, selecting the vaccine type, adding notes, choosing an available time slot, and confirming the booking.",
        "intent": "To successfully schedule a COVID-19 vaccine appointment for Moran, Turner within the pharmacy management system.",
        "confidence": 1,
        "primary_app": "PROMaster Pharmacy Management System",
        "ui_elements": [
          "Vaccine dropdown",
          "Notes text field",
          "Available Slots dropdown",
          "Book Appointment button",
          "Patient screening & consent completed checkbox",
          "Upcoming Appointments table",
          "Confirmation message \"Appointment A-004 Confirmed. Confirmation SMS sent.\""
        ],
        "step_by_step": [
          "The user is on the \"Vaccine Appointment Booking\" screen with patient \"Moran, Turner\" and date \"2026-05-20\" pre-filled.",
          "The user selects \"COVID-19 Vaccine 2025 (stock: 30)\" from the \"Vaccine\" dropdown.",
          "The user types \"notes about the patient here\" into the \"Notes\" text field.",
          "The user clicks on the \"Available Slots\" dropdown to view available appointment times.",
          "The user selects an available time slot (implied, as 13:00 is shown as scheduled in the next frame).",
          "The user clicks the \"Book Appointment\" button (implied, as the appointment is confirmed and the screen changes).",
          "The system navigates to the \"Upcoming Appointments\" screen, displaying the newly booked appointment for Moran, Turner and a confirmation message."
        ]
      },
      "start_sec": 45.46,
      "frame_count": 20,
      "audio_excerpt": null,
      "sampled_frames": [
        "frame_000060_2026-05-16_13-41-38-359.png",
        "frame_000066_2026-05-16_13-41-42-360.png",
        "frame_000073_2026-05-16_13-41-48-359.png",
        "frame_000079_2026-05-16_13-41-52-855.png"
      ]
    }
  ],
  "session": "session_2026-05-16_13-40-52",
  "workflow": {
    "title": "Register New Patient and Book Vaccine Appointment",
    "trigger": "A new patient requires registration in the pharmacy system and needs a vaccine appointment scheduled.",
    "procedure": [
      "Navigate to 'New Patient' under 'Patient Records' in the Navigator sidebar.",
      "Enter the patient's Last Name.",
      "Enter the patient's First Name.",
      "Enter the patient's Date of Birth.",
      "Select the patient's Sex.",
      "Enter the patient's Phone Number.",
      "Enter the patient's Email address.",
      "Enter the patient's Address.",
      "Enter the patient's Allergies.",
      "Enter the Insurance Plan details.",
      "Enter the Insurance Group details.",
      "Enter any general patient notes.",
      "Enter the Copay amount.",
      "Navigate to 'Vaccine Booking' under 'Appointments' in the Navigator panel.",
      "Select the desired Vaccine Type from the dropdown.",
      "Enter specific notes for the vaccine appointment.",
      "View available appointment slots.",
      "Select an available time slot for the appointment.",
      "Book the appointment."
    ],
    "exceptions": [
      "Patient already exists in the system (duplicate record).",
      "Required fields are missing or contain invalid data during patient registration.",
      "No available vaccine stock for the selected vaccine type.",
      "No available appointment slots for the desired date/time.",
      "Insurance details are invalid or cannot be verified.",
      "System error occurs during patient registration or appointment booking."
    ],
    "apps_involved": [
      "Pharmacy Management System"
    ],
    "decision_points": [
      "What is the patient's sex (M/F)?",
      "What are the patient's allergies (e.g., NKDA, specific medications)?",
      "Which insurance plan and group details are applicable?",
      "Which vaccine type needs to be selected?",
      "Which available time slot should be chosen for the vaccine appointment?"
    ],
    "required_inputs": [
      "Patient Last Name",
      "Patient First Name",
      "Patient Date of Birth",
      "Patient Sex",
      "Patient Phone Number",
      "Patient Email",
      "Patient Address",
      "Patient Allergies",
      "Insurance Plan",
      "Insurance Group",
      "General Patient Notes",
      "Copay Amount",
      "Vaccine Type",
      "Vaccine Appointment Notes",
      "Desired Appointment Date",
      "Desired Appointment Time"
    ],
    "suggested_automations": [
      "Patient Data Entry Agent: An agent that can input patient demographic, allergy, and insurance information into the 'New Patient Registration' form.",
      "Vaccine Appointment Booking Agent: An agent that can select the vaccine type, add notes, check for available slots, and book an appointment based on provided preferences.",
      "Duplicate Patient Check Agent: An agent that can automatically check if a patient with similar details already exists before initiating a new registration.",
      "Insurance Verification Agent: An agent that can verify insurance plan and group details against a database."
    ]
  },
  "frame_count": 80,
  "duration_sec": 59.96,
  "generated_at": "2026-05-16T20:53:44.877Z",
  "session_path": "/Users/tmoran/Movies/ScreenRecorder/session_2026-05-16_13-40-52",
  "chunk_seconds": 15
};
