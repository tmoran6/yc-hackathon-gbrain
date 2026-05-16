/* ============================================================
   Seed Data for RxMaster Pharmacy ERP
   Loaded into localStorage on first run.
============================================================ */

const SEED = {
  meta: {
    version: '4.2.18',
    seeded: true,
    seededAt: new Date().toISOString(),
    pharmacyName: 'COMMUNITY DRUGS #4471',
    pharmacyDEA: 'AB1234567',
    pharmacyNPI: '1972845631',
    pharmacyAddr: '227 Main Street, Springfield, IL 62704',
    pharmacyPhone: '(217) 555-0144',
    pharmacist: 'James Thompson, RPh',
  },

  patients: [
    { id: 'P001', last: 'Anderson', first: 'Margaret', dob: '1947-03-14', sex: 'F', phone: '(217) 555-0182', addr: '418 Elm St, Springfield IL 62704', allergies: 'Penicillin, Sulfa', insuranceId: 'BCBS-IL-883472119', insurancePlan: 'Blue Cross Blue Shield IL', insuranceBin: '610014', insurancePcn: 'IL', insuranceGroup: 'RETIREE-A', copay: '$10/$30/$50', notes: 'Prefers generic when available' },
    { id: 'P002', last: 'Becker', first: 'Robert', dob: '1962-11-02', sex: 'M', phone: '(217) 555-0166', addr: '901 Oak Ave, Springfield IL 62703', allergies: 'NKDA', insuranceId: 'AET-44218923', insurancePlan: 'Aetna PPO', insuranceBin: '610502', insurancePcn: 'AETNARX', insuranceGroup: 'GRP44182', copay: '$15/$40/$70', notes: '' },
    { id: 'P003', last: 'Chen', first: 'Linda', dob: '1985-06-21', sex: 'F', phone: '(217) 555-0119', addr: '12 Pine Rd, Springfield IL 62701', allergies: 'Codeine', insuranceId: 'UHC-7741290', insurancePlan: 'UnitedHealthcare', insuranceBin: '610279', insurancePcn: 'UHC', insuranceGroup: 'STATEEMP', copay: '$10/$25/$45', notes: '' },
    { id: 'P004', last: 'Davis', first: 'Wesley', dob: '1955-08-30', sex: 'M', phone: '(217) 555-0193', addr: '77 Park Ln, Springfield IL 62702', allergies: 'NKDA', insuranceId: 'MCR-A8847122', insurancePlan: 'Medicare Part D - Humana', insuranceBin: '015599', insurancePcn: 'HUMANA', insuranceGroup: 'PDPCMS01', copay: '$5/$15/$35', notes: 'LOW INCOME SUBSIDY' },
    { id: 'P005', last: 'Espinoza', first: 'Marisol', dob: '1978-02-09', sex: 'F', phone: '(217) 555-0157', addr: '256 Birch Way, Springfield IL 62703', allergies: 'Amoxicillin', insuranceId: 'CIG-928374', insurancePlan: 'Cigna OAP', insuranceBin: '017010', insurancePcn: 'CIGRX', insuranceGroup: '32847A', copay: '$20/$50/$80', notes: '' },
    { id: 'P006', last: 'Foster', first: 'Daniel', dob: '1991-12-17', sex: 'M', phone: '(217) 555-0148', addr: '34 Maple Ct, Springfield IL 62704', allergies: 'NKDA', insuranceId: 'BCBS-IL-771029384', insurancePlan: 'Blue Cross Blue Shield IL', insuranceBin: '610014', insurancePcn: 'IL', insuranceGroup: 'EPO-2', copay: '$10/$30/$60', notes: '' },
    { id: 'P007', last: 'Garcia', first: 'Elena', dob: '1968-04-25', sex: 'F', phone: '(217) 555-0172', addr: '88 Sycamore Dr, Springfield IL 62701', allergies: 'Latex', insuranceId: 'AET-99182734', insurancePlan: 'Aetna HMO', insuranceBin: '610502', insurancePcn: 'AETNARX', insuranceGroup: 'GRP55291', copay: '$15/$35/$65', notes: '' },
    { id: 'P008', last: 'Hayes', first: 'Thomas', dob: '1942-07-08', sex: 'M', phone: '(217) 555-0188', addr: '500 Cedar Ln, Springfield IL 62702', allergies: 'Aspirin', insuranceId: 'MCR-A6647821', insurancePlan: 'Medicare Part D - WellCare', insuranceBin: '004336', insurancePcn: 'MCAIDADV', insuranceGroup: 'PDP-WC-04', copay: '$3/$10/$25', notes: 'Auto-refill enrolled' },
    { id: 'P009', last: 'Iverson', first: 'Karen', dob: '1973-09-11', sex: 'F', phone: '(217) 555-0140', addr: '6 Willow St, Springfield IL 62704', allergies: 'NKDA', insuranceId: 'UHC-3328711', insurancePlan: 'UnitedHealthcare', insuranceBin: '610279', insurancePcn: 'UHC', insuranceGroup: 'EMP-IL', copay: '$10/$25/$50', notes: '' },
    { id: 'P010', last: 'Johnson', first: 'Marcus', dob: '1988-01-28', sex: 'M', phone: '(217) 555-0136', addr: '14 Spruce Ave, Springfield IL 62703', allergies: 'NKDA', insuranceId: 'BCBS-IL-552671190', insurancePlan: 'Blue Cross Blue Shield IL', insuranceBin: '610014', insurancePcn: 'IL', insuranceGroup: 'PPO-1', copay: '$10/$30/$60', notes: '' },
    { id: 'P011', last: 'Kowalski', first: 'Beatrice', dob: '1950-05-19', sex: 'F', phone: '(217) 555-0124', addr: '301 Hawthorn Pl, Springfield IL 62701', allergies: 'Iodine', insuranceId: 'MCR-A7728193', insurancePlan: 'Medicare Part D - Humana', insuranceBin: '015599', insurancePcn: 'HUMANA', insuranceGroup: 'PDPCMS01', copay: '$5/$15/$35', notes: '' },
    { id: 'P012', last: 'Lee', first: 'Jonathan', dob: '1996-10-03', sex: 'M', phone: '(217) 555-0111', andaddr: '199 Magnolia Rd, Springfield IL 62702', allergies: 'NKDA', insuranceId: 'CIG-447293', insurancePlan: 'Cigna OAP', insuranceBin: '017010', insurancePcn: 'CIGRX', insuranceGroup: '99102B', copay: '$20/$50/$80', notes: '' },
  ],

  medications: [
    { id: 'M001', ndc: '00093-7170-56', name: 'Lisinopril 10mg Tab', generic: 'Lisinopril', brand: 'Prinivil', form: 'TABLET', schedule: 'RX', mfr: 'TEVA', awp: 0.08, retail: 0.45, stock: 240, reorderPt: 100, reorderQty: 500, location: 'A-12-3' },
    { id: 'M002', ndc: '00378-3955-93', name: 'Metformin HCL 500mg Tab', generic: 'Metformin', brand: 'Glucophage', form: 'TABLET', schedule: 'RX', mfr: 'Mylan', awp: 0.06, retail: 0.35, stock: 180, reorderPt: 120, reorderQty: 500, location: 'A-12-4' },
    { id: 'M003', ndc: '50111-0648-01', name: 'Atorvastatin 20mg Tab', generic: 'Atorvastatin', brand: 'Lipitor', form: 'TABLET', schedule: 'RX', mfr: 'Pfizer', awp: 0.12, retail: 0.65, stock: 95, reorderPt: 100, reorderQty: 500, location: 'A-13-1' },
    { id: 'M004', ndc: '00591-0405-19', name: 'Amlodipine 5mg Tab', generic: 'Amlodipine', brand: 'Norvasc', form: 'TABLET', schedule: 'RX', mfr: 'Watson', awp: 0.07, retail: 0.40, stock: 310, reorderPt: 100, reorderQty: 500, location: 'A-13-2' },
    { id: 'M005', ndc: '00378-0181-01', name: 'Omeprazole 20mg Cap', generic: 'Omeprazole', brand: 'Prilosec', form: 'CAPSULE', schedule: 'RX', mfr: 'Mylan', awp: 0.18, retail: 0.85, stock: 64, reorderPt: 80, reorderQty: 300, location: 'A-14-1' },
    { id: 'M006', ndc: '00781-5180-01', name: 'Levothyroxine 50mcg Tab', generic: 'Levothyroxine', brand: 'Synthroid', form: 'TABLET', schedule: 'RX', mfr: 'Sandoz', awp: 0.09, retail: 0.50, stock: 22, reorderPt: 60, reorderQty: 300, location: 'A-14-3' },
    { id: 'M007', ndc: '00074-3068-13', name: 'Albuterol HFA 90mcg Inh', generic: 'Albuterol', brand: 'ProAir', form: 'INHALER', schedule: 'RX', mfr: 'Teva', awp: 28.50, retail: 65.00, stock: 8, reorderPt: 10, reorderQty: 24, location: 'B-02-1' },
    { id: 'M008', ndc: '00069-1530-66', name: 'Azithromycin 250mg Tab', generic: 'Azithromycin', brand: 'Zithromax', form: 'TABLET', schedule: 'RX', mfr: 'Pfizer', awp: 1.20, retail: 4.50, stock: 90, reorderPt: 30, reorderQty: 150, location: 'B-03-2' },
    { id: 'M009', ndc: '00093-0058-01', name: 'Hydrocodone-APAP 5/325 Tab', generic: 'Hydrocodone-APAP', brand: 'Norco', form: 'TABLET', schedule: 'C-II', mfr: 'Teva', awp: 0.22, retail: 0.95, stock: 120, reorderPt: 60, reorderQty: 200, location: 'SAFE-1', controlled: true },
    { id: 'M010', ndc: '00185-0124-01', name: 'Alprazolam 0.5mg Tab', generic: 'Alprazolam', brand: 'Xanax', form: 'TABLET', schedule: 'C-IV', mfr: 'Sandoz', awp: 0.15, retail: 0.70, stock: 75, reorderPt: 40, reorderQty: 150, location: 'SAFE-2', controlled: true },
    { id: 'M011', ndc: '00006-0277-31', name: 'Januvia 100mg Tab', generic: 'Sitagliptin', brand: 'Januvia', form: 'TABLET', schedule: 'RX', mfr: 'Merck', awp: 16.80, retail: 22.50, stock: 12, reorderPt: 20, reorderQty: 60, location: 'B-04-2', paRequired: true },
    { id: 'M012', ndc: '00173-0712-20', name: 'Advair Diskus 250/50', generic: 'Fluticasone-Salmeterol', brand: 'Advair', form: 'INHALER', schedule: 'RX', mfr: 'GSK', awp: 410.00, retail: 525.00, stock: 4, reorderPt: 8, reorderQty: 16, location: 'B-02-3', paRequired: true },
    { id: 'M013', ndc: '00781-5036-01', name: 'Sertraline 50mg Tab', generic: 'Sertraline', brand: 'Zoloft', form: 'TABLET', schedule: 'RX', mfr: 'Sandoz', awp: 0.10, retail: 0.55, stock: 140, reorderPt: 60, reorderQty: 300, location: 'A-15-1' },
    { id: 'M014', ndc: '00378-1850-01', name: 'Gabapentin 300mg Cap', generic: 'Gabapentin', brand: 'Neurontin', form: 'CAPSULE', schedule: 'RX', mfr: 'Mylan', awp: 0.11, retail: 0.55, stock: 200, reorderPt: 80, reorderQty: 300, location: 'A-15-3' },
    { id: 'M015', ndc: '00074-3799-13', name: 'Eliquis 5mg Tab', generic: 'Apixaban', brand: 'Eliquis', form: 'TABLET', schedule: 'RX', mfr: 'BMS', awp: 8.40, retail: 11.50, stock: 60, reorderPt: 30, reorderQty: 120, location: 'B-05-1' },
    { id: 'M016', ndc: '49281-0510-50', name: 'Influenza Vaccine 2025-26', generic: 'Influenza', brand: 'Fluzone', form: 'INJECTION', schedule: 'RX', mfr: 'Sanofi', awp: 18.50, retail: 38.00, stock: 145, reorderPt: 50, reorderQty: 200, location: 'FRIDGE-1', vaccine: true },
    { id: 'M017', ndc: '00006-4827-01', name: 'COVID-19 Vaccine 2025', generic: 'Spikevax', brand: 'Moderna', form: 'INJECTION', schedule: 'RX', mfr: 'Moderna', awp: 95.00, retail: 145.00, stock: 30, reorderPt: 20, reorderQty: 100, location: 'FRIDGE-2', vaccine: true },
    { id: 'M018', ndc: '00069-3015-30', name: 'Pneumovax 23', generic: 'Pneumococcal 23-Val', brand: 'Pneumovax', form: 'INJECTION', schedule: 'RX', mfr: 'Merck', awp: 92.00, retail: 138.00, stock: 18, reorderPt: 10, reorderQty: 40, location: 'FRIDGE-1', vaccine: true },
  ],

  prescribers: [
    { id: 'D001', name: 'Patel, Ravi MD', npi: '1881022934', dea: 'BP3399201', specialty: 'Internal Medicine', phone: '(217) 555-2200' },
    { id: 'D002', name: 'Williams, Sarah DO', npi: '1992734401', dea: 'BW4471829', specialty: 'Family Practice', phone: '(217) 555-2155' },
    { id: 'D003', name: 'Nguyen, Brian MD', npi: '1773456112', dea: 'BN8829176', specialty: 'Cardiology', phone: '(217) 555-2208' },
    { id: 'D004', name: 'Martinez, Olivia MD', npi: '1665011239', dea: 'BM2287430', specialty: 'Endocrinology', phone: '(217) 555-2233' },
    { id: 'D005', name: 'Singh, Arjun MD', npi: '1559820113', dea: 'BS5519278', specialty: 'Psychiatry', phone: '(217) 555-2244' },
  ],

  prescriptions: [
    { id: 'RX-2026-100001', patientId: 'P001', medId: 'M001', prescriberId: 'D001', writtenDate: '2026-03-10', sig: 'Take 1 tablet by mouth once daily', qty: 30, daysSupply: 30, refillsAuth: 5, refillsRemaining: 4, lastFilled: '2026-04-12', status: 'ACTIVE' },
    { id: 'RX-2026-100002', patientId: 'P001', medId: 'M003', prescriberId: 'D003', writtenDate: '2026-02-22', sig: 'Take 1 tablet by mouth at bedtime', qty: 30, daysSupply: 30, refillsAuth: 11, refillsRemaining: 9, lastFilled: '2026-04-22', status: 'ACTIVE' },
    { id: 'RX-2026-100003', patientId: 'P002', medId: 'M002', prescriberId: 'D004', writtenDate: '2026-01-15', sig: 'Take 1 tablet by mouth twice daily with meals', qty: 60, daysSupply: 30, refillsAuth: 11, refillsRemaining: 7, lastFilled: '2026-04-15', status: 'ACTIVE' },
    { id: 'RX-2026-100004', patientId: 'P002', medId: 'M011', prescriberId: 'D004', writtenDate: '2026-04-01', sig: 'Take 1 tablet by mouth once daily', qty: 30, daysSupply: 30, refillsAuth: 2, refillsRemaining: 2, lastFilled: '2026-04-01', status: 'ACTIVE' },
    { id: 'RX-2026-100005', patientId: 'P004', medId: 'M015', prescriberId: 'D003', writtenDate: '2026-03-28', sig: 'Take 1 tablet by mouth twice daily', qty: 60, daysSupply: 30, refillsAuth: 5, refillsRemaining: 4, lastFilled: '2026-04-28', status: 'ACTIVE' },
    { id: 'RX-2026-100006', patientId: 'P004', medId: 'M001', prescriberId: 'D001', writtenDate: '2026-03-28', sig: 'Take 1 tablet by mouth once daily', qty: 30, daysSupply: 30, refillsAuth: 5, refillsRemaining: 4, lastFilled: '2026-04-28', status: 'ACTIVE' },
    { id: 'RX-2026-100007', patientId: 'P005', medId: 'M013', prescriberId: 'D005', writtenDate: '2026-04-05', sig: 'Take 1 tablet by mouth once daily in the morning', qty: 30, daysSupply: 30, refillsAuth: 5, refillsRemaining: 5, lastFilled: '2026-04-05', status: 'ACTIVE' },
    { id: 'RX-2026-100008', patientId: 'P006', medId: 'M007', prescriberId: 'D002', writtenDate: '2026-04-18', sig: 'Inhale 2 puffs every 4-6 hours as needed for shortness of breath', qty: 1, daysSupply: 30, refillsAuth: 5, refillsRemaining: 5, lastFilled: '2026-04-18', status: 'ACTIVE' },
    { id: 'RX-2026-100009', patientId: 'P007', medId: 'M012', prescriberId: 'D002', writtenDate: '2026-04-10', sig: 'Inhale 1 puff by mouth twice daily', qty: 1, daysSupply: 30, refillsAuth: 5, refillsRemaining: 5, lastFilled: '2026-04-10', status: 'ACTIVE' },
    { id: 'RX-2026-100010', patientId: 'P008', medId: 'M006', prescriberId: 'D001', writtenDate: '2026-02-01', sig: 'Take 1 tablet by mouth once daily before breakfast', qty: 90, daysSupply: 90, refillsAuth: 3, refillsRemaining: 2, lastFilled: '2026-04-01', status: 'ACTIVE' },
    { id: 'RX-2026-100011', patientId: 'P008', medId: 'M004', prescriberId: 'D003', writtenDate: '2026-02-01', sig: 'Take 1 tablet by mouth once daily', qty: 90, daysSupply: 90, refillsAuth: 3, refillsRemaining: 2, lastFilled: '2026-04-01', status: 'ACTIVE' },
    { id: 'RX-2026-100012', patientId: 'P009', medId: 'M005', prescriberId: 'D002', writtenDate: '2026-04-22', sig: 'Take 1 capsule by mouth once daily 30 min before breakfast', qty: 30, daysSupply: 30, refillsAuth: 5, refillsRemaining: 5, lastFilled: '2026-04-22', status: 'ACTIVE' },
    { id: 'RX-2026-100013', patientId: 'P010', medId: 'M014', prescriberId: 'D005', writtenDate: '2026-04-20', sig: 'Take 1 capsule by mouth three times daily', qty: 90, daysSupply: 30, refillsAuth: 5, refillsRemaining: 4, lastFilled: '2026-04-20', status: 'ACTIVE' },
    { id: 'RX-2026-100014', patientId: 'P011', medId: 'M001', prescriberId: 'D003', writtenDate: '2026-03-15', sig: 'Take 1 tablet by mouth once daily', qty: 30, daysSupply: 30, refillsAuth: 5, refillsRemaining: 3, lastFilled: '2026-04-15', status: 'ACTIVE' },
    { id: 'RX-2026-100015', patientId: 'P003', medId: 'M008', prescriberId: 'D002', writtenDate: '2026-05-10', sig: 'Take 2 tablets by mouth on day 1, then 1 tablet daily on days 2-5', qty: 6, daysSupply: 5, refillsAuth: 0, refillsRemaining: 0, lastFilled: '2026-05-10', status: 'ACTIVE' },
  ],

  // refill queue items - tied to prescriptions
  refillQueue: [
    { id: 'Q-100', rxId: 'RX-2026-100001', patientId: 'P001', medId: 'M001', requestedAt: '2026-05-16T07:42:00', source: 'IVR', status: 'PENDING', notes: '' },
    { id: 'Q-101', rxId: 'RX-2026-100003', patientId: 'P002', medId: 'M002', requestedAt: '2026-05-16T08:11:00', source: 'Mobile App', status: 'PENDING', notes: '' },
    { id: 'Q-102', rxId: 'RX-2026-100005', patientId: 'P004', medId: 'M015', requestedAt: '2026-05-16T08:23:00', source: 'eRx', status: 'PENDING', notes: '' },
    { id: 'Q-103', rxId: 'RX-2026-100006', patientId: 'P004', medId: 'M001', requestedAt: '2026-05-16T08:23:00', source: 'eRx', status: 'PENDING', notes: '' },
    { id: 'Q-104', rxId: 'RX-2026-100010', patientId: 'P008', medId: 'M006', requestedAt: '2026-05-16T06:58:00', source: 'Auto-Refill', status: 'PENDING', notes: 'Auto-refill enrollment' },
    { id: 'Q-105', rxId: 'RX-2026-100014', patientId: 'P011', medId: 'M001', requestedAt: '2026-05-16T09:02:00', source: 'Phone', status: 'PENDING', notes: 'Caller requested same-day pickup' },
    { id: 'Q-106', rxId: 'RX-2026-100008', patientId: 'P006', medId: 'M007', requestedAt: '2026-05-16T09:18:00', source: 'Walk-in', status: 'PENDING', notes: '' },
    { id: 'Q-107', rxId: 'RX-2026-100009', patientId: 'P007', medId: 'M012', requestedAt: '2026-05-16T09:30:00', source: 'IVR', status: 'PENDING', notes: '' },
  ],

  suppliers: [
    { id: 'S001', name: 'McKesson Pharmaceutical', acct: 'PHM-44719', phone: '(800) 555-0100', cutoff: '15:00', leadTime: '1 day', terms: 'Net 30', primary: true },
    { id: 'S002', name: 'Cardinal Health', acct: 'CARD-88291', phone: '(800) 555-0220', cutoff: '14:00', leadTime: '1-2 days', terms: 'Net 30', primary: false },
    { id: 'S003', name: 'AmerisourceBergen', acct: 'ASB-22183', phone: '(800) 555-0340', cutoff: '16:00', leadTime: '2 days', terms: 'Net 45', primary: false },
    { id: 'S004', name: 'Generic Source Wholesale', acct: 'GSW-7740', phone: '(800) 555-0411', cutoff: '12:00', leadTime: '3 days', terms: 'Net 30', primary: false, generic: true },
  ],

  purchaseOrders: [
    { id: 'PO-2026-04471', supplierId: 'S001', createdAt: '2026-05-14T15:22:00', status: 'RECEIVED', items: [
      { medId: 'M004', qty: 500, unitCost: 0.07, received: 500 },
      { medId: 'M013', qty: 300, unitCost: 0.10, received: 300 },
    ], notes: 'Routine weekly order' },
    { id: 'PO-2026-04472', supplierId: 'S001', createdAt: '2026-05-15T14:55:00', status: 'IN_TRANSIT', items: [
      { medId: 'M005', qty: 300, unitCost: 0.18, received: 0 },
      { medId: 'M008', qty: 150, unitCost: 1.20, received: 0 },
    ], notes: '' },
  ],

  claims: [
    { id: 'C-2026-77001', rxFillId: 'F-100001', patientId: 'P001', medId: 'M001', billed: 13.50, paid: 3.50, copay: 10.00, status: 'PAID', submittedAt: '2026-04-12T11:14:00' },
    { id: 'C-2026-77002', rxFillId: 'F-100002', patientId: 'P002', medId: 'M011', billed: 675.00, paid: 0.00, copay: 0.00, status: 'REJECTED', rejectCode: '75', rejectReason: 'PRIOR AUTHORIZATION REQUIRED', submittedAt: '2026-05-15T16:20:00' },
    { id: 'C-2026-77003', rxFillId: 'F-100003', patientId: 'P007', medId: 'M012', billed: 525.00, paid: 0.00, copay: 0.00, status: 'REJECTED', rejectCode: '75', rejectReason: 'PRIOR AUTHORIZATION REQUIRED', submittedAt: '2026-05-16T09:32:00' },
    { id: 'C-2026-77004', rxFillId: 'F-100004', patientId: 'P004', medId: 'M015', billed: 345.00, paid: 340.00, copay: 5.00, status: 'PAID', submittedAt: '2026-04-28T10:08:00' },
  ],

  priorAuths: [
    { id: 'PA-2026-301', patientId: 'P002', medId: 'M011', prescriberId: 'D004', status: 'PENDING_PROVIDER', requestedAt: '2026-05-15T16:25:00', diagnosis: 'E11.9 - Type 2 diabetes mellitus without complications', notes: 'Fax sent to Dr. Martinez office' },
    { id: 'PA-2026-302', patientId: 'P007', medId: 'M012', prescriberId: 'D002', status: 'PENDING_INSURANCE', requestedAt: '2026-05-16T09:45:00', diagnosis: 'J45.40 - Moderate persistent asthma', notes: '' },
  ],

  appointments: [
    { id: 'A-001', patientId: 'P008', type: 'Flu Vaccine', medId: 'M016', date: '2026-05-16', time: '10:30', status: 'SCHEDULED', staff: 'jthompson' },
    { id: 'A-002', patientId: 'P011', type: 'Pneumonia Vaccine', medId: 'M018', date: '2026-05-16', time: '14:00', status: 'SCHEDULED', staff: 'jthompson' },
    { id: 'A-003', patientId: 'P001', type: 'Medication Review', date: '2026-05-17', time: '11:00', status: 'SCHEDULED', staff: 'jthompson' },
  ],

  notifications: [
    { id: 'N-001', to: 'P001', channel: 'SMS', body: 'Your prescription for Lisinopril is ready for pickup at Community Drugs.', sentAt: '2026-05-15T14:30:00' },
  ],

  activityLog: [
    { ts: '2026-05-16T07:05:00', user: 'jthompson', action: 'LOGIN', detail: 'User logged in' },
    { ts: '2026-05-16T07:08:00', user: 'jthompson', action: 'DAY_OPEN', detail: 'Daily open: cash drawer reconciled, $250.00 starting' },
  ],

  counters: {
    rxNext: 100016,
    queueNext: 108,
    poNext: 4473,
    claimNext: 77005,
    paNext: 303,
    apptNext: 4,
    notifNext: 2,
  },
};

window.SEED = SEED;
