/* ============================================================
   GreaseMonkey Shop Manager - Application Logic
============================================================ */

// ============ STATE / PERSISTENCE ============
const STORAGE_KEY = 'greasemonkey.state.v1';

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
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  router.go('dashboard');
  toast('System reset. Seed data reloaded.', 'info');
}
let state = loadState();

// ============ HELPERS ============
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(d) { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}); }
function fmtDateTime(d) { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}); }
function fmtMoney(n) { return '$' + (Number(n||0)).toFixed(2); }
function fmtMileage(n) { return Number(n||0).toLocaleString() + ' mi'; }

function getCustomer(id) { return state.customers.find(c => c.id === id); }
function getVehicle(id) { return state.vehicles.find(v => v.id === id); }
function getRO(id) { return state.repairOrders.find(r => r.id === id); }
function getLaborOp(id) { return state.laborBook.find(l => l.id === id); }
function getPart(id) { return state.parts.find(p => p.id === id); }
function getVendor(id) { return state.vendors.find(v => v.id === id); }
function getTech(id) { return state.techs.find(t => t.id === id); }
function getBay(id) { return state.bays.find(b => b.id === id); }
function getInvoice(roId) { return state.invoices.find(i => i.roId === roId); }

function customerName(c) { return c ? `${c.last}, ${c.first}` : ''; }
function vehicleLabel(v) { return v ? `${v.year} ${v.make} ${v.model}` : ''; }
function vehicleLabelFull(v) { return v ? `${v.year} ${v.make} ${v.model} (${v.color}) - ${v.plate}` : ''; }

function nextROId() { return 'RO-' + state.counters.roNext++; }
function nextPOId() { return 'PO-' + state.counters.poNext++; }
function nextInvId() { return 'INV-' + state.counters.invNext++; }
function nextCustomerId() { return 'C' + String(state.counters.customerNext++).padStart(3, '0'); }
function nextVehicleId() { return 'V' + String(state.counters.vehicleNext++).padStart(3, '0'); }
function nextLineId(prefix) { return prefix + (state.counters[prefix === 'L' ? 'laborLineNext' : 'partLineNext']++); }

function log(action, detail) {
  state.activityLog.unshift({ ts: new Date().toISOString(), user: 'PETE.S', action, detail });
  if (state.activityLog.length > 200) state.activityLog.length = 200;
  saveState();
}

// Calc totals for an RO
function roTotals(ro) {
  const labor = (ro.laborLines || []).reduce((s, l) => s + l.hours * l.rate, 0);
  const parts = (ro.partLines || []).reduce((s, p) => s + p.qty * p.list, 0);
  const partsCost = (ro.partLines || []).reduce((s, p) => s + p.qty * p.cost, 0);
  const subtotal = labor + parts;
  const shopFee = subtotal * state.meta.shopFeePct;
  const tax = (subtotal + shopFee) * state.meta.taxRate;
  const total = subtotal + shopFee + tax;
  return { labor, parts, partsCost, subtotal, shopFee, tax, total };
}

// ============ TOAST ============
function toast(msg, kind='') {
  const t = document.createElement('div');
  t.className = 'toast ' + (kind ? 'toast-' + kind : '');
  t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2400);
  setTimeout(() => t.remove(), 3000);
}

// ============ MODAL ============
function showModal(title, bodyHtml, buttons=[]) {
  return new Promise(resolve => {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHtml;
    const f = $('#modal-footer');
    f.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      if (b.primary) btn.className = 'btn-primary';
      if (b.danger) btn.classList.add('btn-danger');
      btn.onclick = () => {
        if (b.onClick) { const r = b.onClick(); if (r === false) return; }
        closeModal();
        resolve(b.value !== undefined ? b.value : b.label);
      };
      f.appendChild(btn);
    });
    if (buttons.length === 0) {
      const ok = document.createElement('button'); ok.textContent='OK'; ok.className='btn-primary';
      ok.onclick = () => { closeModal(); resolve('OK'); };
      f.appendChild(ok);
    }
    $('#modal-backdrop').classList.remove('hidden');
  });
}
function closeModal() { $('#modal-backdrop').classList.add('hidden'); }
$('#modal-close').onclick = closeModal;
function alertDialog(t, m) { return showModal(t, `<div style="padding:6px 4px;">${m}</div>`); }
function confirmDialog(t, m) {
  return showModal(t, `<div style="padding:6px 4px;">${m}</div>`, [
    { label: 'OK', primary: true, value: true },
    { label: 'Cancel', value: false },
  ]);
}

// ============ ROUTER ============
const router = (() => {
  const tabs = [];
  let idx = -1;
  function go(routeId, params={}) {
    const def = routes[routeId];
    if (!def) { console.warn('Unknown route', routeId); return; }
    const key = def.key ? def.key(params) : routeId;
    const ex = tabs.findIndex(t => t.key === key);
    if (ex >= 0) { idx = ex; tabs[idx].params = params; }
    else { tabs.push({ key, routeId, params, title: def.title(params) }); idx = tabs.length - 1; }
    renderTabs(); renderPage(); highlightNav(routeId);
  }
  function close(i) { tabs.splice(i,1); if (idx>=tabs.length) idx=tabs.length-1; if (tabs.length===0) go('dashboard'); else { renderTabs(); renderPage(); } }
  function renderTabs() {
    const strip = $('#tabstrip'); strip.innerHTML='';
    tabs.forEach((t,i)=>{
      const el = document.createElement('div');
      el.className = 'tab' + (i===idx ? ' active' : '');
      el.innerHTML = `<span>${esc(t.title)}</span><span class="tab-close" data-i="${i}">×</span>`;
      el.onclick = ev => { if (ev.target.classList.contains('tab-close')) close(i); else { idx=i; renderTabs(); renderPage(); } };
      strip.appendChild(el);
    });
  }
  function renderPage() {
    const t = tabs[idx]; if (!t) return;
    const page = $('#page'); page.innerHTML='';
    routes[t.routeId].render(page, t.params);
    refreshStatusBar();
  }
  function highlightNav(rid) { $$('.tree-node[data-nav]').forEach(n => n.classList.toggle('active', n.dataset.nav===rid)); }
  return { go, close, refresh: renderPage };
})();

// ============ STATUS BAR ============
function refreshStatusBar() {
  const open = state.repairOrders.filter(r => !['CLOSED','INVOICED'].includes(r.status)).length;
  $('#sb-open-count').textContent = open;
  const busyBays = new Set(state.repairOrders.filter(r => r.status==='IN_PROGRESS' && r.bay).map(r=>r.bay));
  $('#sb-bay-count').textContent = `${busyBays.size}/${state.bays.length}`;
}
setInterval(() => {
  const d = new Date();
  $('#sb-clock').textContent = d.toLocaleString('en-US',{weekday:'short',month:'short',day:'2-digit'}) + ' ' + d.toLocaleTimeString('en-US',{hour12:false});
}, 500);

// ============ HEADER ============
function pageHeader(title, crumbs) {
  return `<div class="page-header"><span>▌ ${esc(title.toUpperCase())}</span><span class="ph-crumbs">${esc(crumbs||'')}</span></div>`;
}

// ============================================================
// ROUTES
// ============================================================
const routes = {};

// ----------------- DASHBOARD / SERVICE DESK -----------------
routes.dashboard = {
  title: () => 'Service Desk',
  key: () => 'dashboard',
  render(root) {
    const orders = state.repairOrders;
    const byStatus = (s) => orders.filter(o => Array.isArray(s) ? s.includes(o.status) : o.status === s);
    const today = '2026-05-16';

    const todayRevenue = state.invoices.filter(i => i.paid && i.issuedAt.startsWith(today)).reduce((s,i) => s + i.total, 0);
    const wipValue = orders.filter(o => !['CLOSED','INVOICED'].includes(o.status))
      .reduce((s,o) => s + roTotals(o).total, 0);

    root.innerHTML = `
      ${pageHeader('Service Desk - Daily Operations', 'HOME > DASHBOARD')}

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">OPEN REPAIR ORDERS</div>
          <div class="kpi-value">${byStatus(['NEW','INSPECTING','ESTIMATING','AWAITING_APPROVAL','APPROVED','PARTS_PENDING','IN_PROGRESS','QC']).length}</div>
          <div class="kpi-sub">in shop</div>
        </div>
        <div class="kpi-card warn">
          <div class="kpi-label">AWAITING APPROVAL</div>
          <div class="kpi-value">${byStatus('AWAITING_APPROVAL').length}</div>
          <div class="kpi-sub">customer follow-up needed</div>
        </div>
        <div class="kpi-card ok">
          <div class="kpi-label">READY FOR PICKUP</div>
          <div class="kpi-value">${byStatus('READY').length}</div>
          <div class="kpi-sub">today</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TODAY'S REVENUE</div>
          <div class="kpi-value">${fmtMoney(todayRevenue)}</div>
          <div class="kpi-sub">WIP value: ${fmtMoney(wipValue)}</div>
        </div>
      </div>

      <!-- KANBAN -->
      <div class="dash-panel">
        <div class="dash-panel-title">▶ STATUS BOARD - ALL ACTIVE REPAIR ORDERS</div>
        <div class="dash-panel-body">
          <div class="kanban">
            ${['NEW','AWAITING_APPROVAL','PARTS_PENDING','IN_PROGRESS','READY'].map(st => {
              const items = byStatus(st);
              const label = ({
                'NEW':'NEW / INSPECTING',
                'AWAITING_APPROVAL':'AWAITING APPROVAL',
                'PARTS_PENDING':'PARTS PENDING',
                'IN_PROGRESS':'IN PROGRESS',
                'READY':'READY FOR PICKUP',
              })[st];
              const itemsForCol = st === 'NEW' ? byStatus(['NEW','INSPECTING','ESTIMATING']) : items;
              return `<div class="kanban-col">
                <div class="kc-title">${label}<span class="kc-count">${itemsForCol.length}</span></div>
                ${itemsForCol.map(o => {
                  const c = getCustomer(o.customerId); const v = getVehicle(o.vehicleId);
                  return `<div class="kanban-card" onclick="router.go('ro', {id:'${o.id}'})">
                    <div class="kc-ro">${esc(o.id)}</div>
                    <div>${esc(customerName(c))}</div>
                    <div class="kc-veh">${esc(vehicleLabel(v))}</div>
                  </div>`;
                }).join('') || '<div class="muted small" style="padding:6px;text-align:center;">— empty —</div>'}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="dash-cols">
        <!-- TODAY CHECKED IN -->
        <div class="dash-panel">
          <div class="dash-panel-title">▶ TODAY'S CHECK-INS</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>Time</th><th>RO #</th><th>Customer</th><th>Vehicle</th><th>Complaint</th><th>Status</th></tr></thead>
              <tbody>
              ${orders.filter(o => o.checkedInAt && o.checkedInAt.startsWith(today)).map(o => {
                const c = getCustomer(o.customerId); const v = getVehicle(o.vehicleId);
                return `<tr onclick="router.go('ro',{id:'${o.id}'})">
                  <td class="mono">${o.checkedInAt.slice(11,16)}</td>
                  <td class="mono">${esc(o.id)}</td>
                  <td>${esc(customerName(c))}</td>
                  <td>${esc(vehicleLabel(v))}</td>
                  <td class="small">${esc((o.complaint||'').slice(0,40))}${o.complaint && o.complaint.length>40?'…':''}</td>
                  <td><span class="badge ro-status-${o.status}">${esc(o.status)}</span></td>
                </tr>`;
              }).join('') || '<tr><td colspan="6" class="center muted">No vehicles checked in today.</td></tr>'}
              </tbody>
            </table>
            <div class="spacer"></div>
            <button class="btn-primary" onclick="router.go('checkin')">▶ Check In Vehicle</button>
          </div>
        </div>
        <!-- TECH STATUS -->
        <div class="dash-panel">
          <div class="dash-panel-title">▶ TECHNICIAN STATUS</div>
          <div class="dash-panel-body">
            <table class="data-table">
              <thead><tr><th>Tech</th><th>Cert</th><th>Status</th><th>Current RO</th><th>Bay</th></tr></thead>
              <tbody>
              ${state.techs.map(t => {
                const onJob = state.repairOrders.find(r => r.tech === t.id && r.status === 'IN_PROGRESS');
                return `<tr>
                  <td>${esc(t.name)}</td>
                  <td class="small">${esc(t.cert)}</td>
                  <td><span class="badge ${onJob ? 'badge-info' : 'badge-ok'}">${onJob ? 'ON JOB' : esc(t.status.toUpperCase())}</span></td>
                  <td class="mono">${onJob ? esc(onJob.id) : '—'}</td>
                  <td class="mono">${onJob && onJob.bay ? esc(onJob.bay) : '—'}</td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};

// ----------------- CUSTOMERS -----------------
routes.customers = {
  title: () => 'Customer Lookup',
  key: () => 'customers',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Customer Lookup', 'HOME > CUSTOMER > SEARCH')}
      <div class="toolbar-strip">
        <button onclick="router.go('customer-new')">+ New Customer</button>
        <span class="muted">|</span>
        <span>Search:</span>
        <select id="csm">
          <option value="last">Last Name</option>
          <option value="phone">Phone</option>
          <option value="plate">Plate</option>
        </select>
        <input id="csi" type="text" placeholder="Enter search term..." style="width:240px;">
        <button class="btn-primary" id="csb">🔍 Find</button>
        <button id="csc">Clear</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Customer File (${state.customers.length} records)</span>
        <div class="table-wrap" style="max-height:520px;">
        <table class="data-table" id="cust-tbl">
          <thead><tr><th>ID</th><th>Last Name</th><th>First Name</th><th>Phone</th><th>Vehicles</th><th>Last Service</th><th>Notes</th></tr></thead>
          <tbody></tbody>
        </table>
        </div>
        <div class="muted small" style="padding:4px;">Double-click a row to open customer file.</div>
      </div>
    `;

    function render(list) {
      const body = $('#cust-tbl tbody');
      body.innerHTML = list.map(c => {
        const veh = state.vehicles.filter(v => v.customerId === c.id);
        const lastH = state.serviceHistory.filter(h => veh.some(v => v.id === h.vehicleId)).sort((a,b)=>b.date.localeCompare(a.date))[0];
        return `<tr data-id="${c.id}">
          <td class="mono">${esc(c.id)}</td>
          <td>${esc(c.last)}</td>
          <td>${esc(c.first)}</td>
          <td class="mono">${esc(c.phone)}</td>
          <td>${veh.length} (${veh.map(v=>v.year+' '+v.make).join(', ')})</td>
          <td class="mono">${lastH ? fmtDate(lastH.date) : '—'}</td>
          <td class="small">${esc(c.pref || '')}</td>
        </tr>`;
      }).join('');
      $$('tr', body).forEach(tr => tr.ondblclick = () => router.go('customer', { id: tr.dataset.id }));
    }
    render(state.customers);

    $('#csb').onclick = () => {
      const m = $('#csm').value, t = $('#csi').value.trim().toLowerCase();
      if (!t) return render(state.customers);
      let f = state.customers;
      if (m === 'last') f = state.customers.filter(c => c.last.toLowerCase().startsWith(t));
      else if (m === 'phone') f = state.customers.filter(c => c.phone.includes(t));
      else if (m === 'plate') {
        const vIds = state.vehicles.filter(v => v.plate.toLowerCase().includes(t)).map(v=>v.customerId);
        f = state.customers.filter(c => vIds.includes(c.id));
      }
      render(f);
      log('CUST_SEARCH', `mode=${m} term="${t}" results=${f.length}`);
    };
    $('#csi').addEventListener('keydown', e => { if (e.key==='Enter') $('#csb').click(); });
    $('#csc').onclick = () => { $('#csi').value=''; render(state.customers); };
  }
};

routes['customer-new'] = {
  title: () => 'New Customer',
  key: () => 'cust-new',
  render(root) {
    root.innerHTML = `
      ${pageHeader('New Customer', 'HOME > CUSTOMER > NEW')}
      <form id="cf">
        <div class="groupbox"><span class="gb-title">Contact Info</span>
          <div class="form-grid">
            <label>Last Name:*</label><input name="last" required>
            <label>First Name:*</label><input name="first" required>
            <label>Phone:*</label><input name="phone" required placeholder="(217) 555-0000">
            <label>Email:</label><input name="email" type="email">
            <label>Address:</label><input name="addr" class="span-3">
            <label>Preferences:</label><input name="pref" class="span-3" placeholder="e.g. Text approval, OEM parts only">
          </div>
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button type="button" onclick="router.go('customers')">Cancel</button>
          <button type="submit" class="btn-primary">[F2] Save</button>
        </div>
      </form>
    `;
    $('#cf').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = nextCustomerId();
      const c = { id }; for (const [k,v] of fd.entries()) c[k]=v;
      state.customers.push(c);
      saveState();
      log('CUST_NEW', `${id} ${c.last}, ${c.first}`);
      toast(`Customer ${id} saved.`, 'ok');
      router.go('customer', { id });
    };
  }
};

routes.customer = {
  title: p => { const c = getCustomer(p.id); return c ? `${c.last}, ${c.first}` : 'Customer'; },
  key: p => 'cust-' + p.id,
  render(root, params) {
    const c = getCustomer(params.id);
    if (!c) { root.innerHTML = '<div class="notice err">Customer not found.</div>'; return; }
    const veh = state.vehicles.filter(v => v.customerId === c.id);
    const ros = state.repairOrders.filter(o => o.customerId === c.id);
    const hist = state.serviceHistory.filter(h => veh.some(v => v.id === h.vehicleId)).sort((a,b)=>b.date.localeCompare(a.date));

    root.innerHTML = `
      ${pageHeader('Customer: ' + customerName(c), 'HOME > CUSTOMER > ' + c.id)}
      <div class="toolbar-strip">
        <button class="btn-primary" onclick="window._wf.startCheckIn('${c.id}')">▶ Check In Vehicle</button>
        <button onclick="window._wf.addVehicle('${c.id}')">+ Add Vehicle</button>
        <span class="sb-flex"></span>
        <button onclick="router.go('customers')">← Back to Search</button>
      </div>

      <div class="groupbox">
        <span class="gb-title">Contact Info</span>
        <div class="form-grid">
          <label>Customer ID:</label><input readonly value="${esc(c.id)}">
          <label>Phone:</label><input readonly value="${esc(c.phone)}">
          <label>Email:</label><input readonly value="${esc(c.email||'')}">
          <label>Address:</label><input readonly value="${esc(c.addr||'')}">
          <label>Preferences:</label><input readonly value="${esc(c.pref||'')}" class="span-3" style="background:#ffffd0;font-weight:bold;">
        </div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Vehicles On File (${veh.length})</span>
        <table class="data-table">
          <thead><tr><th>Year</th><th>Make</th><th>Model</th><th>VIN</th><th>Plate</th><th>Color</th><th>Mileage</th><th>Engine</th><th>Action</th></tr></thead>
          <tbody>
          ${veh.map(v => `<tr>
            <td>${v.year}</td><td>${esc(v.make)}</td><td>${esc(v.model)}</td>
            <td class="mono small">${esc(v.vin)}</td>
            <td class="mono">${esc(v.plate)}</td>
            <td>${esc(v.color)}</td>
            <td class="right mono">${fmtMileage(v.mileage)}</td>
            <td>${esc(v.engine)}</td>
            <td><button onclick="window._wf.startCheckInVehicle('${v.id}')">Check In</button></td>
          </tr>`).join('') || '<tr><td colspan="9" class="center muted">No vehicles on file.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Active Repair Orders (${ros.filter(o=>!['CLOSED'].includes(o.status)).length})</span>
        <table class="data-table">
          <thead><tr><th>RO #</th><th>Date</th><th>Vehicle</th><th>Complaint</th><th>Status</th><th>Total</th><th></th></tr></thead>
          <tbody>
          ${ros.map(o => { const v = getVehicle(o.vehicleId); const t = roTotals(o); return `<tr>
            <td class="mono">${esc(o.id)}</td>
            <td class="mono">${fmtDate(o.checkedInAt)}</td>
            <td>${esc(vehicleLabel(v))}</td>
            <td class="small">${esc((o.complaint||'').slice(0,40))}</td>
            <td><span class="badge ro-status-${o.status}">${esc(o.status)}</span></td>
            <td class="right mono">${fmtMoney(t.total)}</td>
            <td><button onclick="router.go('ro',{id:'${o.id}'})">Open</button></td>
          </tr>`; }).join('') || '<tr><td colspan="7" class="center muted">No repair orders.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Service History (${hist.length})</span>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Mileage</th><th>Vehicle</th><th>RO #</th><th>Summary</th><th>Total</th></tr></thead>
          <tbody>
          ${hist.map(h => { const v = getVehicle(h.vehicleId); return `<tr>
            <td class="mono">${fmtDate(h.date)}</td>
            <td class="right mono">${fmtMileage(h.mileage)}</td>
            <td>${esc(vehicleLabel(v))}</td>
            <td class="mono">${esc(h.ro)}</td>
            <td class="small">${esc(h.summary)}</td>
            <td class="right mono">${fmtMoney(h.total)}</td>
          </tr>`; }).join('') || '<tr><td colspan="6" class="center muted">No history.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- VEHICLES (all) -----------------
routes.vehicles = {
  title: () => 'Vehicles',
  key: () => 'vehicles',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Vehicle Records', 'HOME > CUSTOMER > VEHICLES')}
      <div class="groupbox">
        <span class="gb-title">All Vehicles (${state.vehicles.length})</span>
        <div class="table-wrap" style="max-height:560px;">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Owner</th><th>Year</th><th>Make</th><th>Model</th><th>VIN</th><th>Plate</th><th>Mileage</th><th>Engine</th><th>Notes</th></tr></thead>
          <tbody>
          ${state.vehicles.map(v => { const c = getCustomer(v.customerId); return `<tr ondblclick="router.go('customer',{id:'${v.customerId}'})">
            <td class="mono">${esc(v.id)}</td>
            <td>${esc(customerName(c))}</td>
            <td>${v.year}</td>
            <td>${esc(v.make)}</td>
            <td>${esc(v.model)}</td>
            <td class="mono small">${esc(v.vin)}</td>
            <td class="mono">${esc(v.plate)}</td>
            <td class="right mono">${fmtMileage(v.mileage)}</td>
            <td>${esc(v.engine)}</td>
            <td class="small">${esc(v.notes||'')}</td>
          </tr>`; }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }
};

// ----------------- CHECK-IN WIZARD ENTRY -----------------
routes.checkin = {
  title: () => 'Check-In',
  key: () => 'checkin',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Vehicle Check-In', 'HOME > REPAIR ORDER > CHECK-IN')}
      <div class="notice">Select an existing customer or create a new one to begin a repair order.</div>
      <div class="toolbar-strip">
        <button class="btn-primary" onclick="router.go('customers')">👤 Find Existing Customer</button>
        <button onclick="router.go('customer-new')">+ New Customer</button>
      </div>
      <div class="groupbox">
        <span class="gb-title">Recent Customers</span>
        <table class="data-table">
          <thead><tr><th>Last Name</th><th>First Name</th><th>Phone</th><th>Vehicles</th><th></th></tr></thead>
          <tbody>
          ${state.customers.slice(0,10).map(c => {
            const veh = state.vehicles.filter(v => v.customerId === c.id);
            return `<tr><td>${esc(c.last)}</td><td>${esc(c.first)}</td><td class="mono">${esc(c.phone)}</td><td>${veh.length}</td><td><button onclick="window._wf.startCheckIn('${c.id}')">▶ Check In</button></td></tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- ESTIMATES QUEUE -----------------
routes.estimates = {
  title: () => 'Estimates',
  key: () => 'estimates',
  render(root) {
    const list = state.repairOrders.filter(o => ['NEW','INSPECTING','ESTIMATING','AWAITING_APPROVAL','DECLINED'].includes(o.status));
    root.innerHTML = `
      ${pageHeader('Estimates Queue', 'HOME > REPAIR ORDER > ESTIMATES')}
      <div class="groupbox">
        <span class="gb-title">Estimates In Progress (${list.length})</span>
        <table class="data-table">
          <thead><tr><th>RO #</th><th>Checked In</th><th>Customer</th><th>Vehicle</th><th>Complaint</th><th>Total</th><th>Sent To Customer</th><th>Status</th><th></th></tr></thead>
          <tbody>
          ${list.map(o => { const c = getCustomer(o.customerId); const v = getVehicle(o.vehicleId); const t = roTotals(o); return `<tr>
            <td class="mono">${esc(o.id)}</td>
            <td class="mono small">${fmtDateTime(o.checkedInAt)}</td>
            <td>${esc(customerName(c))}</td>
            <td>${esc(vehicleLabel(v))}</td>
            <td class="small">${esc((o.complaint||'').slice(0,40))}</td>
            <td class="right mono">${fmtMoney(t.total)}</td>
            <td class="mono small">${o.sentToCustomerAt ? fmtDateTime(o.sentToCustomerAt) : '—'}</td>
            <td><span class="badge ro-status-${o.status}">${esc(o.status)}</span></td>
            <td><button onclick="router.go('ro',{id:'${o.id}'})">Open</button></td>
          </tr>`; }).join('') || '<tr><td colspan="9" class="center muted">No active estimates.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- WORK ORDERS -----------------
routes.workorders = {
  title: () => 'Work Orders',
  key: () => 'workorders',
  render(root) {
    const list = state.repairOrders.filter(o => ['APPROVED','PARTS_PENDING','IN_PROGRESS','QC'].includes(o.status));
    root.innerHTML = `
      ${pageHeader('Active Work Orders', 'HOME > REPAIR ORDER > WORK ORDERS')}
      <div class="groupbox">
        <span class="gb-title">In-Shop Work (${list.length})</span>
        <table class="data-table">
          <thead><tr><th>RO #</th><th>Customer</th><th>Vehicle</th><th>Tech</th><th>Bay</th><th>Hours</th><th>Parts Status</th><th>Status</th><th></th></tr></thead>
          <tbody>
          ${list.map(o => { const c = getCustomer(o.customerId); const v = getVehicle(o.vehicleId);
            const hours = (o.laborLines||[]).reduce((s,l)=>s+l.hours,0);
            const partsReady = (o.partLines||[]).every(p => !p.onOrder);
            return `<tr>
              <td class="mono">${esc(o.id)}</td>
              <td>${esc(customerName(c))}</td>
              <td>${esc(vehicleLabel(v))}</td>
              <td>${o.tech ? esc(getTech(o.tech).name.split(' ')[0]) : '<i>unassigned</i>'}</td>
              <td class="mono">${o.bay || '—'}</td>
              <td class="right mono">${hours.toFixed(1)}h</td>
              <td>${partsReady ? '<span class="badge badge-ok">READY</span>' : '<span class="badge badge-warn">ON ORDER</span>'}</td>
              <td><span class="badge ro-status-${o.status}">${esc(o.status)}</span></td>
              <td><button onclick="router.go('ro',{id:'${o.id}'})">Open</button></td>
            </tr>`; }).join('') || '<tr><td colspan="9" class="center muted">No active work orders.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['qc-queue'] = {
  title: () => 'QC / Ready',
  key: () => 'qc-queue',
  render(root) {
    const list = state.repairOrders.filter(o => ['QC','READY'].includes(o.status));
    root.innerHTML = `
      ${pageHeader('Quality Control / Ready For Pickup', 'HOME > REPAIR ORDER > QC')}
      <div class="groupbox">
        <span class="gb-title">QC / Pickup Queue (${list.length})</span>
        <table class="data-table">
          <thead><tr><th>RO #</th><th>Customer</th><th>Vehicle</th><th>Completed</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
          ${list.map(o => { const c = getCustomer(o.customerId); const v = getVehicle(o.vehicleId); const t = roTotals(o); return `<tr>
            <td class="mono">${esc(o.id)}</td>
            <td>${esc(customerName(c))}</td>
            <td>${esc(vehicleLabel(v))}</td>
            <td class="mono small">${o.completedAt ? fmtDateTime(o.completedAt) : '—'}</td>
            <td class="right mono">${fmtMoney(t.total)}</td>
            <td><span class="badge ro-status-${o.status}">${esc(o.status)}</span></td>
            <td>
              ${o.status === 'READY' ? `<button class="btn-primary" onclick="window._wf.invoice('${o.id}')">▶ Invoice & Take Payment</button>` : `<button onclick="router.go('ro',{id:'${o.id}'})">Open</button>`}
            </td>
          </tr>`; }).join('') || '<tr><td colspan="7" class="center muted">No vehicles ready.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- INVOICES -----------------
routes.invoices = {
  title: () => 'Invoices',
  key: () => 'invoices',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Invoices', 'HOME > REPAIR ORDER > INVOICES')}
      <div class="groupbox">
        <span class="gb-title">Invoice Register (${state.invoices.length})</span>
        <table class="data-table">
          <thead><tr><th>Invoice #</th><th>RO #</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Payment</th><th></th></tr></thead>
          <tbody>
          ${state.invoices.map(i => { const ro = getRO(i.roId); const c = getCustomer(ro.customerId); const v = getVehicle(ro.vehicleId); return `<tr>
            <td class="mono">${esc(i.id)}</td>
            <td class="mono">${esc(i.roId)}</td>
            <td class="mono">${fmtDate(i.issuedAt)}</td>
            <td>${esc(customerName(c))}</td>
            <td>${esc(vehicleLabel(v))}</td>
            <td class="right mono">${fmtMoney(i.subtotal)}</td>
            <td class="right mono">${fmtMoney(i.tax)}</td>
            <td class="right mono bold">${fmtMoney(i.total)}</td>
            <td>${esc(i.paymentMethod)}</td>
            <td><button onclick="window._wf.printInvoice('${i.id}')">🖶 View</button></td>
          </tr>`; }).join('') || '<tr><td colspan="10" class="center muted">No invoices.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- RO DETAIL (the big one) -----------------
routes.ro = {
  title: p => p.id,
  key: p => 'ro-' + p.id,
  render(root, params) {
    const ro = getRO(params.id);
    if (!ro) { root.innerHTML = '<div class="notice err">Repair Order not found.</div>'; return; }
    const c = getCustomer(ro.customerId);
    const v = getVehicle(ro.vehicleId);
    const t = roTotals(ro);

    const statusSteps = ['NEW','INSPECTING','ESTIMATING','AWAITING_APPROVAL','APPROVED','PARTS_PENDING','IN_PROGRESS','QC','READY','INVOICED'];
    const currentStepIdx = statusSteps.indexOf(ro.status);

    root.innerHTML = `
      ${pageHeader('Repair Order ' + ro.id, `HOME > RO > ${ro.id}`)}

      <div class="steps">
        ${statusSteps.slice(0,5).map((s,i) => `<div class="step ${i===currentStepIdx?'active':(i<currentStepIdx?'done':'')}">${s.replace(/_/g,' ')}</div>`).join('')}
      </div>
      <div class="steps">
        ${statusSteps.slice(5,10).map((s,i) => { const ii = i+5; return `<div class="step ${ii===currentStepIdx?'active':(ii<currentStepIdx?'done':'')}">${s.replace(/_/g,' ')}</div>`; }).join('')}
      </div>

      <!-- Action bar varies by status -->
      <div class="toolbar-strip">
        <span class="bold">Current Status:</span>
        <span class="badge ro-status-${ro.status}" style="font-size:11px;padding:2px 8px;">${esc(ro.status)}</span>
        <span class="sb-flex"></span>
        ${ro.status === 'NEW' || ro.status === 'INSPECTING' ? `<button class="btn-primary" onclick="window._wf.startEstimate('${ro.id}')">▶ Build Estimate</button>` : ''}
        ${ro.status === 'ESTIMATING' || ro.status === 'INSPECTING' ? `<button class="btn-primary" onclick="window._wf.sendEstimate('${ro.id}')">📨 Send to Customer</button>` : ''}
        ${ro.status === 'AWAITING_APPROVAL' ? `<button class="btn-primary" onclick="window._wf.recordApproval('${ro.id}')">✓ Record Customer Approval</button>` : ''}
        ${ro.status === 'APPROVED' ? `<button class="btn-primary" onclick="window._wf.orderParts('${ro.id}')">⛟ Order Parts</button>` : ''}
        ${ro.status === 'PARTS_PENDING' ? `<button onclick="window._wf.markPartsReceived('${ro.id}')">📦 Mark Parts Received</button>` : ''}
        ${ro.status === 'APPROVED' || ro.status === 'PARTS_PENDING' || (ro.status === 'IN_PROGRESS' && !ro.bay) ? `<button onclick="window._wf.assignBayTech('${ro.id}')">▥ Assign Bay/Tech</button>` : ''}
        ${ro.status === 'IN_PROGRESS' ? `<button class="btn-primary" onclick="window._wf.completeWork('${ro.id}')">✓ Complete Work</button>` : ''}
        ${ro.status === 'QC' ? `<button class="btn-primary" onclick="window._wf.passQC('${ro.id}')">✓ Pass QC → Ready</button>` : ''}
        ${ro.status === 'READY' ? `<button class="btn-primary" onclick="window._wf.invoice('${ro.id}')">▦ Invoice & Take Payment</button>` : ''}
        ${ro.status === 'INVOICED' ? `<button onclick="window._wf.printInvoice('INV-${ro.id.replace('RO-','')}')">🖶 Print Invoice</button>` : ''}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <div class="groupbox">
          <span class="gb-title">Customer</span>
          <div class="form-grid">
            <label>Name:</label><input readonly value="${esc(customerName(c))}">
            <label>Phone:</label><input readonly value="${esc(c.phone)}">
            <label>Email:</label><input readonly value="${esc(c.email||'')}">
            <label>Pref:</label><input readonly value="${esc(c.pref||'')}" style="background:#ffffd0;">
          </div>
        </div>
        <div class="groupbox">
          <span class="gb-title">Vehicle</span>
          <div class="form-grid">
            <label>Year/Make/Model:</label><input readonly value="${esc(vehicleLabelFull(v))}">
            <label>VIN:</label><input readonly value="${esc(v.vin)}" class="mono">
            <label>Engine:</label><input readonly value="${esc(v.engine)}">
            <label>Mileage In:</label><input readonly value="${fmtMileage(ro.mileageIn)}">
          </div>
        </div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Customer Complaint</span>
        <div style="background:#fff;padding:6px;border:1px inset #808080;min-height:32px;">${esc(ro.complaint||'(no complaint recorded)')}</div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Labor Lines (${(ro.laborLines||[]).length})</span>
        <table class="data-table">
          <thead><tr><th>Op Code</th><th>Description</th><th>Book Hrs</th><th>Rate</th><th>Extension</th><th>Status</th></tr></thead>
          <tbody>
          ${(ro.laborLines||[]).map(l => `<tr>
            <td class="mono">${esc(l.opId)}</td>
            <td>${esc(l.desc)}</td>
            <td class="right mono">${l.hours.toFixed(1)}</td>
            <td class="right mono">${fmtMoney(l.rate)}</td>
            <td class="right mono">${fmtMoney(l.hours * l.rate)}</td>
            <td>${l.approved ? '<span class="badge badge-ok">APPROVED</span>' : '<span class="badge badge-warn">PENDING</span>'}</td>
          </tr>`).join('') || '<tr><td colspan="6" class="center muted">No labor lines.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Parts Lines (${(ro.partLines||[]).length})</span>
        <table class="data-table">
          <thead><tr><th>Part #</th><th>Description</th><th>Qty</th><th>Cost</th><th>List</th><th>Extension</th><th>Status</th></tr></thead>
          <tbody>
          ${(ro.partLines||[]).map(p => { const part = getPart(p.partId); return `<tr>
            <td class="mono small">${esc(part ? part.pn : '?')}</td>
            <td>${esc(p.desc)}</td>
            <td class="right mono">${p.qty}</td>
            <td class="right mono">${fmtMoney(p.cost)}</td>
            <td class="right mono">${fmtMoney(p.list)}</td>
            <td class="right mono">${fmtMoney(p.qty * p.list)}</td>
            <td>${p.onOrder ? '<span class="badge badge-warn">ON ORDER: '+esc(p.onOrder)+'</span>' : (p.approved ? '<span class="badge badge-ok">APPROVED</span>' : '<span class="badge badge-warn">PENDING</span>')}</td>
          </tr>`; }).join('') || '<tr><td colspan="7" class="center muted">No parts lines.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Totals</span>
        <div class="totals-grid">
          <div class="tg-label">Labor:</div><div class="tg-val">${fmtMoney(t.labor)}</div>
          <div class="tg-label">Parts (list):</div><div class="tg-val">${fmtMoney(t.parts)}</div>
          <div class="tg-label">Subtotal:</div><div class="tg-val">${fmtMoney(t.subtotal)}</div>
          <div class="tg-label">Shop Fee (${(state.meta.shopFeePct*100).toFixed(1)}%):</div><div class="tg-val">${fmtMoney(t.shopFee)}</div>
          <div class="tg-label">Sales Tax (${(state.meta.taxRate*100).toFixed(2)}%):</div><div class="tg-val">${fmtMoney(t.tax)}</div>
          <div class="tg-label tg-grand">GRAND TOTAL:</div><div class="tg-val tg-grand">${fmtMoney(t.total)}</div>
        </div>
      </div>

      ${ro.estimateNotes ? `<div class="notice">📝 ${esc(ro.estimateNotes)}</div>` : ''}
      ${ro.sentToCustomerAt ? `<div class="notice">📨 Estimate sent to customer ${fmtDateTime(ro.sentToCustomerAt)}.</div>` : ''}
      ${ro.approvedAt ? `<div class="notice ok">✓ Approved ${fmtDateTime(ro.approvedAt)} via ${esc(ro.approvedBy||'')}.</div>` : ''}
    `;
  }
};

// ----------------- PARTS CATALOG (DOS GREEN-SCREEN) -----------------
routes.parts = {
  title: () => 'Parts Catalog',
  key: () => 'parts',
  render(root) {
    root.__search = root.__search || '';
    const term = root.__search.toLowerCase();
    const list = state.parts.filter(p => !term || p.desc.toLowerCase().includes(term) || p.pn.toLowerCase().includes(term) || (p.oem||'').toLowerCase().includes(term));

    root.innerHTML = `
      ${pageHeader('Parts Catalog Lookup', 'HOME > PARTS > CATALOG')}
      <div class="notice dark">▶ PARTS DATABASE TERMINAL - ESC to return to GUI &nbsp; F3=Find &nbsp; F7=Order &nbsp; ENTER=Detail</div>
      <div class="dos-screen">
<span class="dos-prompt">C:\\GREASEMONKEY\\PARTS&gt;</span> LOOKUP "<input id="dos-search" class="dos-input" style="width:280px;" value="${esc(root.__search)}" placeholder="part #, OEM #, or description..."> "  &nbsp; <button id="dos-find">[F3] FIND</button>

<span class="dos-prompt">QUERY:</span> SELECT * FROM PARTS WHERE DESC LIKE '%${esc(root.__search || '*')}%'
<span class="dos-prompt">RESULT:</span> <span class="dos-inverse">${list.length} RECORD(S) FOUND</span>
========================================================================================
        <table>
          <thead><tr><th>PART #</th><th>DESCRIPTION</th><th>OEM XREF</th><th>STK</th><th>COST</th><th>LIST</th><th></th></tr></thead>
          <tbody>
          ${list.map(p => `<tr>
            <td>${esc(p.pn)}</td>
            <td>${esc(p.desc.slice(0, 40))}</td>
            <td>${esc((p.oem||'—').slice(0, 18))}</td>
            <td>${p.stock === 0 ? '<span class="dos-error">OUT</span>' : (p.stock < 3 ? '<span class="dos-warn">'+p.stock+'</span>' : p.stock)}</td>
            <td>$${p.cost.toFixed(2).padStart(7)}</td>
            <td>$${p.list.toFixed(2).padStart(7)}</td>
            <td><button onclick="window._wf.partDetail('${p.id}')">[INFO]</button> <button onclick="window._wf.vendorLookup('${p.id}')">[VEND]</button></td>
          </tr>`).join('')}
          </tbody>
        </table>
========================================================================================
<span class="dos-prompt">READY.</span> <span class="dos-inverse">█</span>
      </div>
    `;
    $('#dos-find').onclick = () => { root.__search = $('#dos-search').value; router.refresh(); };
    $('#dos-search').addEventListener('keydown', e => { if (e.key === 'Enter') $('#dos-find').click(); });
  }
};

// ----------------- PARTS ORDERS -----------------
routes['parts-orders'] = {
  title: () => 'Parts Orders',
  key: () => 'parts-orders',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Parts Orders', 'HOME > PARTS > ORDERS')}
      <div class="groupbox">
        <span class="gb-title">Open & Recent Orders (${state.partsOrders.length})</span>
        <table class="data-table">
          <thead><tr><th>PO #</th><th>Vendor</th><th>Created</th><th>For RO</th><th>Items</th><th>Total</th><th>ETA</th><th>Status</th><th></th></tr></thead>
          <tbody>
          ${state.partsOrders.map(po => { const v = getVendor(po.vendorId); const total = po.items.reduce((s,i)=>s+i.qty*i.cost,0); return `<tr>
            <td class="mono">${esc(po.id)}</td>
            <td>${esc(v ? v.name : '')}</td>
            <td class="mono small">${fmtDateTime(po.createdAt)}</td>
            <td class="mono">${esc(po.forRO || '—')}</td>
            <td class="right">${po.items.length}</td>
            <td class="right mono">${fmtMoney(total)}</td>
            <td>${esc(po.eta || '')}</td>
            <td><span class="badge ${po.status === 'RECEIVED' ? 'badge-ok' : (po.status === 'IN_TRANSIT' ? 'badge-info' : 'badge-warn')}">${esc(po.status)}</span></td>
            <td>${po.status === 'IN_TRANSIT' ? `<button onclick="window._wf.receivePartsOrder('${po.id}')">📦 Receive</button>` : ''}</td>
          </tr>`; }).join('') || '<tr><td colspan="9" class="center muted">No parts orders.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- VENDORS -----------------
routes.vendors = {
  title: () => 'Vendors',
  key: () => 'vendors',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Vendor Directory', 'HOME > PARTS > VENDORS')}
      <div class="groupbox">
        <span class="gb-title">Suppliers</span>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Account #</th><th>Phone</th><th>Cutoff</th><th>Lead Time</th><th>Terms</th><th>Status</th></tr></thead>
          <tbody>
          ${state.vendors.map(v => `<tr>
            <td class="mono">${esc(v.id)}</td>
            <td>${esc(v.name)}</td>
            <td class="mono">${esc(v.acct)}</td>
            <td class="mono">${esc(v.phone)}</td>
            <td class="mono">${esc(v.cutoff)}</td>
            <td>${esc(v.leadTime)}</td>
            <td>${esc(v.terms)}</td>
            <td>${v.primary ? '<span class="badge badge-ok">PRIMARY</span>' : ''}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- BAY / TECH SCHEDULE -----------------
routes.bays = {
  title: () => 'Bay Schedule',
  key: () => 'bays',
  render(root) {
    const hours = ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    root.innerHTML = `
      ${pageHeader('Bay & Technician Schedule', 'HOME > SHOP FLOOR > BAYS')}
      <div class="notice">Today's bay assignments. Click an empty slot to assign work, or a busy slot to view RO.</div>
      <div class="bay-grid">
        <div class="bg-cell bg-h">BAY \\ TIME</div>
        ${hours.map(h => `<div class="bg-cell bg-h">${h}</div>`).join('')}
        ${state.bays.map(b => `
          <div class="bg-cell bg-bay">${esc(b.name)}</div>
          ${hours.map((h, i) => {
            const busy = state.repairOrders.find(r => r.bay === b.id && r.status === 'IN_PROGRESS');
            // simulate: busy bay fills 3 slots starting at index 1
            const isBusy = busy && i >= 1 && i <= 3;
            if (isBusy) {
              const c = getCustomer(busy.customerId); const v = getVehicle(busy.vehicleId);
              return `<div class="bg-cell bg-busy" onclick="router.go('ro',{id:'${busy.id}'})" title="${esc(busy.id)} - ${esc(customerName(c))}"><div class="mono small">${esc(busy.id)}</div><div class="small">${esc(vehicleLabel(v))}</div></div>`;
            }
            return `<div class="bg-cell"></div>`;
          }).join('')}
        `).join('')}
      </div>
    `;
  }
};

routes.techs = {
  title: () => 'Technicians',
  key: () => 'techs',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Technician Roster', 'HOME > SHOP FLOOR > TECHS')}
      <div class="groupbox">
        <span class="gb-title">Roster (${state.techs.length})</span>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Certification</th><th>Years</th><th>Skills</th><th>Hourly Cost</th><th>Status</th><th>Current RO</th></tr></thead>
          <tbody>
          ${state.techs.map(t => { const onJob = state.repairOrders.find(r => r.tech === t.id && r.status === 'IN_PROGRESS'); return `<tr>
            <td class="mono">${esc(t.id)}</td>
            <td>${esc(t.name)}</td>
            <td>${esc(t.cert)}</td>
            <td class="right">${t.years}</td>
            <td class="small">${esc(t.skills.join(', '))}</td>
            <td class="right mono">${fmtMoney(t.rate)}/hr</td>
            <td><span class="badge ${onJob ? 'badge-info' : 'badge-ok'}">${onJob ? 'ON JOB' : esc(t.status.toUpperCase())}</span></td>
            <td class="mono">${onJob ? esc(onJob.id) : '—'}</td>
          </tr>`; }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['labor-book'] = {
  title: () => 'Labor Book',
  key: () => 'labor-book',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Labor Operations Book', 'HOME > SHOP FLOOR > LABOR BOOK')}
      <div class="notice">Flat-rate labor operations. Rate: <b>${fmtMoney(state.meta.laborRate)}/hr</b></div>
      <div class="groupbox">
        <span class="gb-title">Labor Operations (${state.laborBook.length})</span>
        <table class="data-table">
          <thead><tr><th>Op Code</th><th>Description</th><th>Book Hours</th><th>Charge</th></tr></thead>
          <tbody>
          ${state.laborBook.map(l => `<tr>
            <td class="mono">${esc(l.id)}</td>
            <td>${esc(l.desc)}</td>
            <td class="right mono">${l.hours.toFixed(1)}</td>
            <td class="right mono">${fmtMoney(l.hours * state.meta.laborRate)}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- REPORTS -----------------
routes.reports = {
  title: () => 'Reports',
  key: () => 'reports',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Reports Center', 'HOME > REPORTS')}
      <div class="groupbox">
        <span class="gb-title">Available Reports</span>
        <table class="data-table">
          <thead><tr><th>Report</th><th>Description</th><th></th></tr></thead>
          <tbody>
            <tr><td>💲 Daily Revenue</td><td>Invoiced revenue by labor and parts</td><td><button onclick="router.go('report-revenue')">Run</button></td></tr>
            <tr><td>⏱ Tech Productivity</td><td>Billed hours vs clock hours by technician</td><td><button onclick="router.go('report-tech-prod')">Run</button></td></tr>
            <tr><td>🛡 Warranty Log</td><td>Comeback / warranty work tracking</td><td><button onclick="router.go('report-warranty')">Run</button></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['report-revenue'] = {
  title: () => 'Daily Revenue',
  key: () => 'report-revenue',
  render(root) {
    const paid = state.invoices.filter(i => i.paid);
    const totalLabor = paid.reduce((s,i)=> { const ro = getRO(i.roId); return s + roTotals(ro).labor; }, 0);
    const totalParts = paid.reduce((s,i)=> { const ro = getRO(i.roId); return s + roTotals(ro).parts; }, 0);
    const totalCost = paid.reduce((s,i)=> { const ro = getRO(i.roId); return s + roTotals(ro).partsCost; }, 0);
    const grossProfit = totalParts - totalCost + totalLabor;
    root.innerHTML = `
      ${pageHeader('Daily Revenue Report', 'HOME > REPORTS > REVENUE')}
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">INVOICES</div><div class="kpi-value">${paid.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">LABOR REVENUE</div><div class="kpi-value">${fmtMoney(totalLabor)}</div></div>
        <div class="kpi-card"><div class="kpi-label">PARTS REVENUE</div><div class="kpi-value">${fmtMoney(totalParts)}</div></div>
        <div class="kpi-card ok"><div class="kpi-label">GROSS PROFIT</div><div class="kpi-value">${fmtMoney(grossProfit)}</div></div>
      </div>
      <div class="groupbox">
        <span class="gb-title">Detail</span>
        <table class="data-table">
          <thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Labor</th><th>Parts</th><th>Tax</th><th>Total</th></tr></thead>
          <tbody>
          ${paid.map(i => { const ro = getRO(i.roId); const c = getCustomer(ro.customerId); const t = roTotals(ro); return `<tr>
            <td class="mono">${esc(i.id)}</td>
            <td class="mono">${fmtDate(i.issuedAt)}</td>
            <td>${esc(customerName(c))}</td>
            <td class="right mono">${fmtMoney(t.labor)}</td>
            <td class="right mono">${fmtMoney(t.parts)}</td>
            <td class="right mono">${fmtMoney(t.tax)}</td>
            <td class="right mono bold">${fmtMoney(i.total)}</td>
          </tr>`; }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['report-tech-prod'] = {
  title: () => 'Tech Productivity',
  key: () => 'report-tech-prod',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Tech Productivity Report', 'HOME > REPORTS > TECH')}
      <div class="groupbox">
        <span class="gb-title">Week of 05/12 - 05/16</span>
        <table class="data-table">
          <thead><tr><th>Tech</th><th>Clock Hrs</th><th>Billed Hrs</th><th>Efficiency</th><th>Comeback %</th><th>Revenue</th></tr></thead>
          <tbody>
            <tr><td>Mike "Wrench" Petrov</td><td class="right mono">40.0</td><td class="right mono">52.5</td><td class="right mono"><b>131%</b></td><td class="right mono">2.1%</td><td class="right mono">$7,087.50</td></tr>
            <tr><td>Carlos Rodriguez</td><td class="right mono">40.0</td><td class="right mono">44.2</td><td class="right mono"><b>110%</b></td><td class="right mono">1.5%</td><td class="right mono">$5,967.00</td></tr>
            <tr><td>Tyler Nguyen</td><td class="right mono">40.0</td><td class="right mono">36.8</td><td class="right mono">92%</td><td class="right mono">0.0%</td><td class="right mono">$4,968.00</td></tr>
            <tr><td>Sarah Chen</td><td class="right mono">32.0</td><td class="right mono">38.4</td><td class="right mono"><b>120%</b></td><td class="right mono">0.0%</td><td class="right mono">$5,184.00</td></tr>
            <tr><td>Jake Burns (App)</td><td class="right mono">40.0</td><td class="right mono">21.3</td><td class="right mono">53%</td><td class="right mono">0.0%</td><td class="right mono">$2,875.50</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
};

routes['report-warranty'] = {
  title: () => 'Warranty Log',
  key: () => 'report-warranty',
  render(root) {
    root.innerHTML = `
      ${pageHeader('Warranty / Comeback Log', 'HOME > REPORTS > WARRANTY')}
      <div class="groupbox">
        <span class="gb-title">YTD Comebacks</span>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Original RO</th><th>Comeback RO</th><th>Customer</th><th>Issue</th><th>Resolution</th><th>Cost to Shop</th></tr></thead>
          <tbody>
            <tr><td class="mono">2026-03-22</td><td class="mono">RO-16412</td><td class="mono">RO-16438</td><td>Johnson, R</td><td>Alternator failed within 30 days</td><td>Replaced under shop warranty (Bosch reman warranty claim filed)</td><td class="right mono">$58.00</td></tr>
            <tr><td class="mono">2026-02-18</td><td class="mono">RO-16188</td><td class="mono">RO-16245</td><td>Davis, S</td><td>Brake pulsation after rotor replacement</td><td>Re-machined rotors, no charge</td><td class="right mono">$185.00</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
};

// ----------------- UTILITIES -----------------
routes['vin-decoder'] = {
  title: () => 'VIN Decoder',
  key: () => 'vin-decoder',
  render(root) {
    root.innerHTML = `
      ${pageHeader('VIN Decoder', 'HOME > UTILITIES > VIN')}
      <div class="dos-screen">
<span class="dos-prompt">C:\\GREASEMONKEY\\VIN&gt;</span> DECODE
ENTER 17-DIGIT VIN: <input id="vin-in" class="dos-input" style="width:280px;" placeholder="e.g. 2HGFC2F58JH540918" maxlength="17">
<button id="vin-go">[ENTER] DECODE</button>
<div id="vin-out"></div>
      </div>
    `;
    $('#vin-go').onclick = () => {
      const vin = $('#vin-in').value.trim().toUpperCase();
      const v = state.vehicles.find(x => x.vin === vin);
      const out = $('#vin-out');
      if (v) {
        const c = getCustomer(v.customerId);
        out.innerHTML = `
\n<span class="dos-prompt">VIN:</span> <span class="dos-inverse">${esc(vin)}</span>
<span class="dos-prompt">YEAR:</span> ${v.year}
<span class="dos-prompt">MAKE:</span> ${esc(v.make)}
<span class="dos-prompt">MODEL:</span> ${esc(v.model)}
<span class="dos-prompt">ENGINE:</span> ${esc(v.engine)}
<span class="dos-prompt">TRANS:</span> ${esc(v.trans)}
<span class="dos-prompt">COLOR:</span> ${esc(v.color)}
<span class="dos-prompt">PLATE:</span> ${esc(v.plate)}
<span class="dos-prompt">OWNER:</span> ${esc(customerName(c))}  [${esc(c.phone)}]
<span class="dos-prompt">RECALL CHECK:</span> <span class="dos-warn">NO OPEN RECALLS</span>
<span class="dos-prompt">READY.</span> <span class="dos-inverse">█</span>`;
      } else {
        out.innerHTML = `\n<span class="dos-error">ERR 404: VIN NOT FOUND IN LOCAL DATABASE</span>\n<span class="dos-prompt">HINT:</span> Try VIN from a vehicle on file.\n<span class="dos-prompt">READY.</span> <span class="dos-inverse">█</span>`;
      }
    };
  }
};

routes.tsb = {
  title: () => 'TSB / Recall',
  key: () => 'tsb',
  render(root) {
    root.innerHTML = `
      ${pageHeader('TSB / Recall Lookup', 'HOME > UTILITIES > TSB')}
      <div class="notice">Technical Service Bulletin and Recall database (mock).</div>
      <div class="dos-screen">
<span class="dos-prompt">C:\\GREASEMONKEY\\TSB&gt;</span> LIST RECENT
\n<span class="dos-inverse">2026 - HONDA - CIVIC - TSB 26-018 - AC condenser leak service procedure</span>
<span class="dos-inverse">2025 - FORD - F-150 5.0L - RECALL 25R-422 - Throttle body harness chafing</span>
<span class="dos-inverse">2025 - TOYOTA - CAMRY - TSB T-SB-0118-25 - Updated brake pad compound</span>
<span class="dos-prompt">3 RECORDS</span>
<span class="dos-prompt">READY.</span> <span class="dos-inverse">█</span>
      </div>
    `;
  }
};

// ============================================================
// WORKFLOWS
// ============================================================
window._wf = {

  // === CHECK-IN (from customer page or vehicle button) ===
  startCheckIn(customerId) {
    const veh = state.vehicles.filter(v => v.customerId === customerId);
    if (veh.length === 0) {
      return showModal('No Vehicles On File', `<div>This customer has no vehicles on file. Add one before checking in.</div>`, [
        { label: 'Cancel' },
        { label: '+ Add Vehicle', primary: true, onClick: () => window._wf.addVehicle(customerId) },
      ]);
    }
    if (veh.length === 1) return window._wf.startCheckInVehicle(veh[0].id);
    showModal('Select Vehicle', `
      <div class="form-grid cols-2">
        <label>Vehicle:</label>
        <select id="ci-veh">
          ${veh.map(v => `<option value="${v.id}">${esc(vehicleLabelFull(v))}</option>`).join('')}
        </select>
      </div>
    `, [
      { label: 'Cancel' },
      { label: '▶ Continue', primary: true, onClick: () => window._wf.startCheckInVehicle($('#ci-veh').value) },
    ]);
  },

  startCheckInVehicle(vehicleId) {
    const v = getVehicle(vehicleId);
    const c = getCustomer(v.customerId);
    showModal('Vehicle Check-In', `
      <div class="form-grid">
        <label>Customer:</label><input readonly value="${esc(customerName(c))} - ${esc(c.phone)}">
        <label>Vehicle:</label><input readonly value="${esc(vehicleLabelFull(v))}">
        <label>Current Mileage:*</label><input id="ci-mi" type="number" value="${v.mileage}">
        <label>Promised By:</label><input id="ci-promised" type="time" value="17:00">
        <label>Complaint / Reason:*</label>
        <textarea id="ci-comp" class="span-3" rows="3" placeholder="What is the customer reporting? Be specific..."></textarea>
        <label>Authorized For:</label>
        <select id="ci-auth" class="span-3">
          <option value="diag">Diagnostic only (no repair without approval)</option>
          <option value="oilonly">Oil change only</option>
          <option value="any">Authorized up to $${''}</option>
        </select>
      </div>
    `, [
      { label: 'Cancel' },
      { label: '[F2] Check In', primary: true, onClick: () => {
        const mileage = parseInt($('#ci-mi').value, 10);
        const complaint = $('#ci-comp').value.trim();
        if (!complaint) { toast('Complaint is required.', 'bad'); return false; }
        const ro = { id: nextROId(), customerId: c.id, vehicleId: v.id, checkedInAt: new Date().toISOString(), mileageIn: mileage, complaint, status: 'NEW', tech: '', laborLines: [], partLines: [] };
        state.repairOrders.unshift(ro);
        // update vehicle mileage
        v.mileage = mileage;
        saveState();
        log('CHECKIN', `${ro.id} - ${customerName(c)} - ${vehicleLabel(v)}`);
        toast(`Checked in as ${ro.id}.`, 'ok');
        router.go('ro', { id: ro.id });
      }},
    ]);
  },

  addVehicle(customerId) {
    showModal('Add Vehicle', `
      <div class="form-grid">
        <label>Year:*</label><input id="av-y" type="number" value="2024">
        <label>Make:*</label><input id="av-mk">
        <label>Model:*</label><input id="av-md">
        <label>VIN:</label><input id="av-vin" class="mono" maxlength="17">
        <label>Plate:*</label><input id="av-pl" class="mono">
        <label>Color:</label><input id="av-co">
        <label>Mileage:*</label><input id="av-mi" type="number" value="0">
        <label>Engine:</label><input id="av-en" placeholder="e.g. 2.0L I4">
        <label>Transmission:</label><input id="av-tr" placeholder="e.g. 6AT">
        <label>Notes:</label><input id="av-nt" class="span-3">
      </div>
    `, [
      { label: 'Cancel' },
      { label: '[F2] Save', primary: true, onClick: () => {
        const v = {
          id: nextVehicleId(), customerId,
          year: parseInt($('#av-y').value,10),
          make: $('#av-mk').value.trim(),
          model: $('#av-md').value.trim(),
          vin: $('#av-vin').value.trim().toUpperCase(),
          plate: $('#av-pl').value.trim().toUpperCase(),
          color: $('#av-co').value.trim(),
          mileage: parseInt($('#av-mi').value,10) || 0,
          engine: $('#av-en').value.trim(),
          trans: $('#av-tr').value.trim(),
          notes: $('#av-nt').value.trim(),
        };
        if (!v.make || !v.model || !v.plate) { toast('Make, model, and plate are required.', 'bad'); return false; }
        state.vehicles.push(v);
        saveState();
        log('VEH_ADD', `${v.id} - ${vehicleLabel(v)}`);
        toast(`Vehicle ${v.id} added.`, 'ok');
        router.go('customer', { id: customerId });
      }},
    ]);
  },

  // === BUILD ESTIMATE (the main workflow) ===
  startEstimate(roId) {
    const ro = getRO(roId);
    ro.status = 'ESTIMATING';
    saveState();

    function refreshTotals() {
      const t = roTotals(ro);
      $('#est-tot-labor').textContent = fmtMoney(t.labor);
      $('#est-tot-parts').textContent = fmtMoney(t.parts);
      $('#est-tot-sub').textContent = fmtMoney(t.subtotal);
      $('#est-tot-fee').textContent = fmtMoney(t.shopFee);
      $('#est-tot-tax').textContent = fmtMoney(t.tax);
      $('#est-tot-grand').textContent = fmtMoney(t.total);
    }

    function renderLaborTable() {
      return (ro.laborLines || []).map((l, i) => `<tr>
        <td class="mono">${esc(l.opId)}</td>
        <td>${esc(l.desc)}</td>
        <td class="right mono">${l.hours.toFixed(1)}</td>
        <td class="right mono">${fmtMoney(l.rate)}</td>
        <td class="right mono">${fmtMoney(l.hours * l.rate)}</td>
        <td><button onclick="window._wf._estRemoveLabor('${roId}', ${i}); window._wf._estRerender('${roId}');">✕</button></td>
      </tr>`).join('') || '<tr><td colspan="6" class="center muted">No labor lines yet.</td></tr>';
    }
    function renderPartsTable() {
      return (ro.partLines || []).map((p, i) => `<tr>
        <td class="mono small">${esc(getPart(p.partId) ? getPart(p.partId).pn : '?')}</td>
        <td>${esc(p.desc)}</td>
        <td class="right mono">${p.qty}</td>
        <td class="right mono">${fmtMoney(p.cost)}</td>
        <td class="right mono">${fmtMoney(p.list)}</td>
        <td class="right mono">${fmtMoney(p.qty * p.list)}</td>
        <td><button onclick="window._wf._estRemovePart('${roId}', ${i}); window._wf._estRerender('${roId}');">✕</button></td>
      </tr>`).join('') || '<tr><td colspan="7" class="center muted">No parts lines yet.</td></tr>';
    }

    const html = `
      <div class="notice">Building estimate for <b>${esc(ro.id)}</b> — ${esc(vehicleLabel(getVehicle(ro.vehicleId)))} — ${esc((ro.complaint||'').slice(0,60))}</div>

      <div class="groupbox">
        <span class="gb-title">Labor Lines</span>
        <div class="row">
          <select id="est-op" style="flex:1;">
            <option value="">-- Select labor operation --</option>
            ${state.laborBook.map(l => `<option value="${l.id}">${esc(l.id)} — ${esc(l.desc)} (${l.hours.toFixed(1)} hr)</option>`).join('')}
          </select>
          <button id="est-add-op">+ Add Labor</button>
        </div>
        <div class="spacer"></div>
        <table class="data-table">
          <thead><tr><th>Op Code</th><th>Description</th><th>Hrs</th><th>Rate</th><th>Ext</th><th></th></tr></thead>
          <tbody id="est-labor-body">${renderLaborTable()}</tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Parts Lines</span>
        <div class="row">
          <select id="est-pt" style="flex:1;">
            <option value="">-- Select part --</option>
            ${state.parts.map(p => `<option value="${p.id}">${esc(p.pn)} — ${esc(p.desc)} (stock:${p.stock} cost:${fmtMoney(p.cost)} list:${fmtMoney(p.list)})</option>`).join('')}
          </select>
          <input id="est-pt-qty" type="number" value="1" min="1" style="width:60px;">
          <button id="est-add-pt">+ Add Part</button>
          <button onclick="router.go('parts')">⛯ Lookup</button>
        </div>
        <div class="spacer"></div>
        <table class="data-table">
          <thead><tr><th>Part #</th><th>Description</th><th>Qty</th><th>Cost</th><th>List</th><th>Ext</th><th></th></tr></thead>
          <tbody id="est-parts-body">${renderPartsTable()}</tbody>
        </table>
      </div>

      <div class="groupbox">
        <span class="gb-title">Totals</span>
        <div class="totals-grid">
          <div class="tg-label">Labor:</div><div class="tg-val" id="est-tot-labor">$0.00</div>
          <div class="tg-label">Parts:</div><div class="tg-val" id="est-tot-parts">$0.00</div>
          <div class="tg-label">Subtotal:</div><div class="tg-val" id="est-tot-sub">$0.00</div>
          <div class="tg-label">Shop Fee:</div><div class="tg-val" id="est-tot-fee">$0.00</div>
          <div class="tg-label">Tax:</div><div class="tg-val" id="est-tot-tax">$0.00</div>
          <div class="tg-label tg-grand">TOTAL:</div><div class="tg-val tg-grand" id="est-tot-grand">$0.00</div>
        </div>
      </div>

      <div class="groupbox">
        <span class="gb-title">Tech Notes</span>
        <textarea id="est-notes" rows="2" placeholder="Inspection findings, customer recommendations, parts availability...">${esc(ro.estimateNotes||'')}</textarea>
      </div>
    `;

    $('#modal-title').textContent = 'Build Estimate — ' + ro.id;
    $('#modal-body').innerHTML = html;
    $('#modal-footer').innerHTML = '';
    const footer = $('#modal-footer');
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => closeModal();
    const sendBtn = document.createElement('button');
    sendBtn.textContent = '📨 Save & Send to Customer';
    sendBtn.className = 'btn-primary';
    sendBtn.onclick = () => {
      ro.estimateNotes = $('#est-notes').value;
      if ((ro.laborLines||[]).length === 0 && (ro.partLines||[]).length === 0) {
        toast('Add at least one labor or part line.', 'bad');
        return;
      }
      saveState();
      closeModal();
      window._wf.sendEstimate(ro.id);
    };
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '[F2] Save Draft';
    saveBtn.onclick = () => {
      ro.estimateNotes = $('#est-notes').value;
      saveState();
      log('ESTIMATE_DRAFT', `${ro.id} saved (${(ro.laborLines||[]).length}L/${(ro.partLines||[]).length}P)`);
      toast('Estimate draft saved.', 'ok');
      closeModal();
      router.refresh();
    };
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    footer.appendChild(sendBtn);
    $('#modal-backdrop').classList.remove('hidden');

    refreshTotals();

    $('#est-add-op').onclick = () => {
      const opId = $('#est-op').value;
      if (!opId) return;
      const op = getLaborOp(opId);
      ro.laborLines = ro.laborLines || [];
      ro.laborLines.push({ id: nextLineId('L'), opId, desc: op.desc, hours: op.hours, rate: state.meta.laborRate });
      saveState();
      $('#est-labor-body').innerHTML = renderLaborTable();
      refreshTotals();
    };
    $('#est-add-pt').onclick = () => {
      const partId = $('#est-pt').value;
      if (!partId) return;
      const p = getPart(partId);
      const qty = parseInt($('#est-pt-qty').value, 10) || 1;
      ro.partLines = ro.partLines || [];
      ro.partLines.push({ id: nextLineId('P'), partId: p.id, desc: p.desc, qty, cost: p.cost, list: p.list });
      saveState();
      $('#est-parts-body').innerHTML = renderPartsTable();
      refreshTotals();
    };
  },
  _estRemoveLabor(roId, i) { const ro = getRO(roId); ro.laborLines.splice(i,1); saveState(); },
  _estRemovePart(roId, i) { const ro = getRO(roId); ro.partLines.splice(i,1); saveState(); },
  _estRerender(roId) {
    const ro = getRO(roId);
    const lbody = $('#est-labor-body');
    const pbody = $('#est-parts-body');
    if (lbody) lbody.innerHTML = (ro.laborLines||[]).map((l,i)=>`<tr><td class="mono">${esc(l.opId)}</td><td>${esc(l.desc)}</td><td class="right mono">${l.hours.toFixed(1)}</td><td class="right mono">${fmtMoney(l.rate)}</td><td class="right mono">${fmtMoney(l.hours*l.rate)}</td><td><button onclick="window._wf._estRemoveLabor('${roId}',${i}); window._wf._estRerender('${roId}');">✕</button></td></tr>`).join('') || '<tr><td colspan="6" class="center muted">No labor lines yet.</td></tr>';
    if (pbody) pbody.innerHTML = (ro.partLines||[]).map((p,i)=>`<tr><td class="mono small">${esc(getPart(p.partId)?getPart(p.partId).pn:'?')}</td><td>${esc(p.desc)}</td><td class="right mono">${p.qty}</td><td class="right mono">${fmtMoney(p.cost)}</td><td class="right mono">${fmtMoney(p.list)}</td><td class="right mono">${fmtMoney(p.qty*p.list)}</td><td><button onclick="window._wf._estRemovePart('${roId}',${i}); window._wf._estRerender('${roId}');">✕</button></td></tr>`).join('') || '<tr><td colspan="7" class="center muted">No parts lines yet.</td></tr>';
    const t = roTotals(ro);
    $('#est-tot-labor') && ($('#est-tot-labor').textContent = fmtMoney(t.labor));
    $('#est-tot-parts') && ($('#est-tot-parts').textContent = fmtMoney(t.parts));
    $('#est-tot-sub') && ($('#est-tot-sub').textContent = fmtMoney(t.subtotal));
    $('#est-tot-fee') && ($('#est-tot-fee').textContent = fmtMoney(t.shopFee));
    $('#est-tot-tax') && ($('#est-tot-tax').textContent = fmtMoney(t.tax));
    $('#est-tot-grand') && ($('#est-tot-grand').textContent = fmtMoney(t.total));
  },

  // === SEND ESTIMATE ===
  sendEstimate(roId) {
    const ro = getRO(roId);
    const c = getCustomer(ro.customerId);
    const v = getVehicle(ro.vehicleId);
    const t = roTotals(ro);
    showModal('Send Estimate to Customer — ' + ro.id, `
      <div class="notice">Send the estimate for customer approval.</div>
      <div class="form-grid">
        <label>Channel:</label>
        <select id="se-chan">
          <option value="SMS">SMS with approve link (${esc(c.phone)})</option>
          <option value="Email">Email PDF (${esc(c.email||'no email on file')})</option>
          <option value="Phone">Phone call (verbal approval)</option>
        </select>
        <label>Estimate Total:</label><input readonly value="${fmtMoney(t.total)}" style="background:#ffff80;font-weight:bold;">
        <label>Message:</label>
        <textarea id="se-msg" class="span-3" rows="4">Hi ${esc(c.first)}, your ${esc(v.year)} ${esc(v.make)} ${esc(v.model)} estimate from Pete's Automotive is ready: total ${fmtMoney(t.total)}. Reply YES to approve, NO to decline, or call (217) 555-0420.</textarea>
      </div>
    `, [
      { label: 'Cancel' },
      { label: '📨 Send', primary: true, onClick: () => {
        ro.status = 'AWAITING_APPROVAL';
        ro.sentToCustomerAt = new Date().toISOString();
        saveState();
        log('EST_SENT', `${ro.id} sent via ${$('#se-chan').value}`);
        toast(`Estimate sent via ${$('#se-chan').value}.`, 'ok');
        router.refresh();
      }},
    ]);
  },

  // === RECORD APPROVAL (customer says yes/no/partial) ===
  recordApproval(roId) {
    const ro = getRO(roId);
    const lines = (ro.laborLines||[]).concat((ro.partLines||[]).map(p=>({ id: p.id, desc: p.desc, qty: p.qty, list: p.list, isPart: true })));
    showModal('Record Customer Decision — ' + ro.id, `
      <div class="notice">Update line items with what the customer approved. Unapproved lines will be dropped.</div>
      <div class="form-grid">
        <label>Approval Method:</label>
        <select id="ra-method">
          <option>SMS reply YES</option>
          <option>Customer phone call</option>
          <option>Email reply</option>
          <option>In-person signature</option>
        </select>
        <label>Decision:</label>
        <select id="ra-dec">
          <option value="all">APPROVE ALL line items</option>
          <option value="partial">PARTIAL APPROVAL (select below)</option>
          <option value="decline">DECLINE estimate (close RO)</option>
        </select>
      </div>
      <div class="spacer"></div>
      <div id="ra-lines">
        <table class="data-table">
          <thead><tr><th>✓</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
          ${(ro.laborLines||[]).map(l => `<tr><td><input type="checkbox" class="ra-line" data-kind="labor" data-id="${l.id}" checked></td><td>LABOR</td><td>${esc(l.desc)} (${l.hours.toFixed(1)} hr)</td><td class="right mono">${fmtMoney(l.hours * l.rate)}</td></tr>`).join('')}
          ${(ro.partLines||[]).map(p => `<tr><td><input type="checkbox" class="ra-line" data-kind="part" data-id="${p.id}" checked></td><td>PART</td><td>${esc(p.desc)} × ${p.qty}</td><td class="right mono">${fmtMoney(p.qty * p.list)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `, [
      { label: 'Cancel' },
      { label: 'Record Decision', primary: true, onClick: () => {
        const dec = $('#ra-dec').value;
        const method = $('#ra-method').value;
        if (dec === 'decline') {
          ro.status = 'DECLINED';
          ro.approvedBy = method + ' — DECLINED';
          ro.approvedAt = new Date().toISOString();
          saveState();
          log('EST_DECLINED', `${ro.id} declined via ${method}`);
          toast('Estimate declined.', 'info');
          router.refresh();
          return;
        }
        if (dec === 'partial') {
          const keepLabor = new Set($$('.ra-line[data-kind="labor"]:checked').map(c => c.dataset.id));
          const keepParts = new Set($$('.ra-line[data-kind="part"]:checked').map(c => c.dataset.id));
          ro.laborLines = (ro.laborLines||[]).filter(l => keepLabor.has(l.id));
          ro.partLines = (ro.partLines||[]).filter(p => keepParts.has(p.id));
          if (ro.laborLines.length === 0 && ro.partLines.length === 0) {
            ro.status = 'DECLINED';
            log('EST_DECLINED', `${ro.id} all lines declined`);
          } else {
            ro.status = 'APPROVED';
            (ro.laborLines||[]).forEach(l => l.approved = true);
            (ro.partLines||[]).forEach(p => p.approved = true);
            log('EST_APPROVED_PARTIAL', `${ro.id} via ${method}`);
          }
        } else {
          ro.status = 'APPROVED';
          (ro.laborLines||[]).forEach(l => l.approved = true);
          (ro.partLines||[]).forEach(p => p.approved = true);
          log('EST_APPROVED', `${ro.id} via ${method}`);
        }
        ro.approvedAt = new Date().toISOString();
        ro.approvedBy = method;
        saveState();
        toast('Approval recorded. Check parts availability next.', 'ok');
        router.refresh();
      }},
    ]);
  },

  // === ORDER PARTS (cross-app vendor portal) ===
  orderParts(roId) {
    const ro = getRO(roId);
    const needed = (ro.partLines||[]).filter(p => p.approved && !p.onOrder).map(p => ({ part: getPart(p.partId), line: p }));
    const lowStock = needed.filter(({part, line}) => !part || part.stock < line.qty);

    if (needed.length === 0) {
      ro.status = 'IN_PROGRESS';
      saveState();
      log('PARTS_READY', `${ro.id} all parts in stock`);
      toast('All parts in stock. Status: IN_PROGRESS.', 'ok');
      return router.refresh();
    }

    if (lowStock.length === 0) {
      return showModal('Parts In Stock', `<div class="notice ok">✓ All ${needed.length} part(s) are in stock. Reserving for this RO.</div>`, [
        { label: 'Cancel' },
        { label: '✓ Reserve & Continue', primary: true, onClick: () => {
          needed.forEach(({part, line}) => { if (part) part.stock -= line.qty; });
          ro.status = 'IN_PROGRESS';
          saveState();
          log('PARTS_RESERVED', `${ro.id} reserved from stock`);
          toast('Parts reserved. Bay assignment recommended.', 'ok');
          router.refresh();
        }},
      ]);
    }

    // Need to order. Show parts portal selector.
    showModal('Order Parts for ' + ro.id, `
      <div class="notice">${lowStock.length} part(s) below required quantity. Select a vendor to order from.</div>
      <table class="data-table">
        <thead><tr><th>Part #</th><th>Description</th><th>Need</th><th>On Hand</th></tr></thead>
        <tbody>
        ${lowStock.map(({part, line}) => `<tr><td class="mono small">${esc(part ? part.pn : '?')}</td><td>${esc(line.desc)}</td><td class="right mono">${line.qty}</td><td class="right mono">${part ? part.stock : 0}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="spacer"></div>
      <div class="row gap-2">
        <span>Open vendor portal:</span>
        <button onclick="window._wf.vendorPortal('VND-NAPA', '${ro.id}'); return false;" style="background:#003c8f;color:#fff;font-weight:bold;">▶ NAPA Pro</button>
        <button onclick="window._wf.vendorPortal('VND-AZ', '${ro.id}'); return false;" style="background:#d52b1e;color:#fff;font-weight:bold;">▶ AutoZone Commercial</button>
        <button onclick="window._wf.vendorPortal('VND-OREILLY', '${ro.id}'); return false;" style="background:#1c7028;color:#fff;font-weight:bold;">▶ O'Reilly First Call</button>
        <button onclick="window._wf.vendorPortal('VND-WPAC', '${ro.id}'); return false;">▶ WORLDPAC</button>
      </div>
    `, [{ label: 'Close' }]);
  },

  // === Vendor Portal (looks like an external website) ===
  vendorPortal(vendorId, roId) {
    closeModal();
    const v = getVendor(vendorId);
    const ro = getRO(roId);
    const need = (ro.partLines||[]).filter(p => p.approved && !p.onOrder);
    const brandClass = 'vp-' + (v.brand === 'generic' ? 'napa' : v.brand);
    const brandName = v.name.toUpperCase();

    const cart = []; // local cart inside this portal session

    function vendorPriceForPart(partId) {
      const p = getPart(partId);
      if (!p) return null;
      // mock different vendor pricing
      const variance = { 'VND-NAPA': 1.00, 'VND-AZ': 0.95, 'VND-OREILLY': 1.03, 'VND-WPAC': 0.92, 'VND-FORD': 1.45, 'VND-BMW': 1.55 };
      const factor = variance[vendorId] || 1;
      const cost = p.cost * factor;
      // mock stock at this vendor: some have it, some don't
      const stockMock = { 'VND-NAPA': 6, 'VND-AZ': 2, 'VND-OREILLY': 4, 'VND-WPAC': 12, 'VND-FORD': 0, 'VND-BMW': 0 };
      let stock = stockMock[vendorId] || 5;
      // BMW parts only at BMW dealer / WORLDPAC
      if (p.id.includes('BMW') && !['VND-BMW', 'VND-WPAC'].includes(vendorId)) stock = 0;
      // Ford parts mostly at NAPA / Ford / WPAC
      if (p.id.includes('FD150') && !['VND-NAPA', 'VND-FORD', 'VND-WPAC'].includes(vendorId)) stock = 0;
      return { cost, stock };
    }

    function renderResults() {
      return need.map(line => {
        const part = getPart(line.partId);
        const pricing = vendorPriceForPart(line.partId);
        const stockLabel = !pricing || pricing.stock === 0
          ? '<span class="vp-stock-out">OUT OF STOCK</span>'
          : pricing.stock < 3 ? `<span class="vp-stock-low">${pricing.stock} LOW</span>` : `<span class="vp-stock-in">${pricing.stock} IN STOCK</span>`;
        const inCart = cart.find(c => c.partId === line.partId);
        return `<div class="vp-result-row">
          <div class="mono small">${esc(part ? part.pn : '?')}</div>
          <div>${esc(line.desc)}<br><span class="muted small">OEM: ${esc(part && part.oem || 'N/A')}</span></div>
          <div class="mono">${pricing ? '$' + pricing.cost.toFixed(2) : '—'}</div>
          <div class="mono right">QTY: ${line.qty}</div>
          <div>${stockLabel}</div>
          <div>${pricing && pricing.stock >= line.qty
            ? (inCart ? '<span class="vp-stock-in">✓ IN CART</span>' : `<button class="vp-add-cart" onclick="window._wf._vpAdd('${line.partId}', ${line.qty}, ${pricing.cost.toFixed(2)})">+ Add to Cart</button>`)
            : '<span class="muted small">Try another vendor</span>'}</div>
        </div>`;
      }).join('');
    }

    function refreshPortal() {
      $('#vp-results').innerHTML = renderResults();
      const total = cart.reduce((s,i) => s + i.qty * i.cost, 0);
      $('#vp-cart-count').textContent = cart.length;
      $('#vp-cart-total').textContent = '$' + total.toFixed(2);
      $('#vp-checkout').disabled = cart.length === 0;
    }
    window._wf._vpAdd = (partId, qty, cost) => {
      if (!cart.find(c => c.partId === partId)) cart.push({ partId, qty, cost });
      refreshPortal();
    };

    $('#modal-title').textContent = brandName + ' — Professional Portal';
    $('#modal-body').innerHTML = `
      <div class="vendor-portal ${brandClass}" style="min-width:680px;">
        <div class="vp-header">
          <span class="vp-logo">${esc(v.brand === 'napa' ? 'NAPA' : v.brand === 'az' ? 'AUTOZONE' : v.brand === 'oreilly' ? "O'REILLY" : 'WORLDPAC')}</span>
          <span style="flex:1;font-family:Arial;font-size:13px;">Welcome back, <b>PETE'S AUTOMOTIVE</b> — Account ${esc(v.acct)} — ${esc(v.terms)}</span>
          <span style="font-family:Arial;font-size:11px;opacity:.8;">Cutoff: ${esc(v.cutoff)} • ${esc(v.leadTime)}</span>
        </div>
        <div class="vp-search-bar">
          <input type="text" value="Auto-imported from RO ${esc(roId)}" style="flex:1;" readonly>
          <button>Search</button>
          <button>Vehicle Lookup</button>
        </div>
        <div class="vp-results">
          <div class="vp-result-row header">
            <div>Part #</div><div>Description</div><div>Your Price</div><div>Qty</div><div>Availability</div><div></div>
          </div>
          <div id="vp-results">${renderResults()}</div>
        </div>
        <div class="vp-footer">
          <span style="flex:1;font-family:Arial;font-size:11px;color:#404040;">📦 Free local delivery on orders over $50 • Same-day cutoff: ${esc(v.cutoff)}</span>
          <span style="font-family:Arial;font-size:12px;">Cart: <b id="vp-cart-count">0</b> items, <b id="vp-cart-total">$0.00</b></span>
          <button onclick="window._wf.orderParts('${roId}')">← Different Vendor</button>
          <button class="btn-primary" id="vp-checkout" disabled onclick="window._wf._vpCheckout('${roId}', '${vendorId}')">▶ Place Order</button>
        </div>
      </div>
    `;
    $('#modal-footer').innerHTML = '';
    $('#modal-backdrop').classList.remove('hidden');

    refreshPortal();
    window._wf._vpCart = cart;
    window._wf._vpVendorId = vendorId;
  },

  _vpCheckout(roId, vendorId) {
    const cart = window._wf._vpCart || [];
    if (cart.length === 0) return;
    const ro = getRO(roId);
    const vendor = getVendor(vendorId);
    const po = {
      id: nextPOId(),
      vendorId,
      createdAt: new Date().toISOString(),
      status: 'IN_TRANSIT',
      items: cart.map(c => ({ partId: c.partId, qty: c.qty, cost: c.cost })),
      forRO: roId,
      eta: vendor.leadTime,
    };
    state.partsOrders.unshift(po);
    // mark RO lines as on-order
    cart.forEach(c => {
      const line = (ro.partLines||[]).find(p => p.partId === c.partId);
      if (line) { line.onOrder = po.id; line.cost = c.cost; }
    });
    ro.status = 'PARTS_PENDING';
    saveState();
    log('PO_PLACED', `${po.id} -> ${vendor.name} for ${roId}`);
    closeModal();
    toast(`Order ${po.id} placed with ${vendor.name}. ETA: ${vendor.leadTime}.`, 'ok');
    router.refresh();
  },

  // === MARK PARTS RECEIVED ===
  markPartsReceived(roId) {
    const ro = getRO(roId);
    const pendingPOs = state.partsOrders.filter(po => po.forRO === roId && po.status === 'IN_TRANSIT');
    if (pendingPOs.length === 0) {
      return alertDialog('No Open Orders', 'No open parts orders for this RO.');
    }
    showModal('Receive Parts for ' + roId, `
      <table class="data-table">
        <thead><tr><th>PO #</th><th>Vendor</th><th>Items</th><th>ETA</th><th></th></tr></thead>
        <tbody>
        ${pendingPOs.map(po => `<tr>
          <td class="mono">${esc(po.id)}</td>
          <td>${esc(getVendor(po.vendorId).name)}</td>
          <td class="right">${po.items.length}</td>
          <td>${esc(po.eta)}</td>
          <td><button class="btn-primary" onclick="window._wf.receivePartsOrder('${po.id}')">📦 Receive</button></td>
        </tr>`).join('')}
        </tbody>
      </table>
    `, [{ label: 'Close' }]);
  },

  receivePartsOrder(poId) {
    const po = state.partsOrders.find(p => p.id === poId);
    if (!po) return;
    po.status = 'RECEIVED';
    // add to stock & clear onOrder flag on the linked RO
    po.items.forEach(item => {
      const part = getPart(item.partId);
      if (part) part.stock += item.qty;
    });
    if (po.forRO) {
      const ro = getRO(po.forRO);
      if (ro) {
        po.items.forEach(item => {
          const line = (ro.partLines||[]).find(p => p.partId === item.partId && p.onOrder === poId);
          if (line) { line.onOrder = undefined; part_consume(line, getPart(item.partId)); }
        });
        function part_consume(line, part) {
          if (part && part.stock >= line.qty) part.stock -= line.qty;
        }
        // if all parts now received, advance status
        const stillOnOrder = (ro.partLines||[]).some(p => p.onOrder);
        if (!stillOnOrder) ro.status = 'APPROVED'; // ready for bay assignment
      }
    }
    saveState();
    log('PO_RECEIVED', `${poId}`);
    toast(`Order ${poId} received. Parts in inventory.`, 'ok');
    closeModal();
    router.refresh();
  },

  // === ASSIGN BAY/TECH ===
  assignBayTech(roId) {
    const ro = getRO(roId);
    const busyBays = new Set(state.repairOrders.filter(r => r.id !== roId && r.status === 'IN_PROGRESS' && r.bay).map(r => r.bay));
    showModal('Assign Bay & Tech — ' + roId, `
      <div class="form-grid">
        <label>Bay:</label>
        <select id="ab-bay">
          ${state.bays.map(b => `<option value="${b.id}" ${busyBays.has(b.id) ? 'disabled' : ''}>${esc(b.name)}${busyBays.has(b.id) ? ' (occupied)' : ''}</option>`).join('')}
        </select>
        <label>Technician:</label>
        <select id="ab-tech">
          ${state.techs.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(t.cert)})</option>`).join('')}
        </select>
      </div>
    `, [
      { label: 'Cancel' },
      { label: '✓ Assign & Start Work', primary: true, onClick: () => {
        ro.bay = $('#ab-bay').value;
        ro.tech = $('#ab-tech').value;
        ro.status = 'IN_PROGRESS';
        saveState();
        log('BAY_ASSIGN', `${roId} -> ${ro.bay} / ${ro.tech}`);
        toast(`Assigned to ${ro.bay}. Work started.`, 'ok');
        router.refresh();
      }},
    ]);
  },

  // === COMPLETE / QC / READY ===
  completeWork(roId) {
    const ro = getRO(roId);
    ro.status = 'QC';
    ro.completedAt = new Date().toISOString();
    saveState();
    log('WORK_COMPLETE', `${roId}`);
    toast('Work completed. Moved to QC.', 'ok');
    router.refresh();
  },

  passQC(roId) {
    const ro = getRO(roId);
    ro.status = 'READY';
    saveState();
    log('QC_PASS', `${roId}`);
    // notify customer
    const c = getCustomer(ro.customerId);
    const v = getVehicle(ro.vehicleId);
    const notif = `Hi ${c.first}, your ${v.year} ${v.make} is ready for pickup. Total: ${fmtMoney(roTotals(ro).total)}. We close at 6pm.`;
    log('NOTIFY_READY', `SMS to ${c.id}: ${notif.slice(0,40)}`);
    toast('QC passed. Customer notified.', 'ok');
    router.refresh();
  },

  // === INVOICE ===
  invoice(roId) {
    const ro = getRO(roId);
    const t = roTotals(ro);
    showModal('Invoice & Take Payment — ' + roId, `
      <div class="notice">Review totals and capture payment.</div>
      <div class="totals-grid">
        <div class="tg-label">Subtotal:</div><div class="tg-val">${fmtMoney(t.subtotal)}</div>
        <div class="tg-label">Shop Fee:</div><div class="tg-val">${fmtMoney(t.shopFee)}</div>
        <div class="tg-label">Tax:</div><div class="tg-val">${fmtMoney(t.tax)}</div>
        <div class="tg-label tg-grand">TOTAL DUE:</div><div class="tg-val tg-grand">${fmtMoney(t.total)}</div>
      </div>
      <div class="spacer"></div>
      <div class="form-grid">
        <label>Payment Method:*</label>
        <select id="inv-pm">
          <option>VISA ****4471</option>
          <option>Mastercard ****8821</option>
          <option>Cash</option>
          <option>Check #</option>
          <option>Fleet Account</option>
          <option>Warranty Claim</option>
        </select>
        <label>Authorization:</label><input id="inv-auth" value="AUTH-${Math.floor(Math.random()*900000+100000)}" readonly class="mono">
        <label>Tip:</label><input id="inv-tip" type="number" value="0" step="1">
      </div>
    `, [
      { label: 'Cancel' },
      { label: '▶ Capture Payment', primary: true, onClick: () => {
        const invoice = {
          id: nextInvId(),
          roId,
          issuedAt: new Date().toISOString(),
          subtotal: t.subtotal,
          tax: t.tax,
          shopFee: t.shopFee,
          total: t.total,
          paymentMethod: $('#inv-pm').value,
          paid: true,
        };
        state.invoices.unshift(invoice);
        ro.status = 'INVOICED';
        // service history
        const v = getVehicle(ro.vehicleId);
        state.serviceHistory.unshift({
          id: 'H' + Date.now(), vehicleId: ro.vehicleId, date: invoice.issuedAt.slice(0,10),
          mileage: ro.mileageIn, ro: roId,
          summary: (ro.laborLines||[]).map(l => l.desc).join(', ').slice(0,80),
          total: invoice.total,
        });
        saveState();
        log('INVOICED', `${invoice.id} ${fmtMoney(invoice.total)} via ${invoice.paymentMethod}`);
        closeModal();
        toast(`Payment captured. Invoice ${invoice.id}.`, 'ok');
        setTimeout(() => window._wf.printInvoice(invoice.id), 200);
      }},
    ]);
  },

  printInvoice(invId) {
    const inv = state.invoices.find(i => i.id === invId);
    if (!inv) return;
    const ro = getRO(inv.roId);
    const c = getCustomer(ro.customerId);
    const v = getVehicle(ro.vehicleId);
    const t = roTotals(ro);
    showModal('Invoice ' + inv.id, `
      <div class="invoice-paper">
        <h2>PETE'S AUTOMOTIVE</h2>
        <div>1842 Industrial Blvd, Springfield IL 62703</div>
        <div>(217) 555-0420 &nbsp; License: IL-RPF-22184</div>
        <hr>
        <div style="display:flex;justify-content:space-between;">
          <div><b>INVOICE ${esc(inv.id)}</b><br>${fmtDateTime(inv.issuedAt)}</div>
          <div style="text-align:right;"><b>RO ${esc(ro.id)}</b><br>Tech: ${esc(getTech(ro.tech) ? getTech(ro.tech).name : '—')}</div>
        </div>
        <hr>
        <div><b>CUSTOMER:</b> ${esc(customerName(c))} - ${esc(c.phone)}</div>
        <div><b>VEHICLE:</b> ${esc(vehicleLabelFull(v))}</div>
        <div><b>MILEAGE:</b> ${fmtMileage(ro.mileageIn)} &nbsp; <b>VIN:</b> ${esc(v.vin)}</div>
        <hr>
        <div><b>COMPLAINT:</b> ${esc(ro.complaint)}</div>
        <hr>
        <table>
          <thead><tr><th align="left">LABOR</th><th align="right">HRS</th><th align="right">RATE</th><th align="right">EXT</th></tr></thead>
          <tbody>
            ${(ro.laborLines||[]).map(l => `<tr><td>${esc(l.desc)}</td><td align="right">${l.hours.toFixed(1)}</td><td align="right">${fmtMoney(l.rate)}</td><td align="right">${fmtMoney(l.hours*l.rate)}</td></tr>`).join('')}
          </tbody>
        </table>
        <table style="margin-top:8px;">
          <thead><tr><th align="left">PARTS</th><th align="right">QTY</th><th align="right">PRICE</th><th align="right">EXT</th></tr></thead>
          <tbody>
            ${(ro.partLines||[]).map(p => `<tr><td>${esc(p.desc)}</td><td align="right">${p.qty}</td><td align="right">${fmtMoney(p.list)}</td><td align="right">${fmtMoney(p.qty*p.list)}</td></tr>`).join('')}
          </tbody>
        </table>
        <hr>
        <div style="text-align:right;">
          Subtotal: ${fmtMoney(t.subtotal)}<br>
          Shop Fee: ${fmtMoney(t.shopFee)}<br>
          Sales Tax: ${fmtMoney(t.tax)}<br>
          <b style="font-size:14px;">TOTAL: ${fmtMoney(inv.total)}</b><br>
          Paid via ${esc(inv.paymentMethod)}
        </div>
        <hr>
        <div style="font-size:10px;text-align:center;color:#606060;">12-MONTH / 12,000-MILE WARRANTY ON PARTS &amp; LABOR &nbsp;|&nbsp; THANK YOU FOR YOUR BUSINESS</div>
      </div>
    `, [{ label: 'Close' }]);
  },

  // === PARTS LOOKUPS ===
  partDetail(partId) {
    const p = getPart(partId);
    if (!p) return;
    showModal('Part Detail — ' + p.pn, `
      <div class="form-grid">
        <label>Part #:</label><input readonly value="${esc(p.pn)}" class="mono">
        <label>OEM Cross-Ref:</label><input readonly value="${esc(p.oem||'N/A')}" class="mono">
        <label>Description:</label><input readonly value="${esc(p.desc)}" class="span-3">
        <label>Category:</label><input readonly value="${esc(p.category)}">
        <label>Stock On Hand:</label><input readonly value="${p.stock}">
        <label>Cost:</label><input readonly value="${fmtMoney(p.cost)}">
        <label>List Price:</label><input readonly value="${fmtMoney(p.list)}">
      </div>
    `);
  },

  vendorLookup(partId) {
    const p = getPart(partId);
    const lines = state.vendors.map(v => {
      const stockMock = { 'VND-NAPA': 6, 'VND-AZ': 2, 'VND-OREILLY': 4, 'VND-WPAC': 12, 'VND-FORD': p.oem.includes('Z-') ? 3 : 0, 'VND-BMW': p.id.includes('BMW') ? 5 : 0 };
      const stock = (p.id.includes('BMW') && !['VND-BMW', 'VND-WPAC'].includes(v.id)) ? 0 : (stockMock[v.id] || 0);
      const variance = { 'VND-NAPA': 1.00, 'VND-AZ': 0.95, 'VND-OREILLY': 1.03, 'VND-WPAC': 0.92, 'VND-FORD': 1.45, 'VND-BMW': 1.55 };
      return { v, stock, price: p.cost * (variance[v.id]||1) };
    });
    showModal('Vendor Availability — ' + p.pn, `
      <div class="notice">Live availability check across vendors.</div>
      <table class="data-table">
        <thead><tr><th>Vendor</th><th>Lead Time</th><th>Stock</th><th>Your Cost</th></tr></thead>
        <tbody>
        ${lines.map(l => `<tr>
          <td>${esc(l.v.name)}</td>
          <td>${esc(l.v.leadTime)}</td>
          <td class="right ${l.stock === 0 ? 'bold' : ''}" style="color:${l.stock === 0 ? '#c00' : (l.stock < 3 ? '#c06000' : '#008000')};">${l.stock === 0 ? 'OUT' : l.stock}</td>
          <td class="right mono">${fmtMoney(l.price)}</td>
        </tr>`).join('')}
        </tbody>
      </table>
    `);
  },
};

// ============ EVENT WIRING ============
$$('[data-nav]').forEach(el => el.addEventListener('click', () => router.go(el.dataset.nav)));
$('#btn-reset').onclick = () => {
  confirmDialog('Reset System', 'This will erase all changes and reload the seed data. Continue?').then(ok => { if (ok) resetState(); });
};
$('#btn-print').onclick = () => alertDialog('Print', 'Print not available in demo build.');

// Tree folder toggles
$$('.tree-folder, .tree-root').forEach(node => {
  node.addEventListener('click', e => {
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

// Initial
router.go('dashboard');
refreshStatusBar();
log('LOGIN', 'Session started');
