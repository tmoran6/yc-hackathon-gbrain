/* ============================================================
   Seed Data for GreaseMonkey Shop Manager
============================================================ */

const SEED = {
  meta: {
    version: '6.3.21',
    seeded: true,
    seededAt: new Date().toISOString(),
    shopName: "PETE'S AUTOMOTIVE",
    shopId: '4471',
    shopAddr: '1842 Industrial Blvd, Springfield IL 62703',
    shopPhone: '(217) 555-0420',
    shopLicense: 'IL-RPF-22184',
    laborRate: 135.00,
    taxRate: 0.0825,
    shopFeePct: 0.07,
    operator: 'PETE.S',
  },

  customers: [
    { id: 'C001', last: 'Smith',    first: 'John',     phone: '(217) 555-0118', email: 'jsmith@example.com',    addr: '514 Elm St, Springfield IL 62704',  pref: 'Call for approval' },
    { id: 'C002', last: 'Garcia',   first: 'Maria',    phone: '(217) 555-0144', email: 'mgarcia@example.com',   addr: '88 Oak Ln, Springfield IL 62703',   pref: 'Text approval' },
    { id: 'C003', last: 'Johnson',  first: 'Robert',   phone: '(217) 555-0177', email: 'rjohnson@example.com',  addr: '23 Pine Rd, Springfield IL 62701',  pref: 'Fleet account' },
    { id: 'C004', last: 'Williams', first: 'Linda',    phone: '(217) 555-0190', email: 'lwilliams@example.com', addr: '901 Cedar Ave, Springfield IL 62704', pref: '' },
    { id: 'C005', last: 'Brown',    first: 'David',    phone: '(217) 555-0123', email: 'dbrown@example.com',    addr: '15 Birch Way, Springfield IL 62702', pref: 'Pickup after 5pm' },
    { id: 'C006', last: 'Davis',    first: 'Susan',    phone: '(217) 555-0166', email: 'sdavis@example.com',    addr: '47 Maple Ct, Springfield IL 62704',  pref: '' },
    { id: 'C007', last: 'Miller',   first: 'Michael',  phone: '(217) 555-0182', email: 'mmiller@example.com',   addr: '320 Sycamore, Springfield IL 62701', pref: '' },
    { id: 'C008', last: 'Wilson',   first: 'Karen',    phone: '(217) 555-0140', email: 'kwilson@example.com',   addr: '88 Cedar Ln, Springfield IL 62702',  pref: '' },
    { id: 'C009', last: 'Moore',    first: 'James',    phone: '(217) 555-0136', email: 'jmoore@example.com',    addr: '101 Spruce Dr, Springfield IL 62703', pref: 'Fleet account' },
    { id: 'C010', last: 'Taylor',   first: 'Patricia', phone: '(217) 555-0124', email: 'ptaylor@example.com',   addr: '655 Willow St, Springfield IL 62701', pref: 'Wants OEM parts only' },
    { id: 'C011', last: 'Anderson', first: 'Joseph',   phone: '(217) 555-0111', email: 'janderson@example.com', addr: '199 Magnolia, Springfield IL 62702', pref: '' },
    { id: 'C012', last: 'Thomas',   first: 'Nancy',    phone: '(217) 555-0159', email: 'nthomas@example.com',   addr: '78 Hawthorn Pl, Springfield IL 62704', pref: 'Loaner needed' },
  ],

  vehicles: [
    { id: 'V001', customerId: 'C001', year: 2018, make: 'Honda',    model: 'Civic LX',      vin: '2HGFC2F58JH540918', plate: 'BX4-281K', color: 'Silver',   mileage: 78420, engine: '2.0L I4',         trans: '6MT',  notes: 'Cosmetic dent rear bumper' },
    { id: 'V002', customerId: 'C002', year: 2020, make: 'Toyota',   model: 'Camry SE',      vin: '4T1BG12K9LU772291', plate: 'GH8-194T', color: 'Pearl Wh', mileage: 42100, engine: '2.5L I4',         trans: 'CVT',  notes: '' },
    { id: 'V003', customerId: 'C003', year: 2015, make: 'Ford',     model: 'F-150 XLT',     vin: '1FTFW1EF7FFA22841', plate: 'WRK-7711', color: 'Red',      mileage: 142800, engine: '5.0L V8',        trans: '6AT',  notes: 'Fleet vehicle #7' },
    { id: 'V004', customerId: 'C003', year: 2017, make: 'Ford',     model: 'Transit 250',   vin: '1FTBR1Y86HKB18472', plate: 'WRK-7712', color: 'White',    mileage: 98220, engine: '3.7L V6',         trans: '6AT',  notes: 'Fleet vehicle #11' },
    { id: 'V005', customerId: 'C004', year: 2019, make: 'Subaru',   model: 'Outback 2.5i',  vin: '4S4BSANC8K3219384', plate: 'KL2-883P', color: 'Forest',   mileage: 64300, engine: '2.5L H4',         trans: 'CVT',  notes: '' },
    { id: 'V006', customerId: 'C005', year: 2017, make: 'Chevrolet',model: 'Silverado 1500',vin: '3GCUKREC1HG174420', plate: 'TR8-002Q', color: 'Black',    mileage: 118900, engine: '5.3L V8',        trans: '6AT',  notes: 'Towing package' },
    { id: 'V007', customerId: 'C006', year: 2021, make: 'Mazda',    model: 'CX-5 Touring',  vin: 'JM3KFBCM2M0317842', plate: 'NM1-440D', color: 'Soul Red', mileage: 28100, engine: '2.5L I4',         trans: '6AT',  notes: '' },
    { id: 'V008', customerId: 'C007', year: 2016, make: 'Jeep',     model: 'Wrangler JK',   vin: '1C4HJWDG7GL219476', plate: 'OFF-RD22', color: 'Tan',      mileage: 89500, engine: '3.6L V6',         trans: '5AT',  notes: 'Lift kit installed' },
    { id: 'V009', customerId: 'C008', year: 2014, make: 'Toyota',   model: 'Prius Two',     vin: 'JTDKN3DU0E0381127', plate: 'HYB-2014', color: 'Blue',     mileage: 196700, engine: '1.8L I4 Hybrid', trans: 'eCVT', notes: 'Hybrid - high voltage' },
    { id: 'V010', customerId: 'C009', year: 2022, make: 'Ram',      model: '1500 Big Horn', vin: '1C6RR7LT4NS108273', plate: 'RAM-22BH', color: 'Granite',  mileage: 18400, engine: '5.7L Hemi V8',    trans: '8AT',  notes: 'Under powertrain warranty' },
    { id: 'V011', customerId: 'C010', year: 2018, make: 'BMW',      model: '330i xDrive',   vin: 'WBA8E5C50JA773218', plate: 'BMW-330I', color: 'Alpine',   mileage: 56400, engine: '2.0L I4 Turbo',   trans: '8AT',  notes: 'Customer requests OEM parts only' },
    { id: 'V012', customerId: 'C011', year: 2019, make: 'Ford',     model: 'Mustang GT',    vin: '1FA6P8CF7K5172984', plate: 'FAST-V8',  color: 'Race Red', mileage: 31000, engine: '5.0L V8',         trans: '6MT',  notes: '' },
    { id: 'V013', customerId: 'C012', year: 2020, make: 'Honda',    model: 'CR-V EX',       vin: '5J6RW2H81LL027841', plate: 'CRV-2020', color: 'Modern S', mileage: 51200, engine: '1.5L I4 Turbo',   trans: 'CVT',  notes: '' },
  ],

  // service history (past completed work)
  serviceHistory: [
    { id: 'H001', vehicleId: 'V001', date: '2025-11-12', mileage: 72100, ro: 'RO-15482', summary: 'Oil change, tire rotation', total: 89.42 },
    { id: 'H002', vehicleId: 'V001', date: '2025-08-04', mileage: 67400, ro: 'RO-15201', summary: 'Brake pads front', total: 412.30 },
    { id: 'H003', vehicleId: 'V002', date: '2026-01-22', mileage: 38900, ro: 'RO-16001', summary: '40k mile service', total: 285.10 },
    { id: 'H004', vehicleId: 'V003', date: '2026-03-08', mileage: 138200, ro: 'RO-16412', summary: 'Alternator replacement, serpentine belt', total: 891.50 },
    { id: 'H005', vehicleId: 'V005', date: '2026-02-15', mileage: 60100, ro: 'RO-16203', summary: 'CVT fluid service, cabin air filter', total: 312.40 },
    { id: 'H006', vehicleId: 'V006', date: '2025-12-19', mileage: 114800, ro: 'RO-15721', summary: 'Spark plugs, ignition coils (2)', total: 624.80 },
    { id: 'H007', vehicleId: 'V008', date: '2025-10-30', mileage: 86200, ro: 'RO-15302', summary: 'Battery replacement', total: 246.10 },
    { id: 'H008', vehicleId: 'V009', date: '2026-01-04', mileage: 192100, ro: 'RO-15924', summary: 'Hybrid inverter coolant', total: 188.95 },
    { id: 'H009', vehicleId: 'V011', date: '2026-04-02', mileage: 54100, ro: 'RO-16511', summary: 'Oil service (OEM filter)', total: 134.20 },
  ],

  // labor operations book (flat rate)
  laborBook: [
    { id: 'LB-OIL',       desc: 'Oil & Filter Change Service',     hours: 0.5 },
    { id: 'LB-TIREROT',   desc: 'Tire Rotation',                   hours: 0.3 },
    { id: 'LB-ALIGN',     desc: '4-Wheel Alignment',               hours: 1.0 },
    { id: 'LB-BRAKEFR',   desc: 'Brake Pad Replacement - Front',   hours: 1.5 },
    { id: 'LB-BRAKERR',   desc: 'Brake Pad Replacement - Rear',    hours: 1.5 },
    { id: 'LB-ROTORFR',   desc: 'Brake Rotor Replacement - Front', hours: 0.5 },
    { id: 'LB-ROTORRR',   desc: 'Brake Rotor Replacement - Rear',  hours: 0.5 },
    { id: 'LB-BRAKEFL',   desc: 'Brake System Flush',              hours: 0.8 },
    { id: 'LB-BATT',      desc: 'Battery Replacement',             hours: 0.5 },
    { id: 'LB-ALT',       desc: 'Alternator Replacement',          hours: 2.5 },
    { id: 'LB-START',     desc: 'Starter Motor Replacement',       hours: 2.0 },
    { id: 'LB-PLUGS4',    desc: 'Spark Plug Replacement (4 cyl)',  hours: 0.8 },
    { id: 'LB-PLUGSV6',   desc: 'Spark Plug Replacement (V6/V8)',  hours: 1.5 },
    { id: 'LB-SBELT',     desc: 'Serpentine Belt Replacement',     hours: 0.8 },
    { id: 'LB-TIMING',    desc: 'Timing Belt Replacement',         hours: 4.5 },
    { id: 'LB-WPUMP',     desc: 'Water Pump Replacement',          hours: 3.0 },
    { id: 'LB-COOLANT',   desc: 'Coolant Drain & Refill',          hours: 0.7 },
    { id: 'LB-TRANS',     desc: 'Transmission Fluid Service',      hours: 0.8 },
    { id: 'LB-CAF',       desc: 'Cabin Air Filter Replacement',    hours: 0.3 },
    { id: 'LB-EAF',       desc: 'Engine Air Filter Replacement',   hours: 0.3 },
    { id: 'LB-ACRECHG',   desc: 'A/C Refrigerant Recharge',        hours: 1.0 },
    { id: 'LB-DIAG',      desc: 'Diagnostic - Check Engine Light', hours: 1.0 },
    { id: 'LB-INSPECT',   desc: 'Multi-Point Inspection',          hours: 0.3 },
    { id: 'LB-WIPERS',    desc: 'Wiper Blade Replacement',         hours: 0.2 },
    { id: 'LB-MOUNTS',    desc: 'Tire Mount & Balance (per tire)', hours: 0.3 },
  ],

  // parts catalog - shop's preferred parts with multi-vendor pricing
  parts: [
    { id: 'P-OIL5W30',     pn: 'PEN-5W30-5Q',  oem: '', desc: 'Pennzoil Platinum 5W-30 (5qt)',  cost: 22.40, list: 38.99, stock: 24, category: 'Fluid' },
    { id: 'P-OILFLT-HC',   pn: 'WIX-57045',    oem: '15400-PLM-A02', desc: 'Oil Filter - Honda 1.5/2.0/2.4', cost: 4.20, list: 12.99, stock: 18, category: 'Filter' },
    { id: 'P-OILFLT-TC',   pn: 'WIX-57712',    oem: '04152-YZZA6',   desc: 'Oil Filter - Toyota 2.5/3.5',    cost: 5.10, list: 14.99, stock: 12, category: 'Filter' },
    { id: 'P-OILFLT-FD',   pn: 'MOT-FL500S',   oem: 'BL3Z-6731-B',   desc: 'Oil Filter - Ford EcoBoost/Coyote', cost: 8.80, list: 18.99, stock: 9, category: 'Filter' },
    { id: 'P-CAF-HC',      pn: 'FRM-CF11182',  oem: '80292-T0G-A01', desc: 'Cabin Air Filter - Honda',       cost: 8.40, list: 22.99, stock: 6, category: 'Filter' },
    { id: 'P-EAF-HC',      pn: 'WIX-49043',    oem: '17220-5BA-A00', desc: 'Engine Air Filter - Honda 1.5T', cost: 11.20, list: 26.99, stock: 5, category: 'Filter' },
    { id: 'P-BATT-H6',     pn: 'INT-H6',       oem: '', desc: 'Battery - Interstate H6 / Group 48 (730 CCA)', cost: 142.00, list: 219.99, stock: 4, category: 'Battery' },
    { id: 'P-BATT-65',     pn: 'INT-65',       oem: '', desc: 'Battery - Interstate Group 65 (850 CCA)',     cost: 158.00, list: 249.99, stock: 3, category: 'Battery' },
    { id: 'P-BPAD-FRBMW',  pn: 'AKE-EUR1773A', oem: '34-11-6-885-454', desc: 'Brake Pads Front - BMW 330i (Akebono Euro)', cost: 64.00, list: 158.00, stock: 0, category: 'Brake' },
    { id: 'P-BPAD-FRHC',   pn: 'WAG-QC1654',   oem: '45022-T0G-A02',   desc: 'Brake Pads Front - Honda Civic (Wagner Q)', cost: 38.40, list: 89.99, stock: 4, category: 'Brake' },
    { id: 'P-BPAD-FRTC',   pn: 'BEN-D1212',    oem: '04465-06090',     desc: 'Brake Pads Front - Toyota Camry (Bendix)', cost: 42.00, list: 92.99, stock: 5, category: 'Brake' },
    { id: 'P-BPAD-FRFD',   pn: 'WAG-QC1083',   oem: 'BC3Z-2001-A',     desc: 'Brake Pads Front - Ford F150 (Wagner)',    cost: 56.40, list: 124.99, stock: 2, category: 'Brake' },
    { id: 'P-ROT-FRHC',    pn: 'CEN-12039024', oem: '45251-T0G-A00',   desc: 'Brake Rotor Front - Honda Civic',          cost: 38.80, list: 92.99, stock: 4, category: 'Brake' },
    { id: 'P-ROT-FRBMW',   pn: 'BREMBO-09A271-11', oem: '34-11-6-865-713', desc: 'Brake Rotor Front - BMW 330i (Brembo OE)', cost: 118.00, list: 248.00, stock: 0, category: 'Brake' },
    { id: 'P-ALT-FD150',   pn: 'BOS-AL7704N',  oem: 'FL3Z-10346-A',    desc: 'Alternator - Ford F-150 5.0L (Bosch reman)', cost: 218.00, list: 412.00, stock: 1, category: 'Electrical' },
    { id: 'P-STR-TC',      pn: 'DEN-2800334',  oem: '28100-0V040',     desc: 'Starter Motor - Toyota Camry 2.5L',        cost: 198.00, list: 365.00, stock: 1, category: 'Electrical' },
    { id: 'P-PLUG-NGK',    pn: 'NGK-LFR6AIX-11', oem: '12-12-2-158-252', desc: 'Spark Plug NGK Iridium (per plug)',     cost: 8.20, list: 18.99, stock: 32, category: 'Ignition' },
    { id: 'P-SBELT-FD150', pn: 'GAT-K060841',  oem: 'CR3Z-8620-A',     desc: 'Serpentine Belt - Ford F150 5.0L',         cost: 28.40, list: 64.99, stock: 3, category: 'Belt' },
    { id: 'P-WPUMP-VW',    pn: 'GAT-43022HD',  oem: '06H-121-026-BQ',  desc: 'Water Pump - VW/Audi 2.0T (Gates HD)',     cost: 92.00, list: 198.00, stock: 0, category: 'Cooling' },
    { id: 'P-COOLANT',     pn: 'ZER-AF50',     oem: '', desc: 'Long-Life Coolant Concentrate (1 gal)',     cost: 14.80, list: 32.99, stock: 8, category: 'Fluid' },
    { id: 'P-WIPER22',     pn: 'BSC-22OE',     oem: '', desc: 'Bosch Icon Wiper Blade 22"',                cost: 14.40, list: 32.99, stock: 14, category: 'Misc' },
    { id: 'P-WIPER19',     pn: 'BSC-19OE',     oem: '', desc: 'Bosch Icon Wiper Blade 19"',                cost: 12.80, list: 28.99, stock: 12, category: 'Misc' },
    { id: 'P-SHOPSUP',     pn: 'INT-SHOP',     oem: '', desc: 'Shop Supplies (rags, fluids, hardware)',    cost: 0.50, list: 8.00, stock: 9999, category: 'Misc' },
  ],

  vendors: [
    { id: 'VND-NAPA',    name: 'NAPA Auto Parts',         acct: 'PRO-22184',  phone: '(800) 555-6272', cutoff: '17:00', leadTime: '1 hr local delivery', terms: 'Net 30', primary: true,  brand: 'napa' },
    { id: 'VND-AZ',      name: 'AutoZone Commercial',     acct: 'CC-77291',   phone: '(800) 555-2638', cutoff: '17:00', leadTime: '2 hr local',          terms: 'Net 15', primary: false, brand: 'az' },
    { id: 'VND-OREILLY', name: "O'Reilly Auto Parts",     acct: 'FIRST-4471', phone: '(800) 555-9001', cutoff: '17:00', leadTime: '1.5 hr local',        terms: 'Net 30', primary: false, brand: 'oreilly' },
    { id: 'VND-WPAC',    name: 'WORLDPAC',                acct: 'WP-118277',  phone: '(800) 555-3340', cutoff: '14:00', leadTime: 'Next-day overnight',  terms: 'Net 30', primary: false, brand: 'generic' },
    { id: 'VND-FORD',    name: 'Springfield Ford OEM',    acct: 'WHL-2244',   phone: '(217) 555-1100', cutoff: '15:00', leadTime: '2-3 business days',   terms: 'Prepay',  primary: false, brand: 'generic' },
    { id: 'VND-BMW',     name: 'BMW of Champaign OEM',    acct: 'WHL-887',    phone: '(217) 555-2200', cutoff: '14:00', leadTime: '2-3 business days',   terms: 'Prepay',  primary: false, brand: 'generic' },
  ],

  techs: [
    { id: 'T001', name: 'Mike "Wrench" Petrov',  cert: 'ASE Master',         years: 15, rate: 32.00, skills: ['engine','trans','diag'], status: 'On Job' },
    { id: 'T002', name: 'Carlos Rodriguez',      cert: 'ASE A4-A8',          years: 8,  rate: 26.00, skills: ['brakes','suspension','tires'], status: 'On Job' },
    { id: 'T003', name: 'Tyler Nguyen',          cert: 'ASE A1, A4',         years: 3,  rate: 19.00, skills: ['quicklube','tires','brakes'], status: 'Available' },
    { id: 'T004', name: 'Sarah Chen',            cert: 'ASE Electrical L1',  years: 6,  rate: 28.00, skills: ['electrical','hybrid','diag'], status: 'Available' },
    { id: 'T005', name: 'Jake Burns',            cert: 'Apprentice',         years: 1,  rate: 14.00, skills: ['quicklube'],                 status: 'Lunch' },
  ],

  bays: [
    { id: 'B1', name: 'Bay 1 - Lift',     type: 'general' },
    { id: 'B2', name: 'Bay 2 - Lift',     type: 'general' },
    { id: 'B3', name: 'Bay 3 - Alignment',type: 'align' },
    { id: 'B4', name: 'Bay 4 - Quick Svc',type: 'quick' },
    { id: 'B5', name: 'Bay 5 - Heavy',    type: 'heavy' },
  ],

  // Repair Orders (the central document - estimate, work order, invoice all-in-one)
  repairOrders: [
    {
      id: 'RO-16601', customerId: 'C002', vehicleId: 'V002',
      checkedInAt: '2026-05-16T08:15:00', mileageIn: 42100,
      complaint: 'Customer reports squealing from front brakes when stopping. Noise started ~1 week ago.',
      status: 'IN_PROGRESS',
      tech: 'T002', bay: 'B1',
      laborLines: [
        { id: 'L1', opId: 'LB-BRAKEFR', desc: 'Brake Pad Replacement - Front', hours: 1.5, rate: 135.00, approved: true },
        { id: 'L2', opId: 'LB-ROTORFR', desc: 'Brake Rotor Replacement - Front', hours: 0.5, rate: 135.00, approved: true },
        { id: 'L3', opId: 'LB-INSPECT', desc: 'Multi-Point Inspection', hours: 0.3, rate: 135.00, approved: true },
      ],
      partLines: [
        { id: 'P1', partId: 'P-BPAD-FRTC', desc: 'Brake Pads Front - Toyota Camry', qty: 1, cost: 42.00, list: 92.99, approved: true },
        { id: 'P2', partId: 'P-ROT-FRHC', desc: 'Brake Rotor Front (cross-ref needed)', qty: 2, cost: 38.80, list: 92.99, approved: true },
        { id: 'P3', partId: 'P-SHOPSUP', desc: 'Shop Supplies', qty: 1, cost: 0.50, list: 8.00, approved: true },
      ],
      approvedAt: '2026-05-16T08:42:00', approvedBy: 'Customer SMS', estimateNotes: '',
    },
    {
      id: 'RO-16602', customerId: 'C001', vehicleId: 'V001',
      checkedInAt: '2026-05-16T08:45:00', mileageIn: 78420,
      complaint: 'Check engine light on. Customer says it came on yesterday after fueling.',
      status: 'INSPECTING',
      tech: 'T001', bay: 'B2',
      laborLines: [
        { id: 'L1', opId: 'LB-DIAG', desc: 'Diagnostic - Check Engine Light', hours: 1.0, rate: 135.00, approved: true },
      ],
      partLines: [],
      estimateNotes: 'Awaiting scan results.',
    },
    {
      id: 'RO-16603', customerId: 'C010', vehicleId: 'V011',
      checkedInAt: '2026-05-15T16:00:00', mileageIn: 56400,
      complaint: 'Front brakes worn per customer; wants OEM-quality replacement.',
      status: 'AWAITING_APPROVAL',
      tech: 'T002',
      laborLines: [
        { id: 'L1', opId: 'LB-BRAKEFR', desc: 'Brake Pad Replacement - Front', hours: 1.5, rate: 135.00 },
        { id: 'L2', opId: 'LB-ROTORFR', desc: 'Brake Rotor Replacement - Front', hours: 0.5, rate: 135.00 },
      ],
      partLines: [
        { id: 'P1', partId: 'P-BPAD-FRBMW', desc: 'Brake Pads Front - BMW 330i (Akebono Euro)', qty: 1, cost: 64.00, list: 158.00 },
        { id: 'P2', partId: 'P-ROT-FRBMW', desc: 'Brake Rotor Front - BMW 330i (Brembo OE)', qty: 2, cost: 118.00, list: 248.00 },
      ],
      estimateNotes: 'OEM-quality parts per customer pref. Both pads and rotors out of stock locally.',
      sentToCustomerAt: '2026-05-15T17:30:00',
    },
    {
      id: 'RO-16604', customerId: 'C006', vehicleId: 'V007',
      checkedInAt: '2026-05-16T07:30:00', mileageIn: 28100,
      complaint: 'Scheduled 30k mile service.',
      status: 'IN_PROGRESS',
      tech: 'T003', bay: 'B4',
      laborLines: [
        { id: 'L1', opId: 'LB-OIL', desc: 'Oil & Filter Change Service', hours: 0.5, rate: 135.00, approved: true },
        { id: 'L2', opId: 'LB-TIREROT', desc: 'Tire Rotation', hours: 0.3, rate: 135.00, approved: true },
        { id: 'L3', opId: 'LB-CAF', desc: 'Cabin Air Filter Replacement', hours: 0.3, rate: 135.00, approved: true },
        { id: 'L4', opId: 'LB-INSPECT', desc: 'Multi-Point Inspection', hours: 0.3, rate: 135.00, approved: true },
      ],
      partLines: [
        { id: 'P1', partId: 'P-OIL5W30', desc: 'Pennzoil Platinum 5W-30', qty: 1, cost: 22.40, list: 38.99, approved: true },
        { id: 'P2', partId: 'P-OILFLT-TC', desc: 'Oil Filter - Mazda 2.5', qty: 1, cost: 5.10, list: 14.99, approved: true },
        { id: 'P3', partId: 'P-CAF-HC', desc: 'Cabin Air Filter', qty: 1, cost: 8.40, list: 22.99, approved: true },
        { id: 'P4', partId: 'P-SHOPSUP', desc: 'Shop Supplies', qty: 1, cost: 0.50, list: 8.00, approved: true },
      ],
      approvedAt: '2026-05-16T07:35:00', approvedBy: 'Walk-in approved',
    },
    {
      id: 'RO-16605', customerId: 'C008', vehicleId: 'V009',
      checkedInAt: '2026-05-16T09:10:00', mileageIn: 196700,
      complaint: 'Hybrid battery warning light intermittent. Customer says car has been running fine otherwise.',
      status: 'NEW',
      tech: '',
      laborLines: [],
      partLines: [],
    },
    {
      id: 'RO-16598', customerId: 'C005', vehicleId: 'V006',
      checkedInAt: '2026-05-15T13:00:00', mileageIn: 118900,
      complaint: 'Alternator failing - dim lights and battery warning.',
      status: 'PARTS_PENDING',
      tech: 'T001',
      laborLines: [
        { id: 'L1', opId: 'LB-ALT', desc: 'Alternator Replacement', hours: 2.5, rate: 135.00, approved: true },
        { id: 'L2', opId: 'LB-SBELT', desc: 'Serpentine Belt Replacement', hours: 0.0, rate: 135.00, approved: true },
      ],
      partLines: [
        { id: 'P1', partId: 'P-ALT-FD150', desc: 'Alternator - Ford F-150 5.0L (Bosch reman)', qty: 1, cost: 218.00, list: 412.00, approved: true, onOrder: 'PO-501' },
        { id: 'P2', partId: 'P-SBELT-FD150', desc: 'Serpentine Belt', qty: 1, cost: 28.40, list: 64.99, approved: true },
      ],
      approvedAt: '2026-05-15T14:25:00', approvedBy: 'Customer phone',
      estimateNotes: 'Alternator on order from NAPA - ETA tomorrow AM. Belt in stock.',
    },
    {
      id: 'RO-16599', customerId: 'C004', vehicleId: 'V005',
      checkedInAt: '2026-05-15T11:00:00', mileageIn: 64300,
      complaint: 'Coolant smell after long drive. Possible leak.',
      status: 'READY',
      tech: 'T001',
      laborLines: [
        { id: 'L1', opId: 'LB-COOLANT', desc: 'Coolant Drain & Refill', hours: 0.7, rate: 135.00, approved: true },
        { id: 'L2', opId: 'LB-DIAG', desc: 'Cooling System Pressure Test', hours: 1.0, rate: 135.00, approved: true },
      ],
      partLines: [
        { id: 'P1', partId: 'P-COOLANT', desc: 'Long-Life Coolant', qty: 2, cost: 14.80, list: 32.99, approved: true },
        { id: 'P2', partId: 'P-SHOPSUP', desc: 'Shop Supplies', qty: 1, cost: 0.50, list: 8.00, approved: true },
      ],
      approvedAt: '2026-05-15T11:45:00', approvedBy: 'Customer in-person',
      completedAt: '2026-05-15T16:30:00',
    },
  ],

  partsOrders: [
    {
      id: 'PO-501', vendorId: 'VND-NAPA', createdAt: '2026-05-15T14:30:00',
      status: 'IN_TRANSIT',
      items: [{ partId: 'P-ALT-FD150', qty: 1, cost: 218.00 }],
      forRO: 'RO-16598',
      eta: '2026-05-16 AM',
    },
  ],

  invoices: [
    {
      id: 'INV-16599', roId: 'RO-16599', issuedAt: '2026-05-15T16:35:00',
      subtotal: 244.65, tax: 20.18, shopFee: 17.13, total: 281.96,
      paymentMethod: 'VISA ****4471', paid: true,
    },
  ],

  activityLog: [
    { ts: '2026-05-16T07:00:00', user: 'PETE.S', action: 'OPEN', detail: 'Shop opened. 0 ROs queued from yesterday.' },
    { ts: '2026-05-16T07:35:00', user: 'PETE.S', action: 'CHECKIN', detail: 'RO-16604 checked in (Davis, S - Mazda CX-5)' },
    { ts: '2026-05-16T08:15:00', user: 'PETE.S', action: 'CHECKIN', detail: 'RO-16601 checked in (Garcia, M - Toyota Camry)' },
    { ts: '2026-05-16T08:45:00', user: 'PETE.S', action: 'CHECKIN', detail: 'RO-16602 checked in (Smith, J - Honda Civic)' },
  ],

  counters: {
    customerNext: 13,
    vehicleNext: 14,
    roNext: 16606,
    poNext: 502,
    invNext: 16606,
    laborLineNext: 100,
    partLineNext: 100,
  },
};

window.SEED = SEED;
