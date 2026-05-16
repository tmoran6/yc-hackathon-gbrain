/* ============================================================
   RxMaster Pharmacy ERP - Application Logic
============================================================ */

// ============ STATE / PERSISTENCE ============
const STORAGE_KEY = 'rxmaster.state.v1';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = JSON.parse(JSON.stringify(window.SEED));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try { return JSON.parse(raw); }
  catch { localStorage.removeItem(STORAGE_KEY); return loadState(); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  router.go('dashboard');
  toast('System reset. Seed data reloaded.', 'info');
}

let state = loadState();

// ============ HELPERS ============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtDate(d) {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtDateTime(d) {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtTime(d) {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toLocaleTimeString('en-US', { hour12: false });
}

function fmtMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return '$' + Number(n).toFixed(2);
}

function age(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const today = new Date('2026-05-16');
  let a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
  return a;
}

function getPatient(id) { return state.patients.find(p => p.id === id); }
function getMed(id) { return state.medications.find(m => m.id === id); }
function getRx(id) { return state.prescriptions.find(r => r.id === id); }
function getPrescriber(id) { return state.prescribers.find(p => p.id === id); }
function getSupplier(id) { return state.suppliers.find(s => s.id === id); }

function patientName(p) {
  if (!p) return '';
  return `${p.last}, ${p.first}`;
}

function nextRxId() { return `RX-2026-${state.counters.rxNext++}`; }
function nextPOId() { return `PO-2026-0${state.counters.poNext++}`; }
function nextClaimId() { return `C-2026-${state.counters.claimNext++}`; }
function nextPAId() { return `PA-2026-${state.counters.paNext++}`; }
function nextApptId() { return `A-00${state.counters.apptNext++}`; }
function nextQId() { return `Q-${state.counters.queueNext++}`; }
function nextNotifId() { return `N-00${state.counters.notifNext++}`; }

function log(action, detail) {
  state.activityLog.unshift({
    ts: new Date().toISOString(),
    user: 'jthompson',
    action,
    detail,
  });
  if (state.activityLog.length > 200) state.activityLog.length = 200;
  saveState();
}

// ============ TOAST ============
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + (kind ? 'toast-' + kind : '');
  t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; }, 2400);
  setTimeout(() => t.remove(), 3000);
}

// ============ MODAL ============
function showModal(title, bodyHtml, buttons = []) {
  return new Promise(resolve => {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHtml;
    const footer = $('#modal-footer');
    footer.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      if (b.primary) btn.className = 'btn-primary';
      if (b.danger) btn.classList.add('btn-danger');
      btn.onclick = () => {
        if (b.onClick) {
          const r = b.onClick();
          if (r === false) return; // keep open
        }
        closeModal();
        resolve(b.value !== undefined ? b.value : b.label);
      };
      footer.appendChild(btn);
    });
    if (buttons.length === 0) {
      const ok = document.createElement('button');
      ok.textContent = 'OK';
      ok.className = 'btn-primary';
      ok.onclick = () => { closeModal(); resolve('OK'); };
      footer.appendChild(ok);
    }
    $('#modal-backdrop').classList.remove('hidden');
  });
}

function closeModal() {
  $('#modal-backdrop').classList.add('hidden');
}

$('#modal-close').onclick = closeModal;

function confirmDialog(title, msg) {
  return showModal(title, `<div style="padding:8px 4px;">${msg}</div>`, [
    { label: 'OK', primary: true, value: true },
    { label: 'Cancel', value: false },
  ]);
}

function alertDialog(title, msg) {
  return showModal(title, `<div style="padding:8px 4px;">${msg}</div>`);
}

// ============ ROUTER / TABS ============
const router = (() => {
  const openTabs = [];
  let activeIdx = -1;

  function go(routeId, params = {}) {
    const def = routes[routeId];
    if (!def) { console.warn('Unknown route', routeId); return; }
    const title = def.title(params);
    // reuse tab if same route+key
    const key = def.key ? def.key(params) : routeId;
    const existing = openTabs.findIndex(t => t.key === key);
    if (existing >= 0) {
      activeIdx = existing;
      openTabs[activeIdx].params = params;
    } else {
      openTabs.push({ key, routeId, params, title });
      activeIdx = openTabs.length - 1;
    }
    renderTabs();
    renderPage();
    highlightNav(routeId);
  }

  function close(idx) {
    openTabs.splice(idx, 1);
    if (activeIdx >= openTabs.length) activeIdx = openTabs.length - 1;
    if (openTabs.length === 0) go('dashboard');
    else { renderTabs(); renderPage(); }
  }

  function renderTabs() {
    const strip = $('#tabstrip');
    strip.innerHTML = '';
    openTabs.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'tab' + (i === activeIdx ? ' active' : '');
      el.innerHTML = `<span class="tab-label">${esc(t.title)}</span><span class="tab-close" data-i="${i}">×</span>`;
      el.onclick = (ev) => {
        if (ev.target.classList.contains('tab-close')) {
          close(i);
        } else {
          activeIdx = i;
          renderTabs();
          renderPage();
        }
      };
      strip.appendChild(el);
    });
  }

  function renderPage() {
    const t = openTabs[activeIdx];
    if (!t) return;
    const def = routes[t.routeId];
    const page = $('#page');
    page.innerHTML = '';
    def.render(page, t.params);
    refreshStatusBar();
  }

  function highlightNav(routeId) {
    $$('.tree-node[data-nav]').forEach(n => {
      n.classList.toggle('active', n.dataset.nav === routeId);
    });
  }

  function current() { return openTabs[activeIdx]; }
  function refresh() { renderPage(); }

  return { go, close, current, refresh };
})();

// ============ STATUS BAR ============
function refreshStatusBar() {
  const pending = state.refillQueue.filter(q => q.status === 'PENDING').length;
  $('#sb-pending-count').textContent = pending;
  const low = state.medications.filter(m => m.stock < m.reorderPt).length;
  $('#sb-low-count').textContent = low;
}

setInterval(() => {
  const d = new Date();
  $('#sb-clock').textContent = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }) + ' ' + d.toLocaleTimeString('en-US', { hour12: false });
}, 500);

// ============ PAGE HEADER HELPER ============
function pageHeader(title, crumbs) {
  return `<div class="page-header"><span>${esc(title)}</span><span class="ph-crumbs">${esc(crumbs || '')}</span></div>`;
}

// ============================================================
// ROUTES (one per screen)
// ============================================================
const routes = {};

// ----------------------------------------------------------------
// DASHBOARD
// ----------------------------------------------------------------
routes.dashboard = {
  title: () => 'Dashboard',
  key: () => 'dashboard',
  render(root) {
    const pending = state.refillQueue.filter(q => q.status === 'PENDING').length;
    const lowStock = state.medications.filter(m => m.stock < m.reorderPt);
    const todayAppts = state.appointments.filter(a => a.date === '2026-05-16');
    const rejectedClaims = state.claims.filter(c => c.status === 'REJECTED').length;
    const activePAs = state.priorAuths.filter(p => p.status.startsWith('PENDING')).length;
    const filledToday = state.activityLog.filter(l => l.action === 'RX_FILLED' && l.ts.startsWith('2026-05-16')).length;
    const revenue = state.claims.filter(c => c.status === 'PAID').reduce((s, c) => s + c.copay + c.paid, 0);

    root.innerHTML = `
      ${pageHeader('Daily Operations Dashboard', 'Home › Dashboard')}

      <div class="demo-scenario-strip">
        <span class="demo-label">QUICK DEMO:</span>
        <button class="btn-primary" onclick="router.go('refill-workflow')">↻ Open Refill Workflow</button>
        <button onclick="window._dashDemoRejected()" style="background:#800000;color:#fff;border-color:#c00;" id="btn-demo-rejected">⚠ Demo: Insurance REJECTED</button>
        <button onclick="router.go('rx-queue')">≡ Refill Queue (${pending} pending)</button>
        <button onclick="router.go('insurance')">⛨ Claims Queue (${rejectedClaims} rejected)</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card ${pending > 5 ? 'warn' : ''}">
          <div class="kpi-label">PENDING REFILLS</div>
          <div class="kpi-value">${pending}</div>
          <div class="kpi-sub">in queue · ${state.refillQueue.length} total</div>
        </div>
        <div class="kpi-card ${lowStock.length > 0 ? 'bad' : ''}">
          <div class="kpi-label">LOW STOCK ITEMS</div>
          <div class="kpi-value">${lowStock.length}</div>
          <div class="kpi-sub">below reorder point</div>
        </div>
        <div class="kpi-card ${rejectedClaims > 0 ? 'warn' : ''}">
          <div class="kpi-label">REJECTED CLAIMS</div>
          <div class="kpi-value">${rejectedClaims}</div>
          <div class="kpi-sub">${activePAs} PA pending</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">APPTS TODAY</div>
          <div class="kpi-value">${todayAppts.length}</div>
          <div class="kpi-sub">${todayAppts.filter(a => a.status === 'SCHEDULED').length} scheduled</div>
        </div>
      </div>

      <div class="dash-cols">
        <!-- LEFT: refill queue summary -->
        <div class="dash-panel">
          <div class="dash-panel-title">▶ Refill Queue (Today)</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>Time</th><th>Patient</th><th>Medication</th><th>Source</th><th>Status</th></tr></thead>
              <tbody>
              ${state.refillQueue.slice(0, 8).map(q => {
                const p = getPatient(q.patientId);
                const m = getMed(q.medId);
                return `<tr data-q="${q.id}">
                  <td class="mono">${fmtDateTime(q.requestedAt).split(' ')[1] || ''}</td>
                  <td>${esc(patientName(p))}</td>
                  <td>${esc(m ? m.name : '')}</td>
                  <td>${esc(q.source)}</td>
                  <td><span class="badge ${q.status === 'READY' ? 'badge-ok' : (q.status === 'REJECTED' ? 'badge-bad' : (q.status === 'ON_ORDER' ? 'badge-warn' : ''))}">${esc(q.status)}</span></td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
            <div class="spacer"></div>
            <button onclick="router.go('rx-queue')">Open Refill Queue ›</button>
          </div>
        </div>

        <!-- RIGHT: low stock + alerts -->
        <div class="dash-panel">
          <div class="dash-panel-title">⚠ Low Stock Alerts</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>NDC</th><th>Medication</th><th>Stock</th><th>Reorder Pt</th><th>Action</th></tr></thead>
              <tbody>
              ${lowStock.map(m => `<tr>
                <td class="mono small">${esc(m.ndc)}</td>
                <td>${esc(m.name)}</td>
                <td class="right ${m.stock < m.reorderPt / 2 ? 'bold' : ''}">${m.stock}</td>
                <td class="right">${m.reorderPt}</td>
                <td><span class="badge badge-bad">REORDER</span></td>
              </tr>`).join('') || '<tr><td colspan="5" class="center muted">No low-stock items.</td></tr>'}
              </tbody>
            </table>
            <div class="spacer"></div>
            <button onclick="router.go('inventory-low')">Open Low Stock Report ›</button>
            <button onclick="router.go('purchasing')">Create PO ›</button>
          </div>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="dash-cols">
        <div class="dash-panel">
          <div class="dash-panel-title">📅 Today's Appointments</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
              ${todayAppts.map(a => {
                const p = getPatient(a.patientId);
                return `<tr><td class="mono">${esc(a.time)}</td><td>${esc(patientName(p))}</td><td>${esc(a.type)}</td><td><span class="badge badge-info">${esc(a.status)}</span></td></tr>`;
              }).join('') || '<tr><td colspan="4" class="center muted">No appointments scheduled.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">📋 Recent Activity</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead>
              <tbody>
              ${state.activityLog.slice(0, 8).map(l => `<tr>
                <td class="mono small">${fmtDateTime(l.ts).split(' ')[1] || ''}</td>
                <td>${esc(l.user)}</td>
                <td class="bold">${esc(l.action)}</td>
                <td>${esc(l.detail)}</td>
              </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};

window._dashDemoRejected = function() {
  router.go('refill-workflow');
  // After routing, trigger the rejected preset (slight delay for render)
  setTimeout(() => {
    if (window._wfDemo) window._wfDemo.presetRejected();
  }, 150);
};

// ----------------------------------------------------------------
// PATIENTS - search/list
// ----------------------------------------------------------------
routes.patients = {
  title: () => 'Patient Search',
  key: () => 'patients',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Patient Search', 'Home › Patient Records › Search')}
      <div class="toolbar-strip">
        <button onclick="router.go('patient-new')">＋ New Patient</button>
        <button id="btn-clear-search">Clear</button>
        <span class="muted">|</span>
        <span>Search by:</span>
        <label><input type="radio" name="searchMode" value="name" checked> Last Name</label>
        <label><input type="radio" name="searchMode" value="dob"> DOB</label>
        <label><input type="radio" name="searchMode" value="phone"> Phone</label>
        <label><input type="radio" name="searchMode" value="id"> Patient ID</label>
        <input id="search-input" type="text" placeholder="Enter search term..." style="width:240px; margin-left:8px;">
        <button id="btn-do-search" class="btn-primary">🔍 Search</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Search Results</span>
        <div class="table-wrap" style="max-height:540px;">
        <table class="data-table" id="patient-table">
          <thead><tr>
            <th>Patient ID</th><th>Last Name</th><th>First Name</th><th>DOB</th><th>Age</th><th>Sex</th>
            <th>Phone</th><th>Insurance</th><th>Allergies</th>
          </tr></thead>
          <tbody></tbody>
        </table>
        </div>
        <div class="spacer"></div>
        <div class="muted small">Double-click a row to open the patient profile.</div>
      </div>
    `;

    const tbody = $('#patient-table tbody');
    function renderRows(rows) {
      tbody.innerHTML = rows.map(p => `<tr data-id="${p.id}">
        <td class="mono">${esc(p.id)}</td>
        <td>${esc(p.last)}</td>
        <td>${esc(p.first)}</td>
        <td class="mono">${fmtDate(p.dob)}</td>
        <td class="right">${age(p.dob)}</td>
        <td>${esc(p.sex)}</td>
        <td class="mono">${esc(p.phone)}</td>
        <td>${esc(p.insurancePlan)}</td>
        <td>${esc(p.allergies || 'NKDA')}</td>
      </tr>`).join('');
      $$('tr', tbody).forEach(tr => {
        tr.ondblclick = () => router.go('patient-profile', { id: tr.dataset.id });
      });
    }
    renderRows(state.patients);

    $('#btn-do-search').onclick = () => {
      const term = $('#search-input').value.trim().toLowerCase();
      const mode = document.querySelector('input[name="searchMode"]:checked').value;
      if (!term) { renderRows(state.patients); return; }
      const f = state.patients.filter(p => {
        if (mode === 'name') return p.last.toLowerCase().startsWith(term);
        if (mode === 'dob') return p.dob.includes(term);
        if (mode === 'phone') return p.phone.includes(term);
        if (mode === 'id') return p.id.toLowerCase().includes(term);
        return false;
      });
      renderRows(f);
      log('PATIENT_SEARCH', `mode=${mode}, term="${term}", ${f.length} results`);
    };
    $('#btn-clear-search').onclick = () => { $('#search-input').value = ''; renderRows(state.patients); };
    $('#search-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btn-do-search').click(); });
  }
};

// ----------------------------------------------------------------
// PATIENT NEW
// ----------------------------------------------------------------
routes['patient-new'] = {
  title: () => 'New Patient',
  key: () => 'patient-new',
  render(root) {
    root.innerHTML = `
      ${pageHeader('New Patient Registration', 'Home › Patient Records › New')}
      <form id="patient-form">
        <div class="groupbox">
          <span class="gb-title">Demographics</span>
          <div class="form-grid">
            <label>Last Name:*</label><input name="last" required>
            <label>First Name:*</label><input name="first" required>
            <label>Date of Birth:*</label><input name="dob" type="date" required>
            <label>Sex:</label>
            <select name="sex"><option>F</option><option>M</option><option>X</option></select>
            <label>Phone:*</label><input name="phone" required placeholder="(217) 555-0000">
            <label>Email:</label><input name="email" type="email">
            <label>Address:</label><input name="addr" class="span-3">
            <label>Allergies:</label><input name="allergies" class="span-3" value="NKDA">
          </div>
        </div>
        <div class="groupbox">
          <span class="gb-title">Insurance</span>
          <div class="form-grid">
            <label>Plan:</label><input name="insurancePlan">
            <label>Member ID:</label><input name="insuranceId">
            <label>BIN:</label><input name="insuranceBin">
            <label>PCN:</label><input name="insurancePcn">
            <label>Group:</label><input name="insuranceGroup">
            <label>Copay:</label><input name="copay" placeholder="$10/$30/$50">
          </div>
        </div>
        <div class="groupbox">
          <span class="gb-title">Notes</span>
          <textarea name="notes" rows="3"></textarea>
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button type="button" onclick="router.go('patients')">Cancel</button>
          <button type="submit" class="btn-primary">Save &amp; Open</button>
        </div>
      </form>
    `;

    $('#patient-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = 'P' + String(state.patients.length + 1).padStart(3, '0');
      const p = { id };
      for (const [k, v] of fd.entries()) p[k] = v;
      state.patients.push(p);
      saveState();
      log('PATIENT_NEW', `Created ${id} ${p.last}, ${p.first}`);
      toast(`Patient ${id} created.`, 'ok');
      router.go('patient-profile', { id });
    };
  }
};

// ----------------------------------------------------------------
// PATIENT PROFILE
// ----------------------------------------------------------------
routes['patient-profile'] = {
  title: (p) => {
    const pt = getPatient(p.id);
    return pt ? `${pt.last}, ${pt.first}` : 'Patient';
  },
  key: (p) => 'patient-' + p.id,
  render(root, params) {
    const p = getPatient(params.id);
    if (!p) { root.innerHTML = '<div class="notice err">Patient not found.</div>'; return; }

    const rxs = state.prescriptions.filter(r => r.patientId === p.id);
    const claims = state.claims.filter(c => c.patientId === p.id);
    const appts = state.appointments.filter(a => a.patientId === p.id);
    const notifs = state.notifications.filter(n => n.to === p.id);

    root.innerHTML = `
      ${pageHeader('Patient Profile — ' + p.last + ', ' + p.first, 'Home › Patient Records › ' + p.id)}

      <div class="toolbar-strip">
        <button onclick="window._wf.startRefill('${p.id}')">↻ Refill Rx</button>
        <button onclick="router.go('rx-new', { patientId: '${p.id}' })">℞ New Prescription</button>
        <button onclick="router.go('insurance-verify', { patientId: '${p.id}' })">⛨ Verify Insurance</button>
        <button onclick="router.go('appointments-vaccine', { patientId: '${p.id}' })">💉 Book Vaccine</button>
        <span class="sb-flex"></span>
        <button onclick="router.go('patients')">← Back to Search</button>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
        <div class="groupbox">
          <span class="gb-title">Demographics</span>
          <div class="form-grid">
            <label>Patient ID:</label><input readonly value="${esc(p.id)}">
            <label>DOB / Age:</label><input readonly value="${fmtDate(p.dob)} (${age(p.dob)} yrs)">
            <label>Sex:</label><input readonly value="${esc(p.sex)}">
            <label>Phone:</label><input readonly value="${esc(p.phone)}">
            <label>Address:</label><input readonly value="${esc(p.addr)}" class="span-3">
            <label>Allergies:</label><input readonly value="${esc(p.allergies)}" class="span-3" style="background:#ffe4e4; font-weight:bold;">
          </div>
        </div>
        <div class="groupbox">
          <span class="gb-title">Insurance</span>
          <div class="form-grid">
            <label>Plan:</label><input readonly value="${esc(p.insurancePlan)}">
            <label>Member ID:</label><input readonly value="${esc(p.insuranceId)}">
            <label>BIN:</label><input readonly value="${esc(p.insuranceBin)}">
            <label>PCN:</label><input readonly value="${esc(p.insurancePcn)}">
            <label>Group:</label><input readonly value="${esc(p.insuranceGroup)}">
            <label>Copay:</label><input readonly value="${esc(p.copay)}">
            <label>Notes:</label><input readonly value="${esc(p.notes)}" class="span-3">
          </div>
        </div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Active Prescriptions (${rxs.length})</span>
        <div class="table-wrap" style="max-height:220px;">
        <table class="data-table">
          <thead><tr>
            <th>Rx Number</th><th>Drug</th><th>SIG</th><th>Qty</th><th>Days</th>
            <th>Refills Left</th><th>Last Filled</th><th>Prescriber</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
          ${rxs.map(r => {
            const m = getMed(r.medId);
            const d = getPrescriber(r.prescriberId);
            return `<tr>
              <td class="mono">${esc(r.id)}</td>
              <td>${esc(m ? m.name : '')}</td>
              <td>${esc(r.sig)}</td>
              <td class="right">${r.qty}</td>
              <td class="right">${r.daysSupply}</td>
              <td class="right">${r.refillsRemaining}/${r.refillsAuth}</td>
              <td class="mono">${fmtDate(r.lastFilled)}</td>
              <td>${esc(d ? d.name : '')}</td>
              <td><span class="badge badge-ok">${esc(r.status)}</span></td>
              <td><button onclick="window._wf.startRefillFromRx('${r.id}')">Refill</button></td>
            </tr>`;
          }).join('') || '<tr><td colspan="10" class="center muted">No active prescriptions.</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
        <div class="groupbox">
          <span class="gb-title">Claims History</span>
          <div class="table-wrap" style="max-height:160px;">
          <table class="data-table">
            <thead><tr><th>Claim #</th><th>Date</th><th>Drug</th><th>Billed</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>
            ${claims.map(c => {
              const m = getMed(c.medId);
              return `<tr class="${c.status === 'REJECTED' ? 'row-bad' : ''}">
                <td class="mono">${esc(c.id)}</td>
                <td class="mono">${fmtDate(c.submittedAt)}</td>
                <td>${esc(m ? m.name : '')}</td>
                <td class="right mono">${fmtMoney(c.billed)}</td>
                <td class="right mono">${fmtMoney(c.paid)}</td>
                <td><span class="badge ${c.status === 'PAID' ? 'badge-ok' : 'badge-bad'}">${esc(c.status)}</span></td>
              </tr>`;
            }).join('') || '<tr><td colspan="6" class="center muted">No claims.</td></tr>'}
            </tbody>
          </table>
          </div>
        </div>
        <div class="groupbox">
          <span class="gb-title">Appointments &amp; Notifications</span>
          <div class="table-wrap" style="max-height:160px;">
          <table class="data-table">
            <thead><tr><th>Type</th><th>When</th><th>Status / Channel</th></tr></thead>
            <tbody>
            ${appts.map(a => `<tr><td>📅 ${esc(a.type)}</td><td class="mono">${esc(a.date)} ${esc(a.time)}</td><td><span class="badge badge-info">${esc(a.status)}</span></td></tr>`).join('')}
            ${notifs.map(n => `<tr><td>📨 ${esc(n.body.slice(0, 30))}…</td><td class="mono">${fmtDateTime(n.sentAt)}</td><td><span class="badge badge-muted">${esc(n.channel)}</span></td></tr>`).join('')}
            ${(appts.length + notifs.length === 0) ? '<tr><td colspan="3" class="center muted">No appointments or notifications.</td></tr>' : ''}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// REFILL QUEUE
// ----------------------------------------------------------------
routes['rx-queue'] = {
  title: () => 'Refill Queue',
  key: () => 'rx-queue',
  render(root) {
    const filter = root.__filter || 'ALL';
    const q = state.refillQueue;
    const filtered = filter === 'ALL' ? q : q.filter(x => x.status === filter);

    root.innerHTML = `
      ${pageHeader('Refill Queue', 'Home › Prescriptions › Refill Queue')}
      <div class="toolbar-strip">
        <span>Filter:</span>
        <select id="qf">
          <option value="ALL">All (${q.length})</option>
          <option value="PENDING">Pending (${q.filter(x=>x.status==='PENDING').length})</option>
          <option value="IN_PROGRESS">In Progress (${q.filter(x=>x.status==='IN_PROGRESS').length})</option>
          <option value="READY">Ready for Pickup (${q.filter(x=>x.status==='READY').length})</option>
          <option value="ON_ORDER">On Supplier Order (${q.filter(x=>x.status==='ON_ORDER').length})</option>
          <option value="REJECTED">Rejected (${q.filter(x=>x.status==='REJECTED').length})</option>
        </select>
        <button id="btn-refresh">↻ Refresh</button>
        <span class="sb-flex"></span>
        <button onclick="router.go('rx-new')">℞ New Prescription</button>
      </div>

      <div class="groupbox">
        <span class="gb-title">Queue (${filtered.length})</span>
        <div class="table-wrap" style="max-height:520px;">
        <table class="data-table">
          <thead><tr>
            <th>Queue #</th><th>Requested</th><th>Patient</th><th>Medication</th>
            <th>Source</th><th>Refills Left</th><th>Stock</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
          ${filtered.map(item => {
            const p = getPatient(item.patientId);
            const m = getMed(item.medId);
            const rx = getRx(item.rxId);
            const lowStock = m && m.stock < rx.qty;
            return `<tr class="${lowStock ? 'row-warn' : ''}">
              <td class="mono">${esc(item.id)}</td>
              <td class="mono small">${fmtDateTime(item.requestedAt).split(' ')[1] || ''}</td>
              <td>${esc(patientName(p))}</td>
              <td>${esc(m ? m.name : '')}</td>
              <td>${esc(item.source)}</td>
              <td class="right">${rx ? rx.refillsRemaining : '?'}</td>
              <td class="right ${lowStock ? 'bold' : ''}">${m ? m.stock : '?'}</td>
              <td><span class="badge ${item.status === 'READY' ? 'badge-ok' : (item.status === 'REJECTED' ? 'badge-bad' : '')}">${esc(item.status)}</span></td>
              <td>
                ${item.status === 'PENDING' ? `<button onclick="window._wf.processRefill('${item.id}')">▶ Process</button>` : ''}
                ${item.status === 'READY' ? `<button onclick="window._wf.notifyPickup('${item.id}')">📨 Notify</button>` : ''}
                ${item.status === 'ON_ORDER' ? `<span class="small muted">Awaiting shipment</span>` : ''}
              </td>
            </tr>`;
          }).join('') || '<tr><td colspan="9" class="center muted">No items match this filter.</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>
    `;

    $('#qf').value = filter;
    $('#qf').onchange = e => { root.__filter = e.target.value; router.refresh(); };
    $('#btn-refresh').onclick = () => router.refresh();
  }
};

// ----------------------------------------------------------------
// RX NEW (entry)
// ----------------------------------------------------------------
routes['rx-new'] = {
  title: () => 'New Prescription',
  key: () => 'rx-new',
  render(root, params) {
    const patients = state.patients;
    const meds = state.medications;
    const prescribers = state.prescribers;
    const preselectedPatient = params && params.patientId || '';

    root.innerHTML = `
      ${pageHeader('Enter New Prescription', 'Home › Prescriptions › New')}
      <div class="steps">
        <div class="step active">1. Rx Entry</div>
        <div class="step">2. DUR Review</div>
        <div class="step">3. Insurance Adjudication</div>
        <div class="step">4. Fill</div>
      </div>
      <form id="rx-form">
        <div class="groupbox">
          <span class="gb-title">Patient &amp; Prescriber</span>
          <div class="form-grid">
            <label>Patient:*</label>
            <select name="patientId" required>
              <option value="">-- Select --</option>
              ${patients.map(p => `<option value="${p.id}" ${preselectedPatient === p.id ? 'selected' : ''}>${esc(patientName(p))} (${esc(p.id)}) DOB ${fmtDate(p.dob)}</option>`).join('')}
            </select>
            <label>Prescriber:*</label>
            <select name="prescriberId" required>
              <option value="">-- Select --</option>
              ${prescribers.map(d => `<option value="${d.id}">${esc(d.name)} (${esc(d.specialty)})</option>`).join('')}
            </select>
            <label>Written Date:*</label><input type="date" name="writtenDate" value="2026-05-16" required>
            <label>Origin:</label>
            <select name="origin"><option>e-Prescribing</option><option>Phoned In</option><option>Written</option><option>Faxed</option><option>Transferred</option></select>
          </div>
        </div>

        <div class="groupbox">
          <span class="gb-title">Drug &amp; Directions</span>
          <div class="form-grid">
            <label>Medication:*</label>
            <select name="medId" required>
              <option value="">-- Select --</option>
              ${meds.map(m => `<option value="${m.id}">${esc(m.name)} [${esc(m.ndc)}] ${m.schedule !== 'RX' ? '⚠ ' + m.schedule : ''}</option>`).join('')}
            </select>
            <label>Qty Dispensed:*</label><input type="number" name="qty" value="30" required min="1">
            <label>Days Supply:*</label><input type="number" name="daysSupply" value="30" required min="1">
            <label>Refills Authorized:</label><input type="number" name="refillsAuth" value="5" min="0" max="11">
            <label>SIG (Directions):*</label><textarea name="sig" required rows="2" class="span-3">Take 1 tablet by mouth once daily</textarea>
            <label>DAW Code:</label>
            <select name="daw" class="span-3">
              <option value="0">0 - No product selection indicated</option>
              <option value="1">1 - Substitution Not Allowed by Prescriber</option>
              <option value="2">2 - Substitution Allowed - Patient Request</option>
              <option value="5">5 - Substitution Allowed - Brand Dispensed</option>
            </select>
          </div>
        </div>

        <div class="row" style="justify-content:flex-end;">
          <button type="button" onclick="router.go('rx-queue')">Cancel</button>
          <button type="submit" class="btn-primary">▶ Continue to DUR Review</button>
        </div>
      </form>
    `;

    $('#rx-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v;
      window._wf.runDUR(data);
    };
  }
};

// ----------------------------------------------------------------
// RX HISTORY (all Rx)
// ----------------------------------------------------------------
routes['rx-history'] = {
  title: () => 'Rx History',
  key: () => 'rx-history',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Prescription History', 'Home › Prescriptions › History')}
      <div class="groupbox">
        <span class="gb-title">All Prescriptions (${state.prescriptions.length})</span>
        <div class="table-wrap" style="max-height:600px;">
        <table class="data-table">
          <thead><tr>
            <th>Rx Number</th><th>Patient</th><th>Drug</th><th>SIG</th><th>Qty</th>
            <th>Days</th><th>Refills</th><th>Written</th><th>Last Filled</th><th>Status</th>
          </tr></thead>
          <tbody>
          ${state.prescriptions.map(r => {
            const p = getPatient(r.patientId);
            const m = getMed(r.medId);
            return `<tr>
              <td class="mono">${esc(r.id)}</td>
              <td>${esc(patientName(p))}</td>
              <td>${esc(m ? m.name : '')}</td>
              <td>${esc(r.sig)}</td>
              <td class="right">${r.qty}</td>
              <td class="right">${r.daysSupply}</td>
              <td class="right">${r.refillsRemaining}/${r.refillsAuth}</td>
              <td class="mono">${fmtDate(r.writtenDate)}</td>
              <td class="mono">${fmtDate(r.lastFilled)}</td>
              <td><span class="badge badge-ok">${esc(r.status)}</span></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// RX REFILL (redirects to queue with a hint)
// ----------------------------------------------------------------
routes['rx-refill'] = {
  title: () => 'Refill',
  key: () => 'rx-refill',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Refill Prescription', 'Home › Prescriptions › Refill')}
      <div class="notice">Select a patient to begin a manual refill, or process from the Refill Queue.</div>
      <div class="toolbar-strip">
        <button class="btn-primary" onclick="router.go('refill-workflow')">↻ Refill Workflow</button>
        <button onclick="router.go('patients')">👤 Look Up Patient</button>
        <button onclick="router.go('rx-queue')">≡ Open Refill Queue</button>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// REFILL WORKFLOW — Full-page, demoable, 6-step wizard
// ----------------------------------------------------------------
routes['refill-workflow'] = {
  title: () => 'Refill Workflow',
  key: () => 'refill-workflow',
  render(root, params) {
    // State lives on root element so it survives re-renders within the same tab
    if (!root.__wf) {
      root.__wf = {
        step: 1,           // 1-6
        patientId: null,
        rxId: null,
        queueId: null,
        insResult: null,   // 'APPROVED' | 'REJECTED'
        copay: 0,
        claimId: null,
        paId: null,
        fillComplete: false,
        notifSent: false,
        // forced demo scenario: null | 'ins-rejected'
        demoScenario: params && params.demoScenario || null,
      };
    }
    const wf = root.__wf;

    // ---- Step labels ----
    const STEPS = [
      { n: 1, label: 'Patient Search', sub: 'Locate patient record' },
      { n: 2, label: 'Rx & Eligibility', sub: 'Prescription + refill check' },
      { n: 3, label: 'Insurance Verification', sub: 'Adjudicate claim' },
      { n: 4, label: 'Inventory Check', sub: 'Confirm stock on hand' },
      { n: 5, label: 'Mark for Fulfillment', sub: 'Fill or order' },
      { n: 6, label: 'Notify Patient', sub: 'Pickup-ready alert' },
    ];

    function stepClass(n) {
      if (n < wf.step) return 'wf-step-done';
      if (n === wf.step) return 'wf-step-active';
      return '';
    }

    function stepNumSymbol(n) {
      if (n < wf.step) return '✓';
      return n;
    }

    function stepsHtml() {
      return STEPS.map(s => `
        <div class="wf-step-item ${stepClass(s.n)}">
          <div class="wf-step-num">${stepNumSymbol(s.n)}</div>
          <div>
            <div class="wf-step-label">${s.label}</div>
            <div class="wf-step-sub">${s.sub}</div>
          </div>
        </div>
      `).join('');
    }

    function rerender() {
      root.innerHTML = '';
      routes['refill-workflow'].render(root, params);
    }

    // ---- Helpers ----
    function getWfPatient() { return wf.patientId ? getPatient(wf.patientId) : null; }
    function getWfRx() { return wf.rxId ? getRx(wf.rxId) : null; }
    function getWfMed() { const r = getWfRx(); return r ? getMed(r.medId) : null; }

    // ---- Build outer shell ----
    const scenarioBar = `
      <div class="demo-scenario-strip">
        <span class="demo-label">DEMO PRESETS:</span>
        <button onclick="window._wfDemo.presetNormal()">▶ Normal Refill (Anderson/Lisinopril)</button>
        <button onclick="window._wfDemo.presetRejected()" style="background:#800000;color:#fff;border-color:#c00;">▶ Insurance REJECTED (Garcia/Advair)</button>
        <button onclick="window._wfDemo.presetEarlyRefill()">▶ Refill Too Early (Espinoza/Sertraline)</button>
        <span class="sb-flex"></span>
        <button onclick="window._wfDemo.reset()">⟲ Reset Workflow</button>
      </div>`;

    root.innerHTML = `
      ${pageHeader('Medication Refill Workflow', 'Home › Prescriptions › Refill Workflow')}
      ${scenarioBar}
      <div class="wf-layout">
        <div class="wf-steps-panel">
          <div class="wf-steps-header">Refill Steps</div>
          <div id="wf-steps-list">${stepsHtml()}</div>
          <div style="flex:1;"></div>
          ${wf.patientId ? `
          <div style="padding:6px;background:#e8e8e8;border-top:1px solid #808080;font-size:10px;">
            <div class="bold">${esc(patientName(getWfPatient()))}</div>
            <div class="mono">${esc(getWfPatient().id)}</div>
            ${wf.rxId ? `<div class="mono small">${esc(wf.rxId)}</div>` : ''}
            <div style="color:#c00000;font-weight:bold;">${esc(getWfPatient().allergies)}</div>
          </div>` : ''}
        </div>
        <div class="wf-content-panel" id="wf-content">
          ${renderStep(wf.step)}
        </div>
      </div>
    `;

    // ---- Attach demo preset helpers ----
    window._wfDemo = {
      presetNormal() {
        root.__wf = { step: 1, patientId: 'P001', rxId: 'RX-2026-100001', queueId: null, insResult: null, copay: 0, claimId: null, paId: null, fillComplete: false, notifSent: false, demoScenario: null };
        rerender();
        // auto-advance to step 2
        setTimeout(() => { root.__wf.step = 2; rerender(); }, 300);
      },
      presetRejected() {
        root.__wf = { step: 1, patientId: 'P007', rxId: 'RX-2026-100009', queueId: null, insResult: null, copay: 0, claimId: null, paId: null, fillComplete: false, notifSent: false, demoScenario: 'ins-rejected' };
        rerender();
        setTimeout(() => { root.__wf.step = 2; rerender(); }, 300);
      },
      presetEarlyRefill() {
        root.__wf = { step: 1, patientId: 'P005', rxId: 'RX-2026-100007', queueId: null, insResult: null, copay: 0, claimId: null, paId: null, fillComplete: false, notifSent: false, demoScenario: 'too-early' };
        rerender();
        setTimeout(() => { root.__wf.step = 2; rerender(); }, 300);
      },
      reset() {
        root.__wf = null;
        rerender();
      },
    };

    // ---- Step renderers ----
    function renderStep(n) {
      switch (n) {
        case 1: return renderStep1();
        case 2: return renderStep2();
        case 3: return renderStep3();
        case 4: return renderStep4();
        case 5: return renderStep5();
        case 6: return renderStep6();
        default: return '<div class="notice">Unknown step.</div>';
      }
    }

    // STEP 1 — Patient Search
    function renderStep1() {
      const patients = state.patients;
      return `
        <div class="groupbox">
          <span class="gb-title">Step 1 — Patient Search</span>
          <div class="toolbar-strip">
            <span>Search by:</span>
            <label><input type="radio" name="s1mode" value="name" checked> Last Name</label>
            <label><input type="radio" name="s1mode" value="dob"> DOB</label>
            <label><input type="radio" name="s1mode" value="id"> Patient ID</label>
            <input id="s1-term" type="text" placeholder="Enter search term..." style="width:220px;">
            <button id="s1-search" class="btn-primary">🔍 Search</button>
            <button id="s1-clear">Clear</button>
          </div>
          <div class="table-wrap" style="max-height:300px;">
          <table class="data-table" id="s1-table">
            <thead><tr>
              <th>Patient ID</th><th>Last Name</th><th>First Name</th><th>DOB / Age</th>
              <th>Phone</th><th>Insurance Plan</th><th>Allergies</th><th>Action</th>
            </tr></thead>
            <tbody id="s1-tbody">
              ${renderS1Rows(patients)}
            </tbody>
          </table>
          </div>
          <div class="spacer"></div>
          <div class="muted small">Double-click a row or click Select to load the patient and proceed to Step 2.</div>
        </div>
      `;
    }

    function renderS1Rows(rows) {
      return rows.map(p => `<tr data-pid="${p.id}" class="${wf.patientId === p.id ? 'selected' : ''}">
        <td class="mono">${esc(p.id)}</td>
        <td><b>${esc(p.last)}</b></td>
        <td>${esc(p.first)}</td>
        <td class="mono">${fmtDate(p.dob)} (${age(p.dob)} yrs)</td>
        <td class="mono">${esc(p.phone)}</td>
        <td>${esc(p.insurancePlan)}</td>
        <td style="${p.allergies && p.allergies !== 'NKDA' ? 'color:#c00000;font-weight:bold;' : ''}">${esc(p.allergies)}</td>
        <td><button onclick="window._wfStep1Select('${p.id}')">Select ›</button></td>
      </tr>`).join('') || '<tr><td colspan="8" class="center muted">No patients found.</td></tr>';
    }

    // Wire up step 1 interactions after render
    setTimeout(() => {
      const tbody = document.getElementById('s1-tbody');
      const searchBtn = document.getElementById('s1-search');
      const clearBtn = document.getElementById('s1-clear');
      const termIn = document.getElementById('s1-term');
      if (!searchBtn) return;

      window._wfStep1Select = (pid) => {
        wf.patientId = pid;
        wf.rxId = null;
        wf.step = 2;
        log('REFILL_WF_PATIENT', `Selected patient ${pid}`);
        rerender();
      };

      function doSearch() {
        const term = (termIn.value || '').trim().toLowerCase();
        const mode = document.querySelector('input[name="s1mode"]:checked').value;
        if (!term) { tbody.innerHTML = renderS1Rows(state.patients); return; }
        const f = state.patients.filter(p => {
          if (mode === 'name') return p.last.toLowerCase().startsWith(term) || p.first.toLowerCase().startsWith(term);
          if (mode === 'dob') return (p.dob || '').includes(term);
          if (mode === 'id') return (p.id || '').toLowerCase().includes(term);
          return false;
        });
        tbody.innerHTML = renderS1Rows(f);
      }

      searchBtn.onclick = doSearch;
      clearBtn.onclick = () => { termIn.value = ''; tbody.innerHTML = renderS1Rows(state.patients); };
      termIn.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

      // Double-click
      tbody.addEventListener('dblclick', e => {
        const tr = e.target.closest('tr[data-pid]');
        if (tr) window._wfStep1Select(tr.dataset.pid);
      });
    }, 0);

    // STEP 2 — Rx & Eligibility
    function renderStep2() {
      const p = getWfPatient();
      if (!p) return '<div class="notice err">No patient selected. Go back to Step 1.</div>';

      const rxs = state.prescriptions.filter(r => r.patientId === p.id && r.status === 'ACTIVE');
      const selectedRx = getWfRx();
      const tooEarly = wf.demoScenario === 'too-early';

      let eligHtml = '';
      if (selectedRx) {
        const daysSinceFill = Math.round((new Date('2026-05-16') - new Date(selectedRx.lastFilled)) / 86400000);
        const minDays = selectedRx.daysSupply - 7;
        const isEarlyFill = tooEarly || daysSinceFill < minDays;
        const noRefills = selectedRx.refillsRemaining <= 0;

        let eligStatus, eligClass;
        if (noRefills) {
          eligStatus = 'NO REFILLS REMAINING — Prescriber must authorize renewal';
          eligClass = 'spl-bad';
        } else if (isEarlyFill) {
          const earliest = new Date(selectedRx.lastFilled);
          earliest.setDate(earliest.getDate() + minDays);
          eligStatus = `REFILL TOO EARLY — Eligible on ${fmtDate(earliest)}`;
          eligClass = 'spl-warn';
        } else {
          eligStatus = `ELIGIBLE — ${selectedRx.refillsRemaining} refill(s) remaining`;
          eligClass = 'spl-ok';
        }

        const canContinue = !noRefills && !isEarlyFill;
        eligHtml = `
          <div class="groupbox">
            <span class="gb-title">Refill Eligibility</span>
            <div style="margin:6px 0;"><span class="status-pill ${eligClass}">${eligStatus}</span></div>
            <div class="form-grid" style="margin-top:8px;">
              <label>Rx Number:</label><input readonly value="${esc(selectedRx.id)}">
              <label>Drug:</label><input readonly value="${esc(getMed(selectedRx.medId) ? getMed(selectedRx.medId).name : '')}">
              <label>Qty / Days Supply:</label><input readonly value="${selectedRx.qty} tablets / ${selectedRx.daysSupply} days">
              <label>Refills Remaining:</label><input readonly value="${selectedRx.refillsRemaining} of ${selectedRx.refillsAuth}" style="${selectedRx.refillsRemaining === 0 ? 'background:#ffe4e4;' : 'background:#e4ffe4;'}">
              <label>Last Filled:</label><input readonly value="${fmtDate(selectedRx.lastFilled)} (${daysSinceFill} days ago)">
              <label>Min Days Window:</label><input readonly value="${minDays} days">
              <label>Written:</label><input readonly value="${fmtDate(selectedRx.writtenDate)}">
              <label>Prescriber:</label><input readonly value="${esc(getPrescriber(selectedRx.prescriberId) ? getPrescriber(selectedRx.prescriberId).name : '')}">
              <label>SIG:</label><input readonly value="${esc(selectedRx.sig)}" class="span-3">
            </div>
            <div class="spacer"></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button onclick="window._wfStep2Back()">← Back to Patient</button>
              ${canContinue
                ? `<button class="btn-primary" onclick="window._wfStep2Continue()">▶ Continue to Insurance ›</button>`
                : (noRefills
                    ? `<button onclick="window._wfContactPrescriber('${selectedRx.id}')">📞 Contact Prescriber for Renewal</button>`
                    : `<button onclick="window._wfNoteEarlyRefill('${selectedRx.id}')">📝 Note Request — Cannot Fill Yet</button>`
                  )
              }
            </div>
          </div>`;
      }

      return `
        <div class="groupbox">
          <span class="gb-title">Patient — ${esc(patientName(p))}</span>
          <div class="wf-patient-card">
            <div><span class="wf-pc-label">Patient ID:</span> <span class="wf-pc-value mono">${esc(p.id)}</span></div>
            <div><span class="wf-pc-label">DOB / Age:</span> <span class="wf-pc-value">${fmtDate(p.dob)} · ${age(p.dob)} yrs · ${esc(p.sex)}</span></div>
            <div><span class="wf-pc-label">Phone:</span> <span class="wf-pc-value">${esc(p.phone)}</span></div>
            <div><span class="wf-pc-label">Insurance:</span> <span class="wf-pc-value">${esc(p.insurancePlan)}</span></div>
            <div><span class="wf-pc-label">Member ID:</span> <span class="wf-pc-value mono">${esc(p.insuranceId)}</span></div>
            <div><span class="wf-pc-label">Copay Tier:</span> <span class="wf-pc-value">${esc(p.copay)}</span></div>
            <div style="grid-column:span 2;"><span class="wf-pc-label">Allergies:</span> <span class="wf-pc-allergy">${esc(p.allergies)}</span></div>
          </div>
        </div>

        <div class="groupbox">
          <span class="gb-title">Select Prescription to Refill</span>
          <div id="s2-rx-list">
          ${rxs.map(r => {
            const m = getMed(r.medId);
            const d = getPrescriber(r.prescriberId);
            const isSelected = wf.rxId === r.id;
            return `<div class="rx-select-row ${isSelected ? 'rx-selected' : ''}" onclick="window._wfStep2SelectRx('${r.id}')">
              <div>
                <div class="rx-sr-name">${esc(m ? m.name : '')} ${m && m.paRequired ? '<span class="badge badge-warn">PA REQ</span>' : ''} ${m && m.controlled ? '<span class="badge badge-bad">' + esc(m.schedule) + '</span>' : ''}</div>
                <div class="rx-sr-meta">Rx ${esc(r.id)} · Written ${fmtDate(r.writtenDate)} · ${r.refillsRemaining}/${r.refillsAuth} refills · Last filled ${fmtDate(r.lastFilled)}</div>
                <div class="rx-sr-meta">${esc(r.sig)}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div class="bold">${r.qty} × ${esc(m ? m.form : '')}</div>
                <div class="rx-sr-meta">${r.daysSupply} days supply</div>
                <div class="rx-sr-meta">${esc(d ? d.name : '')}</div>
              </div>
            </div>`;
          }).join('') || '<div class="notice">No active prescriptions for this patient.</div>'}
          </div>
        </div>

        ${eligHtml}
      `;
    }

    setTimeout(() => {
      window._wfStep2SelectRx = (rxId) => {
        wf.rxId = rxId;
        rerender();
      };
      window._wfStep2Continue = () => {
        wf.step = 3;
        rerender();
      };
      window._wfStep2Back = () => {
        wf.step = 1;
        wf.patientId = null;
        wf.rxId = null;
        rerender();
      };
      window._wfContactPrescriber = (rxId) => {
        const rx = getRx(rxId);
        const d = getPrescriber(rx.prescriberId);
        alertDialog('Contact Prescriber', `<b>No refills remaining</b> on Rx ${rxId}.<br><br>Contact: <b>${d ? esc(d.name) : 'Prescriber'}</b><br>Phone: ${d ? esc(d.phone) : 'N/A'}<br><br>Request renewal authorization before proceeding.`);
        log('REFILL_WF_NO_REFILLS', `Rx ${rxId} — prescriber contact initiated`);
      };
      window._wfNoteEarlyRefill = (rxId) => {
        const rx = getRx(rxId);
        const minDays = rx.daysSupply - 7;
        const earliest = new Date(rx.lastFilled);
        earliest.setDate(earliest.getDate() + minDays);
        alertDialog('Refill Too Early', `<b>Refill cannot be processed yet.</b><br><br>Insurance will not cover until: <b>${fmtDate(earliest)}</b><br><br>The request has been noted. Patient will be contacted when eligible.`);
        log('REFILL_WF_TOO_EARLY', `Rx ${rxId} — earliest eligible ${fmtDate(earliest)}`);
      };
    }, 0);

    // STEP 3 — Insurance Verification
    function renderStep3() {
      const p = getWfPatient();
      const rx = getWfRx();
      const m = getWfMed();
      if (!p || !rx || !m) return '<div class="notice err">Missing patient or prescription data.</div>';

      const isRejected = wf.demoScenario === 'ins-rejected' || m.paRequired;
      const d = getPrescriber(rx.prescriberId);

      if (wf.insResult === null) {
        // Show the "verify" form before submitting
        return `
          <div class="groupbox">
            <span class="gb-title">Step 3 — Insurance Adjudication</span>
            <div class="ins-check-box">
              <div class="ins-row"><span class="ins-key">Plan:</span><span class="ins-val">${esc(p.insurancePlan)}</span></div>
              <div class="ins-row"><span class="ins-key">Member ID:</span><span class="ins-val mono">${esc(p.insuranceId)}</span></div>
              <div class="ins-row"><span class="ins-key">BIN / PCN / Group:</span><span class="ins-val mono">${esc(p.insuranceBin)} / ${esc(p.insurancePcn)} / ${esc(p.insuranceGroup)}</span></div>
              <div class="ins-row"><span class="ins-key">Drug (NDC):</span><span class="ins-val mono">${esc(m.ndc)}</span></div>
              <div class="ins-row"><span class="ins-key">Drug Name:</span><span class="ins-val">${esc(m.name)}</span></div>
              <div class="ins-row"><span class="ins-key">Qty / Days Supply:</span><span class="ins-val">${rx.qty} / ${rx.daysSupply}</span></div>
              <div class="ins-row"><span class="ins-key">Billed Amount:</span><span class="ins-val mono">${fmtMoney(m.retail * rx.qty)}</span></div>
              ${m.paRequired ? `<div class="ins-row" style="background:#ffe4e4;"><span class="ins-key" style="color:#c00000;">PA Required Flag:</span><span class="ins-val" style="color:#c00000;">YES — This drug requires Prior Authorization</span></div>` : ''}
            </div>
            <div class="spacer"></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button onclick="window._wfStep3Back()">← Back</button>
              <button class="btn-primary" id="btn-submit-claim">▶ Submit Claim to ${esc(p.insurancePlan)} ›</button>
            </div>
            <div id="ins-progress-area"></div>
          </div>
        `;
      } else if (wf.insResult === 'REJECTED') {
        // BIG REJECTION BANNER — key demo moment
        return `
          <div class="rejection-banner">
            <div class="rej-title">⚠ INSURANCE CLAIM REJECTED</div>
            <div>Plan: <b>${esc(p.insurancePlan)}</b> &nbsp;|&nbsp; Member: <b>${esc(p.insuranceId)}</b> &nbsp;|&nbsp; Drug: <b>${esc(m.name)}</b></div>
            <div class="rej-detail">NCPDP REJECT CODE: 75 — PRIOR AUTHORIZATION REQUIRED
Billed: ${fmtMoney(m.retail * rx.qty)}   Paid: $0.00   Copay Collected: $0.00
Prescriber: ${esc(d ? d.name : '')}   NPI: ${esc(d ? d.npi : '')}
Submitted: ${fmtDateTime(new Date())}</div>
            <div class="rej-actions">
              <button class="rej-btn-primary" onclick="window._wfInitiatePA()">📋 Initiate Prior Authorization</button>
              <button onclick="window._wfOfferCashPrice()">💲 Offer Patient Cash Price</button>
              <button onclick="window._wfContactPrescriber2()">📞 Contact Prescriber</button>
            </div>
          </div>

          <div class="groupbox">
            <span class="gb-title">Rejection Detail &amp; Required Actions</span>
            <div class="form-grid">
              <label>Reject Code:</label><input readonly value="75 — Prior Authorization Required" style="background:#ffe4e4;font-weight:bold;">
              <label>Payer:</label><input readonly value="${esc(p.insurancePlan)}">
              <label>Drug Requiring PA:</label><input readonly value="${esc(m.name)} [NDC ${esc(m.ndc)}]">
              <label>Prescriber to Contact:</label><input readonly value="${esc(d ? d.name : '')} · ${esc(d ? d.phone : '')}">
              <label>Patient Notified:</label><input readonly value="NOT YET — action required" style="background:#ffe4e4;">
              <label>PA Form Needed:</label><input readonly value="${esc(p.insurancePlan)} — PA for ${esc(m.brand || m.generic || m.name)}">
            </div>
            <div class="notice" style="margin-top:8px;">
              <b>Playbook:</b> Do NOT dispense until Prior Authorization is received or patient agrees to pay cash price.
              Contact <b>${esc(d ? d.name : 'prescriber')}</b> at <b>${esc(d ? d.phone : '')}</b> to initiate PA paperwork.
            </div>
            <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px;">
              <button onclick="window._wfStep3Back()">← Back</button>
            </div>
          </div>
        `;
      } else {
        // APPROVED
        return `
          <div class="approval-banner">
            <div class="apv-title">✓ CLAIM APPROVED</div>
            <div>Plan: <b>${esc(p.insurancePlan)}</b> · Billed: <b>${fmtMoney(m.retail * rx.qty)}</b> · Plan Pays: <b>${fmtMoney(m.retail * rx.qty - wf.copay)}</b> · Patient Copay: <b>${fmtMoney(wf.copay)}</b></div>
          </div>

          <div class="groupbox">
            <span class="gb-title">Adjudication Result</span>
            <div class="form-grid">
              <label>Authorization #:</label><input readonly value="${wf._authNum || 'AUTH-' + Math.floor(Math.random()*900000+100000)}">
              <label>Plan Paid:</label><input readonly value="${fmtMoney(m.retail * rx.qty - wf.copay)}" style="background:#e4ffe4;">
              <label>Patient Copay:</label><input readonly value="${fmtMoney(wf.copay)}" style="background:#e4ffe4;font-weight:bold;">
              <label>Adjudication Time:</label><input readonly value="${fmtDateTime(new Date())}">
              <label>Formulary Tier:</label><input readonly value="Tier 1 — Preferred Generic">
              <label>Coverage Year:</label><input readonly value="2026 (Active)">
            </div>
            <div class="spacer"></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button onclick="window._wfStep3Back()">← Back</button>
              <button class="btn-primary" onclick="window._wfStep3Continue()">▶ Continue to Inventory Check ›</button>
            </div>
          </div>
        `;
      }
    }

    setTimeout(() => {
      const submitBtn = document.getElementById('btn-submit-claim');
      if (!submitBtn) return;
      submitBtn.onclick = () => {
        const area = document.getElementById('ins-progress-area');
        if (!area) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        area.innerHTML = `
          <div class="notice" style="margin-top:8px;">Transmitting NCPDP D.0 claim to ${esc(getWfPatient().insurancePlan)}...</div>
          <div class="progress-track"><div class="progress-bar" id="ins-bar" style="width:0%;"></div></div>`;
        let v = 0;
        const iv = setInterval(() => {
          v += 8;
          const bar = document.getElementById('ins-bar');
          if (bar) bar.style.width = Math.min(v, 100) + '%';
          if (v >= 100) {
            clearInterval(iv);
            const rx = getWfRx();
            const m = getWfMed();
            const p = getWfPatient();
            const rejected = wf.demoScenario === 'ins-rejected' || m.paRequired;
            if (rejected) {
              wf.insResult = 'REJECTED';
              log('INS_CLAIM_REJECTED', `Rx ${rx.id} — code 75 PA required`);
            } else {
              wf.insResult = 'APPROVED';
              wf.copay = parseFloat((p.copay || '$10').match(/\d+/)?.[0] || '10');
              wf._authNum = 'AUTH-' + Math.floor(Math.random()*900000+100000);
              // Record claim
              const claim = { id: nextClaimId(), rxFillId: 'wf-' + Date.now(), patientId: p.id, medId: m.id, billed: m.retail * rx.qty, paid: m.retail * rx.qty - wf.copay, copay: wf.copay, status: 'PAID', submittedAt: new Date().toISOString() };
              state.claims.unshift(claim);
              wf.claimId = claim.id;
              saveState();
              log('INS_CLAIM_APPROVED', `Rx ${rx.id} — auth ${wf._authNum} copay ${fmtMoney(wf.copay)}`);
            }
            rerender();
          }
        }, 80);
      };

      window._wfStep3Back = () => { wf.step = 2; wf.insResult = null; rerender(); };
      window._wfStep3Continue = () => { wf.step = 4; rerender(); };

      window._wfInitiatePA = () => {
        const rx = getWfRx();
        const m = getWfMed();
        const p = getWfPatient();
        const d = getPrescriber(rx.prescriberId);
        const pa = { id: nextPAId(), patientId: p.id, medId: m.id, prescriberId: rx.prescriberId, status: 'PENDING_PROVIDER', requestedAt: new Date().toISOString(), diagnosis: 'Pending — to be provided by prescriber', notes: 'Initiated from Refill Workflow step 3. Fax to ' + (d ? d.name : '') };
        state.priorAuths.unshift(pa);
        // also record the rejected claim
        const claim = { id: nextClaimId(), rxFillId: 'wf-' + Date.now(), patientId: p.id, medId: m.id, billed: m.retail * rx.qty, paid: 0, copay: 0, status: 'REJECTED', rejectCode: '75', rejectReason: 'PRIOR AUTHORIZATION REQUIRED', submittedAt: new Date().toISOString() };
        state.claims.unshift(claim);
        // put item in queue as REJECTED
        const q = { id: nextQId(), rxId: rx.id, patientId: p.id, medId: m.id, requestedAt: new Date().toISOString(), source: 'Refill Workflow', status: 'REJECTED', notes: 'PA initiated: ' + pa.id };
        state.refillQueue.unshift(q);
        wf.queueId = q.id;
        wf.paId = pa.id;
        saveState();
        log('PA_INITIATED', `${pa.id} for ${m.name} patient ${p.id} — fax to ${d ? d.name : ''}`);
        toast(`PA ${pa.id} initiated. Fax dispatched to ${d ? d.name : 'prescriber'}'s office.`, 'info');
        alertDialog('Prior Authorization Initiated', `<b>PA Reference: ${pa.id}</b><br><br>A Prior Authorization request has been faxed to:<br><b>${d ? esc(d.name) : 'Prescriber'}</b> · ${d ? esc(d.phone) : ''}<br><br>Expected response: 24–48 hours.<br><br><b>Do NOT dispense</b> until PA is approved or patient accepts cash price.<br><br>The refill queue item has been placed in REJECTED status pending PA outcome.`);
        router.go('rx-pa');
      };

      window._wfOfferCashPrice = () => {
        const m = getWfMed();
        const rx = getWfRx();
        alertDialog('Cash Price Option', `<b>Insurance was rejected.</b> You may offer the patient the cash price:<br><br>Drug: <b>${esc(m ? m.name : '')}</b><br>Quantity: <b>${rx ? rx.qty : ''} units</b><br>Cash Price: <b>${fmtMoney(m ? m.retail * rx.qty : 0)}</b><br><br>If patient agrees, proceed without insurance. Do NOT submit a paid claim.`);
      };

      window._wfContactPrescriber2 = () => {
        const rx = getWfRx();
        const d = rx ? getPrescriber(rx.prescriberId) : null;
        alertDialog('Contact Prescriber', `Call or fax <b>${d ? esc(d.name) : 'prescriber'}</b> at <b>${d ? esc(d.phone) : 'N/A'}</b> to discuss:<br>• Prior Authorization for ${esc(getWfMed() ? getWfMed().name : '')}<br>• Alternative medication options<br>• Clinical justification documentation`);
      };
    }, 0);

    // STEP 4 — Inventory Check
    function renderStep4() {
      const rx = getWfRx();
      const m = getWfMed();
      if (!rx || !m) return '<div class="notice err">Missing prescription data.</div>';

      const pct = Math.min(100, Math.round((m.stock / m.reorderPt) * 100));
      const lowStock = m.stock < rx.qty;
      const belowReorder = m.stock < m.reorderPt;
      const critical = m.stock < m.reorderPt / 2;

      const barClass = critical ? 'stock-critical' : (belowReorder ? 'stock-low' : '');

      return `
        <div class="groupbox">
          <span class="gb-title">Step 4 — Inventory Check</span>

          <div style="margin:8px 0;">
            <span class="status-pill ${lowStock ? 'spl-bad' : (belowReorder ? 'spl-warn' : 'spl-ok')}">
              ${lowStock ? '❌ INSUFFICIENT STOCK — Supplier Order Required' : (belowReorder ? '⚠ LOW STOCK — Fill possible, reorder recommended' : '✓ SUFFICIENT STOCK — Ready to fill')}
            </span>
          </div>

          <div class="form-grid" style="margin-top:8px;">
            <label>Drug / NDC:</label><input readonly value="${esc(m.name)} [${esc(m.ndc)}]">
            <label>Location:</label><input readonly value="${esc(m.location)}">
            <label>Units on Hand:</label><input readonly value="${m.stock}" style="background:${lowStock ? '#ffe4e4' : (belowReorder ? '#ffe4a0' : '#e4ffe4')};font-weight:bold;">
            <label>Units Needed:</label><input readonly value="${rx.qty}">
            <label>Reorder Point:</label><input readonly value="${m.reorderPt}">
            <label>Reorder Quantity:</label><input readonly value="${m.reorderQty}">
            <label>Manufacturer:</label><input readonly value="${esc(m.mfr)}">
            <label>Form:</label><input readonly value="${esc(m.form)}">
          </div>

          <div class="stock-meter" style="margin-top:10px;">
            <span style="font-size:10px;white-space:nowrap;">Stock vs Reorder Pt</span>
            <div class="stock-bar-wrap">
              <div class="stock-bar-fill ${barClass}" style="width:${pct}%;"></div>
            </div>
            <span style="font-size:10px;white-space:nowrap;">${m.stock} / ${m.reorderPt} (${pct}%)</span>
          </div>

          <div class="spacer"></div>
          <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button onclick="window._wfStep4Back()">← Back</button>
            ${lowStock
              ? `<button class="btn-primary" onclick="window._wfStep5Route('order')">⛟ Create Supplier Order ›</button>`
              : `<button class="btn-primary" onclick="window._wfStep5Route('fill')">▶ Mark for Fulfillment ›</button>`
            }
            ${belowReorder && !lowStock ? `<button onclick="window._wfFlagReorder()">⚠ Flag for Reorder</button>` : ''}
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      window._wfStep4Back = () => { wf.step = 3; rerender(); };
      window._wfStep5Route = (mode) => {
        wf._fillMode = mode;
        wf.step = 5;
        rerender();
      };
      window._wfFlagReorder = () => {
        const m = getWfMed();
        toast(`Reorder flag set for ${m.name}. Purchasing team notified.`, 'info');
        log('REORDER_FLAG', `${m.id} ${m.name} stock ${m.stock} below reorder pt ${m.reorderPt}`);
      };
    }, 0);

    // STEP 5 — Mark for Fulfillment
    function renderStep5() {
      const p = getWfPatient();
      const rx = getWfRx();
      const m = getWfMed();
      if (!rx || !m) return '<div class="notice err">Missing data.</div>';

      if (wf.fillComplete) {
        // Already filled — show summary
        return `
          <div class="fill-summary">
            <div class="fill-title">✓ REFILL FILLED AND LABELED</div>
            <div class="fill-grid">
              <span class="fill-key">Fill ID:</span><span class="fill-val mono">${esc(wf.queueId || 'WF-FILL')}</span>
              <span class="fill-key">Claim #:</span><span class="fill-val mono">${esc(wf.claimId || 'CLAIM-PENDING')}</span>
              <span class="fill-key">Qty Dispensed:</span><span class="fill-val">${rx.qty} × ${esc(m.form)}</span>
              <span class="fill-key">Lot # / Expires:</span><span class="fill-val mono">${wf._lot || 'LOT-' + Math.floor(Math.random()*9000+1000)} / 2027-08</span>
              <span class="fill-key">New Stock Level:</span><span class="fill-val">${m.stock} units</span>
              <span class="fill-key">Patient Copay:</span><span class="fill-val">${fmtMoney(wf.copay)}</span>
            </div>
            <div style="margin-top:8px;font-size:10px;color:#006000;">Rx label printed · Bag label printed · Placed in Will-Call bin</div>
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;">
            <button class="btn-primary" onclick="window._wfStep6Go()">📨 Notify Patient ›</button>
          </div>
        `;
      }

      if (wf._fillMode === 'order') {
        // Out-of-stock path — create PO
        return `
          <div class="groupbox">
            <span class="gb-title">Step 5 — Create Supplier Order (Out of Stock)</span>
            <div class="notice err">Insufficient stock. A supplier order is required before this refill can be filled.</div>
            <div class="form-grid" style="margin-top:8px;">
              <label>Drug:</label><input readonly value="${esc(m.name)}">
              <label>NDC:</label><input readonly value="${esc(m.ndc)}" class="mono">
              <label>Supplier:</label>
              <select id="s5-sup">
                ${state.suppliers.map(s => `<option value="${s.id}" ${s.primary ? 'selected' : ''}>${esc(s.name)} — Lead time: ${esc(s.leadTime)}</option>`).join('')}
              </select>
              <label>Order Qty:</label>
              <input type="number" id="s5-qty" value="${m.reorderQty}">
              <label>Priority:</label>
              <select id="s5-pri"><option>Routine</option><option>Next-Day</option><option selected>Same-Day Urgent</option></select>
              <label>Notes:</label>
              <input type="text" id="s5-notes" value="URGENT: patient refill pending for ${esc(p ? patientName(p) : '')}" class="span-3">
            </div>
            <div class="spacer"></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button onclick="window._wfStep5Back()">← Back</button>
              <button class="btn-primary" id="btn-submit-po">⛟ Submit Purchase Order ›</button>
            </div>
          </div>
        `;
      }

      // Normal fill path
      return `
        <div class="groupbox">
          <span class="gb-title">Step 5 — Mark for Fulfillment</span>
          <div class="notice ok">Stock confirmed. Marking prescription for dispensing.</div>
          <div class="form-grid" style="margin-top:8px;">
            <label>Drug:</label><input readonly value="${esc(m.name)}">
            <label>NDC:</label><input readonly value="${esc(m.ndc)}" class="mono">
            <label>Qty to Dispense:</label><input readonly value="${rx.qty} × ${esc(m.form)}">
            <label>Stock After Fill:</label><input readonly value="${m.stock - rx.qty} units remaining" style="background:${m.stock - rx.qty < m.reorderPt ? '#ffe4a0' : '#e4ffe4'};">
            <label>Lot Number:</label><input type="text" id="s5-lot" value="LOT-${Math.floor(Math.random()*9000+1000)}" class="mono">
            <label>Expiry on Lot:</label><input type="date" id="s5-exp" value="2027-08-31">
            <label>Patient Copay:</label><input readonly value="${fmtMoney(wf.copay)}" style="font-weight:bold;">
            <label>Counseling Required:</label>
            <label class="left"><input type="checkbox" id="s5-counsel" ${m.controlled ? 'checked' : ''}> Counseling offered / documented</label>
            <label>Pharmacist Verify:</label>
            <label class="left"><input type="checkbox" id="s5-verify" checked> Visually verified by RPh</label>
          </div>
          <div class="spacer"></div>
          <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button onclick="window._wfStep5Back()">← Back</button>
            <button class="btn-primary" id="btn-fill-rx">✓ Fill &amp; Label Rx ›</button>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      window._wfStep5Back = () => { wf.step = 4; rerender(); };
      window._wfStep6Go = () => { wf.step = 6; rerender(); };

      const fillBtn = document.getElementById('btn-fill-rx');
      if (fillBtn) {
        fillBtn.onclick = () => {
          const counsel = document.getElementById('s5-counsel');
          const verify = document.getElementById('s5-verify');
          if (!verify || !verify.checked) {
            toast('Pharmacist verification required before filling.', 'bad');
            return;
          }
          // Commit the fill
          const rx = getWfRx();
          const m = getWfMed();
          const p = getWfPatient();
          wf._lot = document.getElementById('s5-lot').value;
          m.stock = Math.max(0, m.stock - rx.qty);
          rx.refillsRemaining = Math.max(0, rx.refillsRemaining - 1);
          rx.lastFilled = new Date().toISOString().slice(0, 10);
          const q = { id: nextQId(), rxId: rx.id, patientId: p.id, medId: m.id, requestedAt: new Date().toISOString(), source: 'Refill Workflow', status: 'READY', notes: 'Filled via workflow' };
          state.refillQueue.unshift(q);
          wf.queueId = q.id;
          saveState();
          log('RX_FILLED', `${rx.id} — ${m.name} x${rx.qty} for ${patientName(p)} lot ${wf._lot}`);
          toast(`Rx filled. Bottle labeled. Placed in Will-Call.`, 'ok');
          wf.fillComplete = true;
          rerender();
        };
      }

      const poBtn = document.getElementById('btn-submit-po');
      if (poBtn) {
        poBtn.onclick = () => {
          const rx = getWfRx();
          const m = getWfMed();
          const p = getWfPatient();
          const supplierId = document.getElementById('s5-sup').value;
          const qty = parseInt(document.getElementById('s5-qty').value, 10) || m.reorderQty;
          const notes = document.getElementById('s5-notes').value;
          const po = { id: nextPOId(), supplierId, createdAt: new Date().toISOString(), status: 'IN_TRANSIT', items: [{ medId: m.id, qty, unitCost: m.awp, received: 0 }], notes };
          state.purchaseOrders.unshift(po);
          const q = { id: nextQId(), rxId: rx.id, patientId: p.id, medId: m.id, requestedAt: new Date().toISOString(), source: 'Refill Workflow', status: 'ON_ORDER', notes: 'Awaiting PO ' + po.id };
          state.refillQueue.unshift(q);
          wf.queueId = q.id;
          saveState();
          log('PO_CREATED', `${po.id} for ${m.name} qty ${qty} — patient refill pending`);
          toast(`PO ${po.id} submitted to ${getSupplier(supplierId).name}. ETA: ${getSupplier(supplierId).leadTime}.`, 'ok');
          wf.fillComplete = true;
          wf._poId = po.id;
          rerender();
        };
      }
    }, 0);

    // STEP 6 — Notify Patient
    function renderStep6() {
      const p = getWfPatient();
      const m = getWfMed();
      if (!p || !m) return '<div class="notice err">Missing patient data.</div>';

      const isOrder = wf._fillMode === 'order';
      const defaultMsg = isOrder
        ? `Hi ${p.first}, your refill of ${m.name} is on order. We expect it in ${wf._poId ? getSupplier(state.purchaseOrders.find(po => po.id === wf._poId).supplierId).leadTime : '1-2 business days'}. We will text you as soon as it arrives. Thank you — Community Drugs #4471.`
        : `Hi ${p.first}, your prescription for ${m.name} is ready for pickup at Community Drugs #4471, 227 Main Street. We're open 9am–9pm Mon–Sat. Reply STOP to opt out.`;

      if (wf.notifSent) {
        return `
          <div class="fill-summary" style="background:#e4f0ff;border-color:#0040c0;">
            <div class="fill-title" style="color:#002080;">📨 NOTIFICATION SENT</div>
            <div class="fill-grid">
              <span class="fill-key">Channel:</span><span class="fill-val">${esc(wf._notifChannel || 'SMS')}</span>
              <span class="fill-key">Recipient:</span><span class="fill-val">${esc(p.first)} ${esc(p.last)} · ${esc(p.phone)}</span>
              <span class="fill-key">Sent At:</span><span class="fill-val mono">${fmtDateTime(new Date())}</span>
              <span class="fill-key">Ref #:</span><span class="fill-val mono">${esc(wf._notifId || 'N/A')}</span>
            </div>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <div class="status-pill spl-ok" style="font-size:14px;padding:8px 24px;">REFILL WORKFLOW COMPLETE</div>
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
              <button onclick="router.go('rx-queue')">≡ Back to Refill Queue</button>
              <button onclick="router.go('dashboard')">⌂ Dashboard</button>
              <button class="btn-primary" onclick="window._wfDemo.reset()">↻ New Refill</button>
            </div>
          </div>
        `;
      }

      return `
        <div class="groupbox">
          <span class="gb-title">Step 6 — Notify Patient</span>
          <div class="notice ok">${isOrder ? 'Order placed. Notify patient of expected delay.' : 'Prescription ready. Notify patient for pickup.'}</div>
          <div class="notify-compose">
            <div class="form-grid" style="margin-bottom:8px;">
              <label>Send Via:</label>
              <select id="s6-chan">
                <option value="SMS">SMS (Text Message)</option>
                <option value="Email">Email</option>
                <option value="Automated Call">Automated Phone Call</option>
                <option value="App Push">App Push Notification</option>
              </select>
              <label>Recipient:</label>
              <input readonly value="${esc(p.first)} ${esc(p.last)} — ${esc(p.phone)}">
            </div>
            <label style="display:block;margin-bottom:3px;">Message:</label>
            <textarea id="s6-body" rows="5" style="width:100%;">${defaultMsg}</textarea>
          </div>
          <div class="spacer"></div>
          <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button onclick="window._wfStep6Back()">← Back</button>
            <button onclick="window._wfStep6Skip()">Skip — Notify Later</button>
            <button class="btn-primary" id="btn-send-notif">📨 Send Notification</button>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      window._wfStep6Back = () => { wf.step = 5; rerender(); };
      window._wfStep6Skip = () => {
        log('NOTIFY_SKIPPED', `Patient ${wf.patientId} — chose notify later`);
        toast('Notification deferred. Patient not yet notified.', 'info');
        router.go('rx-queue');
      };

      const sendBtn = document.getElementById('btn-send-notif');
      if (sendBtn) {
        sendBtn.onclick = () => {
          const chan = document.getElementById('s6-chan').value;
          const body = document.getElementById('s6-body').value;
          const p = getWfPatient();
          const notif = { id: nextNotifId(), to: p.id, channel: chan, body, sentAt: new Date().toISOString() };
          state.notifications.unshift(notif);
          wf._notifChannel = chan;
          wf._notifId = notif.id;
          saveState();
          log('NOTIFY_PICKUP', `${chan} to ${p.id} — ${body.slice(0, 60)}`);
          toast(`Notification sent via ${chan} to ${p.first} ${p.last}.`, 'ok');
          wf.notifSent = true;
          rerender();
        };
      }
    }, 0);
  }
};

// ----------------------------------------------------------------
// PRIOR AUTH QUEUE
// ----------------------------------------------------------------
routes['rx-pa'] = routes['insurance-pa'] = {
  title: () => 'Prior Authorization',
  key: () => 'rx-pa',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Prior Authorization Queue', 'Home › Insurance › Prior Authorization')}
      <div class="groupbox">
        <span class="gb-title">Open Prior Authorizations (${state.priorAuths.length})</span>
        <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>PA #</th><th>Requested</th><th>Patient</th><th>Drug</th><th>Prescriber</th>
            <th>Diagnosis</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
          ${state.priorAuths.map(pa => {
            const p = getPatient(pa.patientId);
            const m = getMed(pa.medId);
            const d = getPrescriber(pa.prescriberId);
            return `<tr>
              <td class="mono">${esc(pa.id)}</td>
              <td class="mono small">${fmtDateTime(pa.requestedAt)}</td>
              <td>${esc(patientName(p))}</td>
              <td>${esc(m ? m.name : '')}</td>
              <td>${esc(d ? d.name : '')}</td>
              <td class="small">${esc(pa.diagnosis)}</td>
              <td><span class="badge ${pa.status === 'APPROVED' ? 'badge-ok' : (pa.status === 'DENIED' ? 'badge-bad' : 'badge-warn')}">${esc(pa.status)}</span></td>
              <td>
                ${pa.status.startsWith('PENDING') ? `<button onclick="window._wf.checkPA('${pa.id}')">📞 Check Status</button>` : ''}
              </td>
            </tr>`;
          }).join('') || '<tr><td colspan="8" class="center muted">No prior authorizations.</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// INVENTORY
// ----------------------------------------------------------------
routes.inventory = {
  title: () => 'Inventory',
  key: () => 'inventory',
  render(root) {
    root.__filter = root.__filter || '';
    const meds = state.medications.filter(m =>
      !root.__filter || m.name.toLowerCase().includes(root.__filter) || m.ndc.includes(root.__filter)
    );
    root.innerHTML = `
      ${pageHeader('Inventory — Stock Levels', 'Home › Inventory › Stock Levels')}
      <div class="toolbar-strip">
        <span>Search:</span>
        <input id="inv-search" type="text" placeholder="Name or NDC..." style="width:240px;">
        <button id="inv-search-btn">🔍</button>
        <span class="sb-flex"></span>
        <button onclick="router.go('inventory-low')">⚠ Low Stock</button>
        <button onclick="router.go('purchasing')">⛟ Purchasing</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Medications (${meds.length})</span>
        <div class="table-wrap" style="max-height:560px;">
        <table class="data-table">
          <thead><tr>
            <th>NDC</th><th>Drug Name</th><th>Form</th><th>Schedule</th>
            <th>Mfr</th><th>Location</th><th>AWP</th><th>Retail</th>
            <th>Stock</th><th>Reorder Pt</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
          ${meds.map(m => {
            const low = m.stock < m.reorderPt;
            const crit = m.stock < m.reorderPt / 2;
            return `<tr class="${crit ? 'row-bad' : (low ? 'row-warn' : '')}">
              <td class="mono small">${esc(m.ndc)}</td>
              <td>${esc(m.name)}</td>
              <td>${esc(m.form)}</td>
              <td>${m.schedule !== 'RX' ? `<span class="badge badge-bad">${esc(m.schedule)}</span>` : esc(m.schedule)}</td>
              <td>${esc(m.mfr)}</td>
              <td class="mono">${esc(m.location)}</td>
              <td class="right mono">${fmtMoney(m.awp)}</td>
              <td class="right mono">${fmtMoney(m.retail)}</td>
              <td class="right bold">${m.stock}</td>
              <td class="right">${m.reorderPt}</td>
              <td>${crit ? '<span class="badge badge-bad">CRITICAL</span>' : (low ? '<span class="badge badge-warn">LOW</span>' : '<span class="badge badge-ok">OK</span>')}</td>
              <td><button onclick="window._wf.adjustInventory('${m.id}')">Adjust</button></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
    $('#inv-search-btn').onclick = () => {
      root.__filter = $('#inv-search').value.toLowerCase().trim();
      router.refresh();
    };
    $('#inv-search').addEventListener('keydown', e => { if (e.key === 'Enter') $('#inv-search-btn').click(); });
    $('#inv-search').value = root.__filter;
  }
};

// LOW STOCK
routes['inventory-low'] = {
  title: () => 'Low Stock Report',
  key: () => 'inventory-low',
  render(root) {
    const low = state.medications.filter(m => m.stock < m.reorderPt);
    root.innerHTML = `
      ${pageHeader('Low Stock Report', 'Home › Inventory › Low Stock')}
      <div class="notice">${low.length} medication(s) below reorder point. Select items and generate a purchase order.</div>
      <div class="groupbox">
        <span class="gb-title">Items Requiring Reorder</span>
        <form id="reorder-form">
        <table class="data-table">
          <thead><tr>
            <th><input type="checkbox" id="sel-all"></th>
            <th>NDC</th><th>Drug</th><th>Stock</th><th>Reorder Pt</th>
            <th>Suggested Qty</th><th>Unit Cost</th><th>Total</th><th>Mfr</th>
          </tr></thead>
          <tbody>
          ${low.map(m => `<tr>
            <td><input type="checkbox" name="sel" value="${m.id}" checked></td>
            <td class="mono small">${esc(m.ndc)}</td>
            <td>${esc(m.name)}</td>
            <td class="right bold">${m.stock}</td>
            <td class="right">${m.reorderPt}</td>
            <td><input type="number" name="qty-${m.id}" value="${m.reorderQty}" style="width:80px;"></td>
            <td class="right mono">${fmtMoney(m.awp)}</td>
            <td class="right mono">${fmtMoney(m.awp * m.reorderQty)}</td>
            <td>${esc(m.mfr)}</td>
          </tr>`).join('') || '<tr><td colspan="9" class="center muted">All stock levels are healthy.</td></tr>'}
          </tbody>
        </table>
        </form>
        <div class="spacer"></div>
        <div class="row" style="justify-content:flex-end;">
          <button onclick="router.go('inventory')">← Back</button>
          <button class="btn-primary" id="btn-gen-po" ${low.length === 0 ? 'disabled' : ''}>⛟ Generate Purchase Order ›</button>
        </div>
      </div>
    `;

    $('#sel-all') && ($('#sel-all').onchange = e => {
      $$('input[name="sel"]').forEach(c => c.checked = e.target.checked);
    });
    if (low.length > 0) {
      $('#btn-gen-po').onclick = () => {
        const sel = $$('input[name="sel"]:checked').map(c => c.value);
        if (sel.length === 0) return alertDialog('No selection', 'Please select at least one item.');
        const items = sel.map(medId => {
          const qty = parseInt($(`input[name="qty-${medId}"]`).value, 10) || 0;
          return { medId, qty };
        }).filter(i => i.qty > 0);
        window._wf.createPO(items);
      };
    }
  }
};

// EXPIRATION
routes['inventory-expiry'] = {
  title: () => 'Expiration Tracking',
  key: () => 'inventory-expiry',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Expiration Tracking', 'Home › Inventory › Expirations')}
      <div class="groupbox">
        <span class="gb-title">Lot Tracking (Mock)</span>
        <table class="data-table">
          <thead><tr><th>NDC</th><th>Drug</th><th>Lot #</th><th>Expires</th><th>Qty</th><th>Status</th></tr></thead>
          <tbody>
            <tr class="row-warn"><td class="mono small">00069-1530-66</td><td>Azithromycin 250mg</td><td class="mono">AZX221</td><td>2026-08-01</td><td class="right">42</td><td><span class="badge badge-warn">90 DAYS</span></td></tr>
            <tr class="row-bad"><td class="mono small">00074-3068-13</td><td>Albuterol HFA</td><td class="mono">PRI4421</td><td>2026-06-15</td><td class="right">3</td><td><span class="badge badge-bad">EXPIRES SOON</span></td></tr>
            <tr><td class="mono small">49281-0510-50</td><td>Influenza Vaccine</td><td class="mono">FLU2526</td><td>2026-12-31</td><td class="right">145</td><td><span class="badge badge-ok">OK</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// PURCHASING
// ----------------------------------------------------------------
routes.purchasing = {
  title: () => 'Purchase Orders',
  key: () => 'purchasing',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Purchase Orders', 'Home › Purchasing › Orders')}
      <div class="toolbar-strip">
        <button onclick="router.go('inventory-low')">⚠ Low Stock → PO</button>
        <button onclick="router.go('purchasing-receive')">📦 Receive Shipment</button>
        <button onclick="router.go('purchasing-suppliers')">🏭 Suppliers</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">All Purchase Orders</span>
        <table class="data-table">
          <thead><tr>
            <th>PO #</th><th>Supplier</th><th>Created</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
          ${state.purchaseOrders.map(po => {
            const s = getSupplier(po.supplierId);
            const total = po.items.reduce((t, i) => t + i.qty * i.unitCost, 0);
            return `<tr>
              <td class="mono">${esc(po.id)}</td>
              <td>${esc(s ? s.name : '')}</td>
              <td class="mono small">${fmtDateTime(po.createdAt)}</td>
              <td class="right">${po.items.length}</td>
              <td class="right mono">${fmtMoney(total)}</td>
              <td><span class="badge ${po.status === 'RECEIVED' ? 'badge-ok' : (po.status === 'IN_TRANSIT' ? 'badge-info' : 'badge-warn')}">${esc(po.status)}</span></td>
              <td>
                ${po.status === 'DRAFT' ? `<button onclick="window._wf.submitPO('${po.id}')">▶ Submit</button>` : ''}
                ${po.status === 'IN_TRANSIT' ? `<button onclick="window._wf.receivePO('${po.id}')">📦 Receive</button>` : ''}
              </td>
            </tr>`;
          }).join('') || '<tr><td colspan="7" class="center muted">No purchase orders.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['purchasing-receive'] = {
  title: () => 'Receive Shipment',
  key: () => 'purchasing-receive',
  render(root) {
    const inTransit = state.purchaseOrders.filter(p => p.status === 'IN_TRANSIT');
    root.innerHTML = `
      ${pageHeader('Receive Shipment', 'Home › Purchasing › Receive')}
      <div class="notice">Select a PO marked IN_TRANSIT to mark items as received and update inventory.</div>
      <div class="groupbox">
        <span class="gb-title">Awaiting Receipt</span>
        <table class="data-table">
          <thead><tr><th>PO #</th><th>Supplier</th><th>Items</th><th>Action</th></tr></thead>
          <tbody>
          ${inTransit.map(po => {
            const s = getSupplier(po.supplierId);
            return `<tr>
              <td class="mono">${esc(po.id)}</td>
              <td>${esc(s ? s.name : '')}</td>
              <td>${po.items.length} line(s)</td>
              <td><button class="btn-primary" onclick="window._wf.receivePO('${po.id}')">📦 Receive Shipment</button></td>
            </tr>`;
          }).join('') || '<tr><td colspan="4" class="center muted">No shipments awaiting receipt.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['purchasing-suppliers'] = {
  title: () => 'Suppliers',
  key: () => 'purchasing-suppliers',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Suppliers', 'Home › Purchasing › Suppliers')}
      <div class="groupbox">
        <span class="gb-title">Wholesalers &amp; Distributors</span>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Account #</th><th>Phone</th><th>Cutoff</th><th>Lead Time</th><th>Terms</th><th>Primary</th></tr></thead>
          <tbody>
          ${state.suppliers.map(s => `<tr>
            <td class="mono">${esc(s.id)}</td>
            <td>${esc(s.name)}</td>
            <td class="mono">${esc(s.acct)}</td>
            <td class="mono">${esc(s.phone)}</td>
            <td class="mono">${esc(s.cutoff)}</td>
            <td>${esc(s.leadTime)}</td>
            <td>${esc(s.terms)}</td>
            <td>${s.primary ? '<span class="badge badge-ok">PRIMARY</span>' : ''}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------------------------------------------------------
// INSURANCE
// ----------------------------------------------------------------
routes.insurance = {
  title: () => 'Claims Queue',
  key: () => 'insurance',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Insurance Claims', 'Home › Insurance › Claims')}
      <div class="toolbar-strip">
        <button onclick="router.go('insurance-verify')">✓ Verify Eligibility</button>
        <button onclick="router.go('insurance-pa')">📋 Prior Auth Queue</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">All Claims</span>
        <table class="data-table">
          <thead><tr><th>Claim #</th><th>Date</th><th>Patient</th><th>Drug</th><th>Billed</th><th>Paid</th><th>Copay</th><th>Status</th><th>Reject Reason</th><th>Action</th></tr></thead>
          <tbody>
          ${state.claims.map(c => {
            const p = getPatient(c.patientId);
            const m = getMed(c.medId);
            return `<tr class="${c.status === 'REJECTED' ? 'row-bad' : ''}">
              <td class="mono">${esc(c.id)}</td>
              <td class="mono">${fmtDate(c.submittedAt)}</td>
              <td>${esc(patientName(p))}</td>
              <td>${esc(m ? m.name : '')}</td>
              <td class="right mono">${fmtMoney(c.billed)}</td>
              <td class="right mono">${fmtMoney(c.paid)}</td>
              <td class="right mono">${fmtMoney(c.copay)}</td>
              <td><span class="badge ${c.status === 'PAID' ? 'badge-ok' : 'badge-bad'}">${esc(c.status)}</span></td>
              <td class="small">${esc(c.rejectReason || '')}</td>
              <td>
                ${c.status === 'REJECTED' ? `<button onclick="window._wf.initiatePAFromClaim('${c.id}')">📋 Initiate PA</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// VERIFY ELIGIBILITY
routes['insurance-verify'] = {
  title: () => 'Verify Eligibility',
  key: () => 'insurance-verify',
  render(root, params) {
    const preP = params && params.patientId || '';
    root.innerHTML = `
      ${pageHeader('Verify Insurance Eligibility', 'Home › Insurance › Verify')}
      <div class="groupbox">
        <span class="gb-title">Eligibility Inquiry</span>
        <form id="verify-form">
          <div class="form-grid">
            <label>Patient:*</label>
            <select name="patientId" required>
              <option value="">-- Select --</option>
              ${state.patients.map(p => `<option value="${p.id}" ${preP === p.id ? 'selected' : ''}>${esc(patientName(p))} - ${esc(p.insurancePlan)}</option>`).join('')}
            </select>
            <label>Service Date:</label>
            <input type="date" name="serviceDate" value="2026-05-16">
            <label>Plan:</label>
            <input type="text" id="vf-plan" readonly>
            <label>Member ID:</label>
            <input type="text" id="vf-member" readonly>
          </div>
          <div class="spacer"></div>
          <button type="submit" class="btn-primary">▶ Submit Eligibility Inquiry</button>
        </form>
        <div id="vf-result"></div>
      </div>
    `;

    function syncFields() {
      const id = $('select[name="patientId"]').value;
      const p = getPatient(id);
      $('#vf-plan').value = p ? p.insurancePlan : '';
      $('#vf-member').value = p ? p.insuranceId : '';
    }
    $('select[name="patientId"]').onchange = syncFields;
    syncFields();

    $('#verify-form').onsubmit = (e) => {
      e.preventDefault();
      const id = $('select[name="patientId"]').value;
      if (!id) return;
      window._wf.verifyEligibility(id, $('#vf-result'));
    };
  }
};

// ----------------------------------------------------------------
// APPOINTMENTS
// ----------------------------------------------------------------
routes.appointments = {
  title: () => 'Schedule',
  key: () => 'appointments',
  render(root) {
    const today = '2026-05-16';
    const upcoming = state.appointments.filter(a => a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    root.innerHTML = `
      ${pageHeader('Appointment Schedule', 'Home › Appointments › Schedule')}
      <div class="toolbar-strip">
        <button onclick="router.go('appointments-vaccine')">💉 Book Vaccine</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Upcoming Appointments (${upcoming.length})</span>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th><th>Staff</th></tr></thead>
          <tbody>
          ${upcoming.map(a => {
            const p = getPatient(a.patientId);
            return `<tr>
              <td class="mono">${esc(a.date)}</td>
              <td class="mono">${esc(a.time)}</td>
              <td>${esc(patientName(p))}</td>
              <td>${esc(a.type)}</td>
              <td><span class="badge badge-info">${esc(a.status)}</span></td>
              <td>${esc(a.staff)}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="6" class="center muted">No upcoming appointments.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['appointments-vaccine'] = {
  title: () => 'Vaccine Booking',
  key: () => 'appointments-vaccine',
  render(root, params) {
    const preP = params && params.patientId || '';
    const vaccines = state.medications.filter(m => m.vaccine);
    const today = '2026-05-16';
    const slots = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
    const dayAppts = state.appointments.filter(a => a.date === today).map(a => a.time);
    root.innerHTML = `
      ${pageHeader('Vaccine Appointment Booking', 'Home › Appointments › Vaccine')}
      <form id="vax-form">
        <div class="groupbox">
          <span class="gb-title">Patient &amp; Vaccine</span>
          <div class="form-grid">
            <label>Patient:*</label>
            <select name="patientId" required>
              <option value="">-- Select --</option>
              ${state.patients.map(p => `<option value="${p.id}" ${preP === p.id ? 'selected' : ''}>${esc(patientName(p))} (Age ${age(p.dob)})</option>`).join('')}
            </select>
            <label>Vaccine:*</label>
            <select name="medId" required>
              <option value="">-- Select --</option>
              ${vaccines.map(v => `<option value="${v.id}">${esc(v.name)} (stock: ${v.stock})</option>`).join('')}
            </select>
            <label>Date:*</label>
            <input type="date" name="date" value="${today}" required>
            <label>Available Slots:*</label>
            <select name="time" required>
              <option value="">-- Select slot --</option>
              ${slots.map(s => `<option value="${s}" ${dayAppts.includes(s) ? 'disabled' : ''}>${s}${dayAppts.includes(s) ? ' (booked)' : ''}</option>`).join('')}
            </select>
            <label>Consent on File:</label>
            <label class="left"><input type="checkbox" name="consent" checked> Patient screening &amp; consent completed</label>
            <label>Notes:</label>
            <textarea name="notes" class="span-3" rows="2"></textarea>
          </div>
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button type="button" onclick="router.go('appointments')">Cancel</button>
          <button type="submit" class="btn-primary">▶ Book Appointment</button>
        </div>
      </form>
    `;

    $('#vax-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v;
      window._wf.bookVaccine(data);
    };
  }
};

// ----------------------------------------------------------------
// REPORTS
// ----------------------------------------------------------------
routes.reports = {
  title: () => 'Reports',
  key: () => 'reports',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Reports Center', 'Home › Reports')}
      <div class="groupbox">
        <span class="gb-title">Available Reports</span>
        <table class="data-table">
          <thead><tr><th>Report</th><th>Description</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>📊 Daily Sales Summary</td><td>Sales by drug class for a given date range</td><td><button onclick="router.go('reports-sales')">Run</button></td></tr>
            <tr><td>📋 DEA Controlled Substance Log</td><td>CSOS-compatible C-II through C-V dispensing report</td><td><button onclick="router.go('reports-compliance')">Run</button></td></tr>
            <tr><td>⚠ Inventory Variance</td><td>Cycle count vs system stock</td><td><button onclick="alertDialog('Inventory Variance', 'This report is not yet implemented in this build.')">Run</button></td></tr>
            <tr><td>📨 Refill Notification Log</td><td>All patient communications sent</td><td><button onclick="window._wf.showNotifLog()">Run</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['reports-sales'] = {
  title: () => 'Daily Sales Report',
  key: () => 'reports-sales',
  render(root) {
    const paid = state.claims.filter(c => c.status === 'PAID');
    const rev = paid.reduce((s, c) => s + c.copay + c.paid, 0);
    root.innerHTML = `
      ${pageHeader('Daily Sales Summary', 'Home › Reports › Sales')}
      <div class="toolbar-strip">
        <span>From:</span><input type="date" id="r-from" value="2026-05-15">
        <span>To:</span><input type="date" id="r-to" value="2026-05-16">
        <button id="btn-run-sales" class="btn-primary">▶ Generate Report</button>
        <button onclick="window._wf.exportCSV('sales')">💾 Export CSV</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Results</span>
        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-label">CLAIMS</div><div class="kpi-value">${paid.length}</div></div>
          <div class="kpi-card"><div class="kpi-label">REVENUE</div><div class="kpi-value">${fmtMoney(rev)}</div></div>
          <div class="kpi-card"><div class="kpi-label">COPAY COLLECTED</div><div class="kpi-value">${fmtMoney(paid.reduce((s,c)=>s+c.copay,0))}</div></div>
          <div class="kpi-card"><div class="kpi-label">INS. REIMBURSEMENT</div><div class="kpi-value">${fmtMoney(paid.reduce((s,c)=>s+c.paid,0))}</div></div>
        </div>
        <table class="data-table">
          <thead><tr><th>Claim #</th><th>Date</th><th>Patient</th><th>Drug</th><th>Billed</th><th>Paid</th><th>Copay</th></tr></thead>
          <tbody>
          ${paid.map(c => { const p=getPatient(c.patientId); const m=getMed(c.medId);
            return `<tr><td class="mono">${esc(c.id)}</td><td class="mono">${fmtDate(c.submittedAt)}</td><td>${esc(patientName(p))}</td><td>${esc(m?m.name:'')}</td><td class="right mono">${fmtMoney(c.billed)}</td><td class="right mono">${fmtMoney(c.paid)}</td><td class="right mono">${fmtMoney(c.copay)}</td></tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    `;
    $('#btn-run-sales').onclick = () => toast('Report regenerated.', 'ok');
  }
};

routes['reports-compliance'] = {
  title: () => 'DEA Compliance',
  key: () => 'reports-compliance',
  render(root) {
    const ctrl = state.medications.filter(m => m.controlled);
    root.innerHTML = `
      ${pageHeader('DEA Controlled Substance Log', 'Home › Reports › Compliance')}
      <div class="toolbar-strip">
        <span>From:</span><input type="date" value="2026-05-01">
        <span>To:</span><input type="date" value="2026-05-16">
        <span>Schedule:</span>
        <select><option>All</option><option>C-II</option><option>C-III</option><option>C-IV</option><option>C-V</option></select>
        <button class="btn-primary">▶ Generate</button>
        <button onclick="window._wf.exportCSV('compliance')">💾 Export CSOS</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Controlled Substance Inventory</span>
        <table class="data-table">
          <thead><tr><th>Schedule</th><th>NDC</th><th>Drug</th><th>On Hand</th><th>Last Audit</th><th>DEA Form 222</th></tr></thead>
          <tbody>
          ${ctrl.map(m => `<tr>
            <td><span class="badge badge-bad">${esc(m.schedule)}</span></td>
            <td class="mono small">${esc(m.ndc)}</td>
            <td>${esc(m.name)}</td>
            <td class="right bold">${m.stock}</td>
            <td class="mono">2026-04-30</td>
            <td class="mono">N/A</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="notice">All controlled substance dispensing has been logged to the state PMP within the required reporting window.</div>
    `;
  }
};

// ============================================================
// WORKFLOWS (the core demoable actions)
// ============================================================
window._wf = {

  // === START REFILL FROM PATIENT PROFILE (picks first active Rx) ===
  startRefill(patientId) {
    const rxs = state.prescriptions.filter(r => r.patientId === patientId && r.status === 'ACTIVE' && r.refillsRemaining > 0);
    if (rxs.length === 0) {
      return alertDialog('No Refills Available', 'This patient has no active prescriptions with refills remaining.');
    }
    const options = rxs.map(r => {
      const m = getMed(r.medId);
      return `<option value="${r.id}">${esc(m.name)} - Rx ${esc(r.id)} (${r.refillsRemaining} refills left)</option>`;
    }).join('');
    showModal('Select Prescription to Refill', `
      <div class="form-grid cols-2">
        <label>Prescription:</label>
        <select id="rfsel">${options}</select>
      </div>
    `, [
      { label: 'Process Refill', primary: true, onClick: () => {
        const rxId = $('#rfsel').value;
        // create queue item + process
        const rx = getRx(rxId);
        const q = { id: nextQId(), rxId, patientId, medId: rx.medId, requestedAt: new Date().toISOString(), source: 'Counter', status: 'PENDING', notes: 'Manual refill' };
        state.refillQueue.unshift(q);
        saveState();
        log('REFILL_REQUEST', `Manual refill for ${rxId}`);
        setTimeout(() => window._wf.processRefill(q.id), 100);
      }},
      { label: 'Cancel' }
    ]);
  },

  startRefillFromRx(rxId) {
    const rx = getRx(rxId);
    if (!rx) return;
    if (rx.refillsRemaining <= 0) {
      return alertDialog('No Refills Remaining', `Rx ${rxId} has no refills remaining. The prescriber must be contacted for authorization.`);
    }
    const q = { id: nextQId(), rxId, patientId: rx.patientId, medId: rx.medId, requestedAt: new Date().toISOString(), source: 'Counter', status: 'PENDING', notes: '' };
    state.refillQueue.unshift(q);
    saveState();
    log('REFILL_REQUEST', `Manual refill for ${rxId}`);
    window._wf.processRefill(q.id);
  },

  // === PROCESS REFILL WORKFLOW (the main demo) ===
  async processRefill(queueId) {
    const item = state.refillQueue.find(q => q.id === queueId);
    if (!item) return;
    const rx = getRx(item.rxId);
    const p = getPatient(item.patientId);
    const m = getMed(item.medId);
    const d = getPrescriber(rx.prescriberId);

    item.status = 'IN_PROGRESS';
    saveState();
    log('REFILL_START', `Started ${queueId} for ${p.last}, ${p.first} - ${m.name}`);

    // Build wizard modal
    const html = `
      <div class="steps">
        <div class="step active" id="ws-1">1. Eligibility</div>
        <div class="step" id="ws-2">2. Insurance</div>
        <div class="step" id="ws-3">3. Inventory</div>
        <div class="step" id="ws-4">4. Fill / Order</div>
        <div class="step" id="ws-5">5. Notify</div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Prescription Details</span>
        <div class="form-grid">
          <label>Patient:</label><input readonly value="${esc(patientName(p))} - DOB ${fmtDate(p.dob)}">
          <label>Rx Number:</label><input readonly value="${esc(rx.id)}">
          <label>Drug:</label><input readonly value="${esc(m.name)}">
          <label>SIG:</label><input readonly value="${esc(rx.sig)}">
          <label>Qty / Days:</label><input readonly value="${rx.qty} / ${rx.daysSupply}">
          <label>Refills Left:</label><input readonly value="${rx.refillsRemaining}">
          <label>Prescriber:</label><input readonly value="${esc(d.name)}">
          <label>Allergies:</label><input readonly value="${esc(p.allergies)}" style="background:#ffe4e4;">
        </div>
      </div>

      <div id="wf-step-area" class="groupbox">
        <span class="gb-title" id="wf-step-title">Step 1: Refill Eligibility Check</span>
        <div id="wf-step-body">
          <div class="notice">Checking refill eligibility...</div>
          <div class="progress-track"><div class="progress-bar" id="wf-bar" style="width:0%;"></div></div>
        </div>
      </div>
    `;

    // We render via modal, but use buttons to advance
    let resolveFn;
    const closer = new Promise(r => resolveFn = r);
    $('#modal-title').textContent = 'Refill Workflow - ' + item.id;
    $('#modal-body').innerHTML = html;
    $('#modal-footer').innerHTML = '';
    $('#modal-backdrop').classList.remove('hidden');

    function setStep(n) {
      [1,2,3,4,5].forEach(i => {
        const el = $('#ws-' + i);
        el.classList.toggle('active', i === n);
        el.classList.toggle('done', i < n);
      });
    }
    function setBody(title, html, buttons) {
      $('#wf-step-title').textContent = title;
      $('#wf-step-body').innerHTML = html;
      const footer = $('#modal-footer');
      footer.innerHTML = '';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.textContent = b.label;
        if (b.primary) btn.className = 'btn-primary';
        if (b.danger) btn.classList.add('btn-danger');
        btn.onclick = b.onClick;
        footer.appendChild(btn);
      });
    }
    function progress(elId, to, then) {
      let v = 0;
      const i = setInterval(() => {
        v += 10;
        const el = $('#' + elId);
        if (el) el.style.width = v + '%';
        if (v >= to) { clearInterval(i); then && then(); }
      }, 80);
    }

    // ---- STEP 1: Refill eligibility ----
    progress('wf-bar', 100, () => {
      const tooEarly = false; // mock: pass
      const noRefills = rx.refillsRemaining <= 0;
      setBody('Step 1: Refill Eligibility Check', `
        <div class="notice ${noRefills ? 'err' : 'ok'}">
          ${noRefills
            ? '❌ NO REFILLS REMAINING. Prescriber authorization required.'
            : '✓ ELIGIBLE: ' + rx.refillsRemaining + ' refill(s) remaining on file. Last fill ' + fmtDate(rx.lastFilled) + '.'}
        </div>
        <div class="form-grid">
          <label>Days Since Last Fill:</label><input readonly value="${Math.round((new Date('2026-05-16') - new Date(rx.lastFilled)) / 86400000)} days">
          <label>Min Days Allowed:</label><input readonly value="${rx.daysSupply - 7} days (insurance window)">
          <label>Refill Status:</label><input readonly value="${noRefills ? 'BLOCKED' : 'WITHIN WINDOW'}" style="background:${noRefills ? '#ffe4e4' : '#e4ffe4'};">
        </div>
      `, [
        { label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } },
        { label: '▶ Continue to Insurance', primary: true, onClick: step2 },
      ]);
    });

    // ---- STEP 2: Insurance verification ----
    function step2() {
      setStep(2);
      setBody('Step 2: Insurance Adjudication', `
        <div class="notice">Submitting claim to ${esc(p.insurancePlan)} (BIN ${esc(p.insuranceBin)} / PCN ${esc(p.insurancePcn)})...</div>
        <div class="progress-track"><div class="progress-bar" id="wf-bar2" style="width:0%;"></div></div>
      `, [{ label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } }]);

      progress('wf-bar2', 100, () => {
        const paRequired = m.paRequired;
        if (paRequired) {
          setBody('Step 2: Insurance Adjudication — REJECTED', `
            <div class="notice err"><b>⚠ CLAIM REJECTED — INSURANCE EXCEPTION</b><br>Reject Code: 75 — PRIOR AUTHORIZATION REQUIRED<br>Plan: ${esc(p.insurancePlan)}<br>Member ID: ${esc(p.insuranceId)}<br>Drug: ${esc(m.name)}</div>
            <div>This medication requires a prior authorization from the prescriber. Initiate PA workflow to fax request to ${esc(d.name)}'s office.</div>
          `, [
            { label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } },
            { label: '📋 Initiate Prior Auth', primary: true, onClick: () => {
              const pa = { id: nextPAId(), patientId: p.id, medId: m.id, prescriberId: rx.prescriberId, status: 'PENDING_PROVIDER', requestedAt: new Date().toISOString(), diagnosis: '(captured from Rx record)', notes: 'PA initiated from refill workflow ' + item.id };
              state.priorAuths.unshift(pa);
              // Add claim record too
              const claim = { id: nextClaimId(), rxFillId: item.id, patientId: p.id, medId: m.id, billed: m.retail * rx.qty, paid: 0, copay: 0, status: 'REJECTED', rejectCode: '75', rejectReason: 'PRIOR AUTHORIZATION REQUIRED', submittedAt: new Date().toISOString() };
              state.claims.unshift(claim);
              item.status = 'REJECTED';
              item.notes = 'PA initiated: ' + pa.id;
              saveState();
              log('PA_INITIATED', `${pa.id} for ${m.name}, patient ${p.id}`);
              toast(`Prior auth ${pa.id} initiated. Fax sent to ${d.name}.`, 'info');
              setBody('Step 2: Prior Authorization Initiated', `
                <div class="notice ok"><b>✓ PRIOR AUTHORIZATION INITIATED</b><br>PA #: ${esc(pa.id)}<br>Drug: ${esc(m.name)}<br>Prescriber: ${esc(d.name)}<br>Status: PENDING PROVIDER</div>
                <div>A PA request has been faxed to ${esc(d.name)}'s office. The refill stays in the queue marked <b>REJECTED</b> until the prior authorization is approved. Track it in the <b>Prior Authorization Queue</b>.</div>
              `, [
                { label: 'Done', primary: true, onClick: () => { closeModal(); router.refresh(); resolveFn(); } },
                { label: 'Open Prior Auth Queue ›', onClick: () => { closeModal(); router.go('rx-pa'); resolveFn(); } },
              ]);
            }},
          ]);
        } else {
          // approved
          const copay = parseFloat((p.copay || '$10').replace(/[^0-9.]/g, '')) || 10;
          setBody('Step 2: Insurance Adjudication — APPROVED', `
            <div class="notice ok"><b>CLAIM APPROVED</b><br>Plan: ${esc(p.insurancePlan)}<br>Billed: ${fmtMoney(m.retail * rx.qty)}<br>Plan Paid: ${fmtMoney(m.retail * rx.qty - copay)}<br>Patient Copay: <b>${fmtMoney(copay)}</b></div>
            <div class="form-grid">
              <label>Auth #:</label><input readonly value="AUTH-${Math.floor(Math.random()*900000+100000)}">
              <label>Adjudication Time:</label><input readonly value="${fmtDateTime(new Date())}">
            </div>
          `, [
            { label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } },
            { label: '▶ Continue to Inventory', primary: true, onClick: () => step3(copay) },
          ]);
        }
      });
    }

    // ---- STEP 3: Inventory check ----
    function step3(copay) {
      setStep(3);
      const lowStock = m.stock < rx.qty;
      setBody('Step 3: Inventory Check', `
        <div class="notice ${lowStock ? 'err' : 'ok'}">
          ${lowStock
            ? `❌ INSUFFICIENT STOCK: Need ${rx.qty}, on hand ${m.stock}. Supplier order required.`
            : `✓ IN STOCK: ${m.stock} units on hand. Reserving ${rx.qty} for fulfillment.`}
        </div>
        <div class="form-grid">
          <label>Location:</label><input readonly value="${esc(m.location)}">
          <label>NDC:</label><input readonly value="${esc(m.ndc)}">
          <label>On Hand:</label><input readonly value="${m.stock}">
          <label>Need:</label><input readonly value="${rx.qty}">
          <label>Reorder Point:</label><input readonly value="${m.reorderPt}">
          <label>Reorder Qty:</label><input readonly value="${m.reorderQty}">
        </div>
      `, [
        { label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } },
        lowStock
          ? { label: '⛟ Create Supplier Order', primary: true, onClick: () => step4out(copay) }
          : { label: '✓ Mark for Fulfillment', primary: true, onClick: () => step4ok(copay) },
      ]);
    }

    // ---- STEP 4-OK: Fulfill ----
    function step4ok(copay) {
      setStep(4);
      // decrement stock, increment refills used, log claim, log fill
      m.stock -= rx.qty;
      rx.refillsRemaining = Math.max(0, rx.refillsRemaining - 1);
      rx.lastFilled = new Date().toISOString().slice(0, 10);
      const claim = { id: nextClaimId(), rxFillId: item.id, patientId: p.id, medId: m.id, billed: m.retail * rx.qty, paid: m.retail * rx.qty - copay, copay, status: 'PAID', submittedAt: new Date().toISOString() };
      state.claims.unshift(claim);
      item.status = 'READY';
      saveState();
      log('RX_FILLED', `${rx.id} - ${m.name} x${rx.qty} for ${patientName(p)} (copay ${fmtMoney(copay)})`);
      setBody('Step 4: Marked for Fulfillment', `
        <div class="notice ok"><b>✓ MARKED FOR FULFILLMENT — READY FOR PICKUP</b><br>Rx Bottle Label Printed · Sticker Printed · Bagged for Will-Call</div>
        <div class="form-grid">
          <label>Fill ID:</label><input readonly value="${esc(item.id)}">
          <label>Claim #:</label><input readonly value="${esc(claim.id)}">
          <label>Qty Dispensed:</label><input readonly value="${rx.qty}">
          <label>Lot # / Expires:</label><input readonly value="LOT-${Math.floor(Math.random()*9000+1000)} / 2027-08">
          <label>New Stock Level:</label><input readonly value="${m.stock}">
          <label>Patient Copay:</label><input readonly value="${fmtMoney(copay)}">
        </div>
      `, [
        { label: 'Done (Notify Later)', onClick: () => { closeModal(); router.refresh(); resolveFn(); } },
        { label: '📨 Notify Patient ›', primary: true, onClick: () => step5(item, p, m) },
      ]);
    }

    // ---- STEP 4-OUT-OF-STOCK: create PO ----
    function step4out(copay) {
      setStep(4);
      setBody('Step 4: Create Supplier Order', `
        <div class="notice">Drafting purchase order to primary supplier.</div>
        <div class="form-grid">
          <label>Supplier:</label>
          <select id="po-sup">
            ${state.suppliers.map(s => `<option value="${s.id}" ${s.primary ? 'selected' : ''}>${esc(s.name)} (${esc(s.leadTime)})</option>`).join('')}
          </select>
          <label>Order Quantity:</label>
          <input type="number" id="po-qty" value="${m.reorderQty}">
          <label>Notes:</label>
          <input type="text" id="po-notes" value="Urgent: out-of-stock on patient refill ${item.id}">
        </div>
      `, [
        { label: 'Cancel', onClick: () => { closeModal(); item.status = 'PENDING'; saveState(); router.refresh(); resolveFn(); } },
        { label: '▶ Submit PO', primary: true, onClick: () => {
          const supplierId = $('#po-sup').value;
          const qty = parseInt($('#po-qty').value, 10) || m.reorderQty;
          const po = { id: nextPOId(), supplierId, createdAt: new Date().toISOString(), status: 'IN_TRANSIT', items: [{ medId: m.id, qty, unitCost: m.awp, received: 0 }], notes: $('#po-notes').value };
          state.purchaseOrders.unshift(po);
          item.status = 'ON_ORDER';
          item.notes = 'On supplier order: ' + po.id;
          saveState();
          log('PO_CREATED', `${po.id} for ${m.name} qty ${qty}`);
          toast(`PO ${po.id} submitted. ETA: ${getSupplier(supplierId).leadTime}.`, 'ok');
          setBody('Step 4: Order Submitted', `
            <div class="notice ok"><b>✓ PURCHASE ORDER SUBMITTED</b><br>PO #: ${esc(po.id)}<br>Supplier: ${esc(getSupplier(supplierId).name)}<br>ETA: ${esc(getSupplier(supplierId).leadTime)}</div>
            <div>The refill request remains in the queue with status <b>ON_ORDER</b>. The customer will be notified when stock arrives.</div>
          `, [
            { label: 'Done (Notify Later)', onClick: () => { closeModal(); router.refresh(); resolveFn(); } },
            { label: '📨 Notify Customer of Delay', primary: true, onClick: () => {
              const notif = { id: nextNotifId(), to: p.id, channel: 'SMS', body: `Hi ${p.first}, your refill of ${m.name} is on order and should arrive in ${getSupplier(supplierId).leadTime}. We'll text you when it's ready.`, sentAt: new Date().toISOString() };
              state.notifications.unshift(notif);
              saveState();
              log('NOTIFY_DELAY', `SMS to ${p.id} re ${po.id}`);
              toast('Delay notification sent to patient.', 'info');
              closeModal();
              router.refresh();
              resolveFn();
            } },
          ]);
        } },
      ]);
    }

    // ---- STEP 5: Notify ----
    function step5(item, p, m) {
      setStep(5);
      setBody('Step 5: Notify Patient', `
        <div class="form-grid">
          <label>Channel:</label>
          <select id="nf-chan">
            <option value="SMS">SMS (Text Message)</option>
            <option value="Email">Email</option>
            <option value="Phone">Auto-Phone Call</option>
          </select>
          <label>Recipient:</label>
          <input readonly value="${esc(p.first)} ${esc(p.last)} — ${esc(p.phone)}">
          <label>Message:</label>
          <textarea id="nf-body" rows="4" class="span-3">Hi ${esc(p.first)}, your prescription for ${esc(m.name)} is ready for pickup at Community Drugs #4471, 227 Main Street. Open 9am-9pm. Reply STOP to unsubscribe.</textarea>
        </div>
      `, [
        { label: 'Skip', onClick: () => { closeModal(); router.refresh(); resolveFn(); } },
        { label: '📨 Send Notification', primary: true, onClick: () => {
          const notif = { id: nextNotifId(), to: p.id, channel: $('#nf-chan').value, body: $('#nf-body').value, sentAt: new Date().toISOString() };
          state.notifications.unshift(notif);
          saveState();
          log('NOTIFY_PICKUP', `${notif.channel} to ${p.id} re ${item.id}`);
          toast(`Notification sent via ${notif.channel}.`, 'ok');
          closeModal();
          router.refresh();
          resolveFn();
        }},
      ]);
    }

    return closer;
  },

  // === STANDALONE NOTIFY (queue row button) ===
  notifyPickup(queueId) {
    const item = state.refillQueue.find(q => q.id === queueId);
    if (!item) return;
    const p = getPatient(item.patientId);
    const m = getMed(item.medId);
    showModal('Notify Patient — ' + item.id, `
      <div class="form-grid">
        <label>Channel:</label>
        <select id="nf-chan2"><option>SMS</option><option>Email</option><option>Phone</option></select>
        <label>Message:</label>
        <textarea id="nf-body2" rows="4" class="span-3">Hi ${esc(p.first)}, your prescription for ${esc(m.name)} is ready for pickup at Community Drugs #4471.</textarea>
      </div>
    `, [
      { label: 'Cancel' },
      { label: '📨 Send', primary: true, onClick: () => {
        const notif = { id: nextNotifId(), to: p.id, channel: $('#nf-chan2').value, body: $('#nf-body2').value, sentAt: new Date().toISOString() };
        state.notifications.unshift(notif);
        saveState();
        log('NOTIFY_PICKUP', `${notif.channel} to ${p.id} re ${item.id}`);
        toast('Notification sent.', 'ok');
      }},
    ]);
  },

  // === DUR review during new Rx entry ===
  runDUR(data) {
    const p = getPatient(data.patientId);
    const m = getMed(data.medId);
    const interactions = [];
    // mock: anyone on Lisinopril taking ibuprofen, etc - we'll fake one warning if allergy hits
    const allergyHit = (p.allergies || '').toLowerCase().includes(m.generic.toLowerCase().slice(0, 5));
    if (allergyHit) interactions.push({ sev: 'SEVERE', text: `Patient allergy on file: ${p.allergies} may interact with ${m.generic}.` });
    if (m.controlled) interactions.push({ sev: 'INFO', text: `Controlled substance (${m.schedule}). PMP query recommended.` });
    if (m.paRequired) interactions.push({ sev: 'WARN', text: `Drug requires Prior Authorization for ${p.insurancePlan}.` });

    showModal('DUR Review — Drug Utilization', `
      <div class="notice">Reviewing ${esc(m.name)} for ${esc(patientName(p))}...</div>
      <table class="data-table">
        <thead><tr><th>Severity</th><th>Finding</th></tr></thead>
        <tbody>
        ${interactions.length === 0
          ? '<tr><td colspan="2" class="center">No clinically significant interactions or alerts.</td></tr>'
          : interactions.map(i => `<tr class="${i.sev === 'SEVERE' ? 'row-bad' : (i.sev === 'WARN' ? 'row-warn' : '')}"><td><span class="badge ${i.sev === 'SEVERE' ? 'badge-bad' : (i.sev === 'WARN' ? 'badge-warn' : 'badge-info')}">${i.sev}</span></td><td>${esc(i.text)}</td></tr>`).join('')
        }
        </tbody>
      </table>
      <div class="spacer"></div>
      <label><input type="checkbox" id="dur-ack"> I have reviewed all alerts and accept clinical responsibility.</label>
    `, [
      { label: 'Cancel' },
      { label: '▶ Save Rx', primary: true, onClick: () => {
        if (!$('#dur-ack').checked) { toast('You must acknowledge the DUR review.', 'bad'); return false; }
        // create Rx
        const id = nextRxId();
        const rx = { id, patientId: data.patientId, medId: data.medId, prescriberId: data.prescriberId, writtenDate: data.writtenDate, sig: data.sig, qty: parseInt(data.qty, 10), daysSupply: parseInt(data.daysSupply, 10), refillsAuth: parseInt(data.refillsAuth, 10), refillsRemaining: parseInt(data.refillsAuth, 10), lastFilled: data.writtenDate, status: 'ACTIVE' };
        state.prescriptions.push(rx);
        // queue first fill
        const q = { id: nextQId(), rxId: id, patientId: rx.patientId, medId: rx.medId, requestedAt: new Date().toISOString(), source: 'New Rx', status: 'PENDING', notes: '' };
        state.refillQueue.unshift(q);
        saveState();
        log('RX_NEW', `${id} - ${m.name} for ${patientName(p)}`);
        toast(`Rx ${id} created and queued for fill.`, 'ok');
        router.go('rx-queue');
      }},
    ]);
  },

  // === ELIGIBILITY VERIFY ===
  verifyEligibility(patientId, resultEl) {
    const p = getPatient(patientId);
    resultEl.innerHTML = `<div class="spacer"></div><div class="notice">Submitting NCPDP D.0 eligibility inquiry to ${esc(p.insurancePlan)}...</div><div class="progress-track"><div class="progress-bar" id="ev-bar" style="width:0%;"></div></div>`;
    let v = 0;
    const i = setInterval(() => {
      v += 10;
      $('#ev-bar').style.width = v + '%';
      if (v >= 100) {
        clearInterval(i);
        resultEl.innerHTML = `
          <div class="spacer"></div>
          <div class="notice ok"><b>✓ ELIGIBLE</b> as of ${fmtDate(new Date())}</div>
          <div class="form-grid">
            <label>Member ID:</label><input readonly value="${esc(p.insuranceId)}">
            <label>Plan Type:</label><input readonly value="${esc(p.insurancePlan)}">
            <label>BIN / PCN / Group:</label><input readonly value="${esc(p.insuranceBin)} / ${esc(p.insurancePcn)} / ${esc(p.insuranceGroup)}">
            <label>Copay Tier:</label><input readonly value="${esc(p.copay)}">
            <label>Deductible Met:</label><input readonly value="$450.00 of $1,000.00">
            <label>Coverage Period:</label><input readonly value="01/01/2026 - 12/31/2026">
          </div>
        `;
        log('ELIG_VERIFY', `Patient ${p.id} - ELIGIBLE`);
      }
    }, 80);
  },

  // === PRIOR AUTH STATUS CHECK ===
  checkPA(paId) {
    const pa = state.priorAuths.find(x => x.id === paId);
    if (!pa) return;
    showModal('Prior Auth Status — ' + paId, `
      <div class="notice">Calling ${esc(getPatient(pa.patientId).insurancePlan)} for status update...</div>
      <div class="progress-track"><div class="progress-bar" id="pa-bar" style="width:0%"></div></div>
    `, [{ label: 'Wait...' }]);
    let v = 0;
    const i = setInterval(() => {
      v += 10;
      const bar = $('#pa-bar');
      if (bar) bar.style.width = v + '%';
      if (v >= 100) {
        clearInterval(i);
        // 50/50 approve vs still pending
        const outcome = Math.random() < 0.6 ? 'APPROVED' : 'PENDING_INSURANCE';
        pa.status = outcome;
        saveState();
        log('PA_STATUS', `${paId} -> ${outcome}`);
        closeModal();
        if (outcome === 'APPROVED') {
          alertDialog('PA Approved', `Prior authorization <b>${paId}</b> has been APPROVED. The claim can now be resubmitted.`);
        } else {
          alertDialog('Still Pending', `Prior authorization <b>${paId}</b> is still under review by the insurance plan. Try again in 24-48 hours.`);
        }
        router.refresh();
      }
    }, 80);
  },

  // === INITIATE PA FROM CLAIM ===
  initiatePAFromClaim(claimId) {
    const c = state.claims.find(x => x.id === claimId);
    if (!c) return;
    const rx = state.prescriptions.find(r => r.medId === c.medId && r.patientId === c.patientId);
    const pa = { id: nextPAId(), patientId: c.patientId, medId: c.medId, prescriberId: rx ? rx.prescriberId : 'D001', status: 'PENDING_PROVIDER', requestedAt: new Date().toISOString(), diagnosis: 'PENDING - to be supplied by prescriber', notes: 'Initiated from rejected claim ' + claimId };
    state.priorAuths.unshift(pa);
    saveState();
    log('PA_INITIATED', `${pa.id} from claim ${claimId}`);
    toast(`PA ${pa.id} initiated. Fax sent to prescriber.`, 'info');
    router.refresh();
  },

  // === CREATE PO (from low stock screen) ===
  createPO(items) {
    if (items.length === 0) return;
    showModal('Confirm Purchase Order', `
      <div class="form-grid">
        <label>Supplier:</label>
        <select id="po2-sup">
          ${state.suppliers.map(s => `<option value="${s.id}" ${s.primary ? 'selected' : ''}>${esc(s.name)} (${esc(s.terms)})</option>`).join('')}
        </select>
        <label>Priority:</label>
        <select id="po2-pri">
          <option>Routine</option>
          <option>Next-Day</option>
          <option>Same-Day</option>
        </select>
        <label>Notes:</label>
        <input type="text" id="po2-notes" value="Reorder from Low Stock Report">
      </div>
      <div class="spacer"></div>
      <table class="data-table">
        <thead><tr><th>Drug</th><th>Qty</th><th>Unit Cost</th><th>Subtotal</th></tr></thead>
        <tbody>
        ${items.map(it => { const m = getMed(it.medId); return `<tr><td>${esc(m.name)}</td><td class="right">${it.qty}</td><td class="right mono">${fmtMoney(m.awp)}</td><td class="right mono">${fmtMoney(m.awp * it.qty)}</td></tr>`; }).join('')}
        </tbody>
        <tfoot><tr><th colspan="3" class="right">TOTAL:</th><th class="right mono">${fmtMoney(items.reduce((t,it)=>t+it.qty*getMed(it.medId).awp,0))}</th></tr></tfoot>
      </table>
    `, [
      { label: 'Cancel' },
      { label: '▶ Submit PO', primary: true, onClick: () => {
        const supplierId = $('#po2-sup').value;
        const po = { id: nextPOId(), supplierId, createdAt: new Date().toISOString(), status: 'IN_TRANSIT', items: items.map(it => ({ medId: it.medId, qty: it.qty, unitCost: getMed(it.medId).awp, received: 0 })), notes: $('#po2-notes').value };
        state.purchaseOrders.unshift(po);
        saveState();
        log('PO_CREATED', `${po.id} for ${items.length} items`);
        toast(`PO ${po.id} submitted.`, 'ok');
        router.go('purchasing');
      }},
    ]);
  },

  submitPO(poId) {
    const po = state.purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    po.status = 'IN_TRANSIT';
    saveState();
    log('PO_SUBMITTED', poId);
    toast('PO submitted to supplier.', 'ok');
    router.refresh();
  },

  receivePO(poId) {
    const po = state.purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    const itemsHtml = po.items.map((it, idx) => {
      const m = getMed(it.medId);
      return `<tr>
        <td>${esc(m.name)}</td>
        <td class="right">${it.qty}</td>
        <td><input type="number" id="rcv-${idx}" value="${it.qty}" style="width:80px;"></td>
        <td><input type="text" id="lot-${idx}" value="LOT-${Math.floor(Math.random()*9000+1000)}" style="width:100px;" class="mono"></td>
        <td><input type="date" id="exp-${idx}" value="2027-12-31"></td>
      </tr>`;
    }).join('');
    showModal('Receive Shipment — ' + poId, `
      <div class="notice">Verify lot numbers and quantities received.</div>
      <table class="data-table">
        <thead><tr><th>Drug</th><th>Ordered</th><th>Received</th><th>Lot #</th><th>Expires</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    `, [
      { label: 'Cancel' },
      { label: '✓ Confirm Receipt', primary: true, onClick: () => {
        po.items.forEach((it, idx) => {
          const rcv = parseInt($('#rcv-' + idx).value, 10) || 0;
          it.received = rcv;
          const m = getMed(it.medId);
          m.stock += rcv;
        });
        po.status = 'RECEIVED';
        // any refill queue items waiting on these drugs can now be released
        po.items.forEach(it => {
          state.refillQueue.forEach(q => {
            if (q.medId === it.medId && q.status === 'ON_ORDER') {
              const m = getMed(it.medId);
              const rx = getRx(q.rxId);
              if (m.stock >= rx.qty) {
                q.status = 'PENDING';
                q.notes = 'Released after PO ' + po.id + ' received';
              }
            }
          });
        });
        saveState();
        log('PO_RECEIVED', `${poId} - inventory updated`);
        toast(`Shipment received. ${po.items.length} item(s) added to inventory.`, 'ok');
        router.refresh();
      }},
    ]);
  },

  // === ADJUST INVENTORY ===
  adjustInventory(medId) {
    const m = getMed(medId);
    if (!m) return;
    showModal('Adjust Inventory — ' + m.name, `
      <div class="form-grid">
        <label>Current Stock:</label><input readonly value="${m.stock}">
        <label>Adjustment Type:</label>
        <select id="adj-type">
          <option value="add">Add (Receive / Found)</option>
          <option value="sub">Subtract (Damage / Loss / Expired)</option>
          <option value="set">Set Exact (Cycle Count)</option>
        </select>
        <label>Quantity:</label><input type="number" id="adj-qty" value="0">
        <label>Reason:</label><input type="text" id="adj-reason" placeholder="e.g. damaged in shipping">
      </div>
    `, [
      { label: 'Cancel' },
      { label: 'Apply', primary: true, onClick: () => {
        const t = $('#adj-type').value;
        const q = parseInt($('#adj-qty').value, 10) || 0;
        const oldStock = m.stock;
        if (t === 'add') m.stock += q;
        else if (t === 'sub') m.stock = Math.max(0, m.stock - q);
        else m.stock = q;
        saveState();
        log('INV_ADJUST', `${m.name} ${oldStock} -> ${m.stock} (${$('#adj-reason').value})`);
        toast(`Stock adjusted: ${oldStock} → ${m.stock}.`, 'ok');
        router.refresh();
      }},
    ]);
  },

  // === BOOK VACCINE ===
  bookVaccine(data) {
    if (!data.consent) {
      return alertDialog('Consent Required', 'Patient consent must be on file before booking.');
    }
    const p = getPatient(data.patientId);
    const v = getMed(data.medId);
    const appt = { id: nextApptId(), patientId: data.patientId, type: v.name, medId: data.medId, date: data.date, time: data.time, status: 'SCHEDULED', staff: 'jthompson', notes: data.notes || '' };
    state.appointments.push(appt);
    // also create confirmation notification
    const notif = { id: nextNotifId(), to: p.id, channel: 'SMS', body: `Hi ${p.first}, your ${v.name} appointment is confirmed for ${data.date} at ${data.time}. Bring photo ID and insurance card. Reply C to cancel.`, sentAt: new Date().toISOString() };
    state.notifications.unshift(notif);
    saveState();
    log('APPT_BOOKED', `${appt.id} - ${v.name} for ${p.id} on ${data.date} ${data.time}`);
    toast(`Appointment ${appt.id} booked. Confirmation SMS sent.`, 'ok');
    router.go('appointments');
  },

  // === EXPORTS ===
  exportCSV(kind) {
    let csv = '';
    if (kind === 'sales') {
      csv = 'Claim,Date,Patient,Drug,Billed,Paid,Copay\n' + state.claims.filter(c => c.status === 'PAID').map(c => `${c.id},${c.submittedAt.slice(0,10)},"${patientName(getPatient(c.patientId))}","${getMed(c.medId).name}",${c.billed},${c.paid},${c.copay}`).join('\n');
    } else {
      csv = 'NDC,Drug,Schedule,Stock\n' + state.medications.filter(m => m.controlled).map(m => `${m.ndc},"${m.name}",${m.schedule},${m.stock}`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kind}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    log('EXPORT', `Exported ${kind} CSV`);
    toast('Export complete.', 'ok');
  },

  showNotifLog() {
    showModal('Notification Log', `
      <table class="data-table">
        <thead><tr><th>Sent</th><th>Patient</th><th>Channel</th><th>Message</th></tr></thead>
        <tbody>
        ${state.notifications.map(n => { const p = getPatient(n.to); return `<tr><td class="mono small">${fmtDateTime(n.sentAt)}</td><td>${esc(patientName(p))}</td><td><span class="badge badge-info">${esc(n.channel)}</span></td><td class="small">${esc(n.body)}</td></tr>`; }).join('') || '<tr><td colspan="4" class="center muted">No notifications sent.</td></tr>'}
        </tbody>
      </table>
    `);
  },
};

// ============================================================
// EVENT WIRING
// ============================================================
$$('[data-nav]').forEach(el => {
  el.addEventListener('click', () => router.go(el.dataset.nav));
});

$('#btn-reset').onclick = () => {
  confirmDialog('Reset System', 'This will erase all changes and reload the seed data. Continue?').then(ok => {
    if (ok) resetState();
  });
};
$('#btn-logout').onclick = () => alertDialog('Logout', 'Logout is disabled in this demo build.');
$('#btn-refill-wf').onclick = () => router.go('refill-workflow');
$('#btn-print').onclick = () => alertDialog('Print', 'Print dialog would appear here. Demo build does not include physical printer support.');

// Folder toggles in tree
$$('.tree-folder, .tree-root').forEach(node => {
  node.addEventListener('click', (e) => {
    if (e.target !== node && !e.target.classList.contains('tree-toggle')) return;
    const next = node.nextElementSibling;
    if (next && next.classList.contains('tree-children')) {
      const open = !next.classList.contains('hidden');
      next.classList.toggle('hidden', open);
      const tog = node.querySelector('.tree-toggle');
      if (tog) tog.textContent = open ? '►' : '▼';
    }
  });
});

// Initial load
router.go('dashboard');
refreshStatusBar();
log('LOGIN', 'Session started');
