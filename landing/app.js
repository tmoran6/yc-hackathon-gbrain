/* ============================================================
   g-eyes — landing motion
   Signature: a dead legacy ERP screen is recorded, *seen*,
   shattered, and reassembled into a living company-brain graph.
   Pure vanilla. Respects prefers-reduced-motion.
   ============================================================ */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- nav scrolled ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveals ---------- */
  const revIO = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => RM ? el.classList.add('in') : revIO.observe(el));

  /* ---------- mono decode ---------- */
  const GLYPH = '01<>/\\[]{}=+*#%';
  function decode(el) {
    const txt = el.dataset.final || (el.dataset.final = el.textContent);
    if (RM) { el.textContent = txt; return; }
    let f = 0; const dur = 26;
    const tick = () => {
      f++;
      el.textContent = txt.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        if (i < (f - 6)) return txt[i];
        return GLYPH[(Math.random() * GLYPH.length) | 0];
      }).join('');
      if (f < dur + txt.length) requestAnimationFrame(tick); else el.textContent = txt;
    };
    tick();
  }
  const decIO = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { decode(e.target); decIO.unobserve(e.target); } });
  }, { threshold: .6 });
  $$('[data-decode]').forEach(el => decIO.observe(el));

  /* ---------- count up ---------- */
  const cntIO = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return; cntIO.unobserve(e.target);
      const el = e.target, to = +el.dataset.count;
      if (RM) { el.textContent = to; return; }
      let s = null;
      const step = ts => {
        s ??= ts; const p = clamp((ts - s) / 900, 0, 1);
        el.textContent = Math.round(easeOutExpo(p) * to);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .8 });
  $$('[data-count]').forEach(el => cntIO.observe(el));

  /* ---------- magnetic buttons ---------- */
  if (!RM && !TOUCH) $$('[data-magnetic]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .28;
      const y = (e.clientY - r.top - r.height / 2) * .42;
      b.style.transform = `translate(${x}px,${y}px)`;
    });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });

  /* ---------- access form ---------- */
  const form = $('#accessForm'), msg = $('#formMsg');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = '↳ that email looks off — try again'; msg.classList.add('err'); return;
    }
    msg.classList.remove('err');
    msg.textContent = '↳ in. we\'ll reach out to watch your Tuesday.';
    form.reset();
  });

  /* ---------- skill typewriter ---------- */
  const SKILL = [
    ['c', '# observed once · written by g-eyes · not by you'],
    ['', ''],
    ['h', 'skill: medication_refill'],
    ['k', 'trigger: ', 'refill request enters the queue'],
    ['k', 'apps:    ', 'PharmaSys 4.2, insurance portal, SMS'],
    ['k', 'inputs:  ', 'patient, Rx number, prescriber'],
    ['', ''],
    ['h', 'steps:'],
    ['s', '  1  open patient → verify refill eligibility'],
    ['s', '  2  check insurance coverage + copay'],
    ['s', '  3  check inventory on hand'],
    ['s', '  4  in stock  → mark for fulfillment'],
    ['s', '  5  out       → draft supplier order'],
    ['s', '  6  notify customer when ready for pickup'],
    ['', ''],
    ['h', 'decision_points:'],
    ['s', '  · insurance rejected → route to pharmacist'],
    ['s', '  · controlled substance → DEA log + 2nd check'],
    ['', ''],
    ['h', 'suggested_automations:'],
    ['k', '  →  ', 'Refill Intake · Inventory Check'],
    ['k', '  →  ', 'Supplier Order · Customer Notify'],
    ['k', '  →  ', 'Exception flag (human-in-the-loop)'],
    ['', ''],
    ['c', '# committed to GStack · shared into GBrain'],
  ];
  function typeSkill() {
    const code = $('#skillCode'), items = $$('#observedList li');
    if (RM) {
      code.innerHTML = SKILL.map(([t, a, b]) =>
        t ? `<span class="${t}">${a}${b ? `<span class="k">${b}</span>` : ''}</span>` : '').join('\n');
      items.forEach(li => li.classList.add('seen')); return;
    }
    let line = 0;
    const cursor = '<span class="cursor"></span>';
    const run = () => {
      if (line >= SKILL.length) { code.innerHTML = code.innerHTML.replace(cursor, ''); return; }
      const [t, a = '', b = ''] = SKILL[line];
      const full = a + b;
      let i = 0;
      const built = code.dataset.built || '';
      const stamp = SKILL.slice(0, line).map(([tt, aa = '', bb = '']) =>
        tt ? `<span class="${tt}">${esc(aa)}${bb ? `<span class="k">${esc(bb)}</span>` : ''}</span>` : '').join('\n');
      const typ = () => {
        i += t === 'c' ? 3 : 2;
        const shown = full.slice(0, i);
        let head = esc(a.slice(0, Math.min(i, a.length)));
        let tail = i > a.length ? `<span class="k">${esc(b.slice(0, i - a.length))}</span>` : '';
        const cur = t ? `<span class="${t}">${head}${tail}</span>` : '';
        code.innerHTML = (stamp ? stamp + '\n' : '') + cur + cursor;
        if (i < full.length) setTimeout(typ, t === 'c' ? 8 : 14);
        else {
          const idx = { 9: 0, 10: 1, 11: 2, 12: 3, 13: 4, 14: 5, 22: 6 }[line];
          if (idx != null && items[idx]) items[idx].classList.add('seen');
          line++; setTimeout(run, full ? 70 : 30);
        }
      };
      if (!full) { line++; code.innerHTML = (stamp ? stamp + '\n' : '') + '\n' + cursor; setTimeout(run, 40); }
      else typ();
    };
    run();
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const skIO = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { typeSkill(); skIO.unobserve(e.target); } });
  }, { threshold: .35 });
  if ($('#skillCode')) skIO.observe($('#skill'));

  /* ============================================================
     HERO SCENE — legacy ERP → seen → shatter → company brain
     ============================================================ */
  const NODE_LABELS = ['summarize_refills', 'check_insurance', 'forecast_stock',
    'draft_supplier_order', 'notify_customer', 'flag_exceptions', 'close_dea_log'];

  class Scene {
    constructor(canvas, caption) {
      this.cv = canvas; this.cx = canvas.getContext('2d');
      this.cap = caption; this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.lg = document.createElement('canvas');
      this.lc = this.lg.getContext('2d', { willReadFrequently: true });
      this.cursor = { x: 0, y: 0 };
      this.t0 = performance.now(); this.running = false; this.snapped = false;
      this.PH = RM ? null : [0, 2600, 4200, 5900, 8100, 10800, 12300]; // phase boundaries (ms)
      this.build();
      new ResizeObserver(() => this.build()).observe(canvas.parentElement);
    }

    build() {
      const r = this.cv.parentElement.getBoundingClientRect();
      if (!r.width) return;
      this.W = r.width; this.H = r.height;
      [this.cv, this.lg].forEach(c => { c.width = this.W * this.dpr; c.height = this.H * this.dpr; });
      this.cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.lc.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.center = { x: this.W * .5, y: this.H * .47 };
      this.drawLegacy(0);
      this.sample();
      this.buildGraph();
      this.assign();
      this.snapped = false;
      if (RM) { this.renderStatic(); return; }
      if (!this.running) { this.running = true; requestAnimationFrame(this.loop.bind(this)); }
    }

    /* ---- procedural legacy ERP frame ---- */
    drawLegacy(t) {
      const c = this.lc, W = this.W, H = this.H;
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#cfcabb'; c.fillRect(0, 0, W, H);                 // desktop
      const pad = Math.round(W * .045), wx = pad, wy = pad, ww = W - pad * 2, wh = H - pad * 2;
      c.fillStyle = '#d9d5c7'; c.fillRect(wx, wy, ww, wh);             // window face
      c.strokeStyle = '#7e7e7e'; c.lineWidth = 1; c.strokeRect(wx + .5, wy + .5, ww, wh);
      c.strokeStyle = '#ffffff'; c.strokeRect(wx + 1.5, wy + 1.5, ww - 3, wh - 3);
      // title bar
      const tb = Math.max(18, H * .055);
      c.fillStyle = '#0a1f8f'; c.fillRect(wx + 3, wy + 3, ww - 6, tb);
      c.fillStyle = '#e9e7dd'; c.font = `600 ${Math.round(tb * .5)}px "Geist Mono",monospace`;
      c.textBaseline = 'middle';
      c.fillText('PHARMA-SYS  4.2   —   REFILL QUEUE', wx + 12, wy + 3 + tb / 2);
      ['_', '□', '✕'].forEach((g, i) => {
        const bx = wx + ww - 8 - (3 - i) * (tb - 4);
        c.fillStyle = '#c3c3c3'; c.fillRect(bx, wy + 6, tb - 6, tb - 6);
        c.strokeStyle = '#5a5a5a'; c.strokeRect(bx + .5, wy + 6.5, tb - 7, tb - 7);
        c.fillStyle = '#1a1a1a'; c.fillText(g, bx + 3, wy + 6 + (tb - 6) / 2);
      });
      // menu
      const my = wy + 3 + tb, mh = Math.max(14, H * .04);
      c.fillStyle = '#cdc8b9'; c.fillRect(wx + 3, my, ww - 6, mh);
      c.fillStyle = '#2b2b2b'; c.font = `${Math.round(mh * .52)}px "Geist Mono",monospace`;
      let mxp = wx + 14;
      ['File', 'Edit', 'Patient', 'Rx', 'Inventory', 'Reports', 'Help'].forEach(m => {
        c.fillText(m, mxp, my + mh / 2); mxp += c.measureText(m).width + 22;
      });
      // table
      const tx = wx + 14, ty = my + mh + 12, tw = ww - 28;
      const cols = [.10, .30, .22, .10, .14, .14], hdr = ['RX #', 'PATIENT', 'DRUG', 'QTY', 'INS', 'STATUS'];
      const rowH = Math.max(15, (wh - (ty - wy) - 26) / 13);
      c.fillStyle = '#b8b3a2'; c.fillRect(tx, ty, tw, rowH);
      c.fillStyle = '#1d1d1d'; c.font = `600 ${Math.round(rowH * .46)}px "Geist Mono",monospace`;
      let cxp = tx + 6; cols.forEach((w, i) => { c.fillText(hdr[i], cxp, ty + rowH / 2); cxp += tw * w; });
      const ROWS = [
        ['410233', 'GARCIA, M.', 'METFORMIN 500', '90', 'BCBS', 'READY'],
        ['410234', 'NGUYEN, T.', 'LISINOPRIL 10', '30', 'AETNA', 'HOLD'],
        ['410235', 'PATEL, R.', 'ATORVAST. 20', '90', 'CIGNA', 'VERIFY'],
        ['410236', 'O\'BRIEN, K.', 'LEVOTHYROX 75', '30', 'MEDCR', 'READY'],
        ['410237', 'KIM, S.', 'AMLODIPINE 5', '30', 'BCBS', 'ORDER'],
        ['410238', 'SMITH, J.', 'OMEPRAZOLE 20', '30', 'UHC', 'READY'],
        ['410239', 'LOPEZ, A.', 'GABAPENTIN 300', '90', 'AETNA', 'VERIFY'],
        ['410240', 'CHEN, W.', 'SERTRALINE 50', '30', 'CIGNA', 'HOLD'],
        ['410241', 'DAVIS, P.', 'LOSARTAN 50', '90', 'MEDCR', 'READY'],
        ['410242', 'KHAN, F.', 'METOPROLOL 25', '30', 'UHC', 'ORDER'],
        ['410243', 'REYES, D.', 'SIMVASTAT. 40', '30', 'BCBS', 'READY'],
        ['410244', 'WONG, L.', 'PANTOPRAZ. 40', '30', 'AETNA', 'VERIFY'],
      ];
      c.font = `${Math.round(rowH * .44)}px "Geist Mono",monospace`;
      ROWS.forEach((rw, ri) => {
        const ry = ty + rowH * (ri + 1);
        c.fillStyle = ri % 2 ? '#d9d5c7' : '#d0ccbd'; c.fillRect(tx, ry, tw, rowH);
        let xp = tx + 6;
        rw.forEach((cell, ci) => {
          c.fillStyle = ci === 5 ? (cell === 'READY' ? '#1c7a2e' : cell === 'ORDER' ? '#a23' : '#2b2b2b') : '#2b2b2b';
          c.fillText(cell, xp, ry + rowH / 2); xp += tw * cols[ci];
        });
      });
      // status bar
      c.fillStyle = '#cdc8b9'; c.fillRect(wx + 3, wy + wh - 22, ww - 6, 19);
      c.fillStyle = '#3a3a3a'; c.font = `${Math.round(rowH * .42)}px "Geist Mono",monospace`;
      c.fillText('F1 Help   ▏   CAPS   ▏   12 records   ▏   user: pharmacist', wx + 12, wy + wh - 12);
      // scanlines + vignette (dead, tired screen)
      c.fillStyle = 'rgba(0,0,0,.05)';
      for (let y = wy; y < wy + wh; y += 3) c.fillRect(wx, y, ww, 1);
      const vg = c.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      // recorded cursor path
      const path = [[.34, .42], [.34, .42], [.52, .55], [.52, .55], [.7, .68], [.7, .68], [.41, .8], [.34, .42]];
      const seg = (t % 1) * (path.length - 1), i0 = Math.floor(seg), f = seg - i0;
      const p0 = path[i0], p1 = path[Math.min(i0 + 1, path.length - 1)];
      this.cursor.x = lerp(p0[0], p1[0], easeInOutCubic(f)) * W;
      this.cursor.y = lerp(p0[1], p1[1], easeInOutCubic(f)) * H;
    }

    drawCursor(ctx, click) {
      const { x, y } = this.cursor;
      if (click) {
        ctx.strokeStyle = 'rgba(205,245,100,.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 6 + click * 16, 0, 7); ctx.globalAlpha = 1 - click; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x, y + 17); ctx.lineTo(x + 4.5, y + 12.5);
      ctx.lineTo(x + 10, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    /* ---- sample legacy into particles ---- */
    sample() {
      const small = Math.min(this.W, 760);
      const S = small < 480 ? 5 : 4;                       // px grid step
      const cols = Math.floor(this.W / S), rows = Math.floor(this.H / S);
      const img = this.lc.getImageData(0, 0, this.W * this.dpr, this.H * this.dpr).data;
      const stride = this.W * this.dpr * 4;
      this.P = [];
      for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
        const x = gx * S + S / 2, y = gy * S + S / 2;
        const px = (x * this.dpr) | 0, py = (y * this.dpr) | 0;
        const o = py * stride + px * 4;
        const r = img[o], g = img[o + 1], b = img[o + 2];
        const lum = (r * .299 + g * .587 + b * .114);
        this.P.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, r, g, b, lum, a: 1, role: -1, sx: 0, sy: 0, dl: 0, du: 0 });
      }
    }

    /* ---- target graph geometry ---- */
    buildGraph() {
      const { x: cx, y: cy } = this.center;
      const R = Math.min(this.W, this.H) * .34;
      this.coreR = Math.min(this.W, this.H) * .085;
      this.nodes = NODE_LABELS.map((label, i) => {
        const a = -Math.PI / 2 + i / NODE_LABELS.length * Math.PI * 2;
        return { label, a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R,
                 r: Math.min(this.W, this.H) * .026 };
      });
      this.edges = [];
      this.nodes.forEach((n, i) => {
        this.edges.push([n, { x: cx, y: cy }]);                       // spoke to core
        this.edges.push([n, this.nodes[(i + 1) % this.nodes.length]]); // ring
      });
    }

    /* ---- assign particles to targets (brightest → structure) ---- */
    assign() {
      const { x: cx, y: cy } = this.center;
      const targets = [];
      // iris ring
      const irisN = 150;
      for (let i = 0; i < irisN; i++) {
        const a = i / irisN * Math.PI * 2;
        targets.push({ x: cx + Math.cos(a) * this.coreR, y: cy + Math.sin(a) * this.coreR });
      }
      // node disks
      this.nodes.forEach(n => {
        for (let i = 0; i < 92; i++) {
          const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * n.r;
          targets.push({ x: n.x + Math.cos(a) * rr, y: n.y + Math.sin(a) * rr });
        }
      });
      // edge beads
      this.edges.forEach(([a, b]) => {
        const mx = (a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * .28;
        const my = (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * .28;
        for (let i = 0; i < 34; i++) {
          const t = i / 33;
          const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * b.x;
          const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * b.y;
          targets.push({ x, y });
        }
      });
      const order = this.P.map((p, i) => i).sort((i, j) => this.P[j].lum - this.P[i].lum);
      const n = Math.min(targets.length, order.length);
      for (let k = 0; k < n; k++) {
        const p = this.P[order[k]], t = targets[k];
        p.role = 1; p.tx = t.x; p.ty = t.y;
        p.dl = Math.random() * 340; p.du = rand(700, 1200);
      }
      // controlled scatter point — explode outward but stay framed
      const mg = 8;
      for (const p of this.P) {
        const dx = p.ox - cx, dy = p.oy - cy, d = Math.hypot(dx, dy) || 1;
        const rr = d * rand(.32, .64) + rand(8, 40);     // stay a dense mass
        let sx = cx + dx / d * rr + rand(-22, 22);
        let sy = cy + dy / d * rr + rand(-22, 22);
        p.scx = clamp(sx, mg, this.W - mg);
        p.scy = clamp(sy, mg, this.H - mg);
        p.phi = Math.random() * 6.283;
      }
    }

    phase(t) { const P = this.PH; for (let i = P.length - 1; i >= 0; i--) if (t >= P[i]) return i; return 0; }

    loop(now) {
      if (!this.running) return;
      requestAnimationFrame(this.loop.bind(this));
      if (this._pause) return;
      let t = now - this.t0;
      const total = this.PH[6];
      if (t >= total) { this.t0 = now; t = 0; }
      const ph = this.phase(t);
      const c = this.cx, W = this.W, H = this.H;
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#070708'; c.fillRect(0, 0, W, H);

      if (ph <= 1) {                                   // P0 record · P1 see
        this.drawLegacy(t / 2400);
        c.drawImage(this.lg, 0, 0, this.lg.width, this.lg.height, 0, 0, W, H);
        const clk = ((t / 600) % 1) < .16 ? ((t / 600) % 1) / .16 : 0;
        this.drawCursor(c, clk);
        if (ph === 1) {                                // the "seeing" iris sweep
          const p = (t - this.PH[1]) / (this.PH[2] - this.PH[1]);
          const rad = p * Math.hypot(W, H) * .62;
          const g = c.createRadialGradient(this.cursor.x, this.cursor.y, Math.max(0, rad - 60),
            this.cursor.x, this.cursor.y, rad);
          g.addColorStop(0, 'rgba(205,245,100,0)');
          g.addColorStop(.82, 'rgba(205,245,100,0)');
          g.addColorStop(.92, 'rgba(205,245,100,.5)');
          g.addColorStop(1, 'rgba(205,245,100,0)');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.strokeStyle = `rgba(230,255,138,${.5 * (1 - p)})`; c.lineWidth = 2;
          c.beginPath(); c.arc(this.cursor.x, this.cursor.y, rad, 0, 7); c.stroke();
        }
        this.setCap(ph === 0 ? 'Recording the work…' : 'Seeing the pattern…', ph === 1);
        return;
      }

      // ---- P2+ : particles ----
      const P2s = this.PH[2], P3s = this.PH[3], P4s = this.PH[4];
      const sp = clamp((t - P2s) / (P3s - P2s), 0, 1);   // scatter progress over P2
      const e2 = easeOutCubic(sp);
      const tb = t * 0.004;

      if (ph >= 3 && !this.snapped) {                    // freeze where the cloud is
        for (const p of this.P) { p.sx = p.x; p.sy = p.y; }
        this.snapped = true;
      }
      if (ph === 2) this.snapped = false;

      // legacy ghost dissolves through the first half of P2
      if (ph === 2) {
        c.globalAlpha = .5 * (1 - clamp(sp / .55, 0, 1));
        c.drawImage(this.lg, 0, 0, this.lg.width, this.lg.height, 0, 0, W, H);
        c.globalAlpha = 1;
        const pre = clamp((sp - .55) / .45, 0, 1);       // core warms up — no dead beat
        if (pre > 0) {
          const g = c.createRadialGradient(this.center.x, this.center.y, 0,
            this.center.x, this.center.y, Math.min(W, H) * .42);
          g.addColorStop(0, `rgba(205,245,100,${.14 * pre})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
        }
      }

      const fp = ph >= 4 ? 1 : ph === 3 ? clamp((t - P3s) / (P4s - P3s), 0, 1) : 0;
      if (fp > 0) this.drawNet(c, fp, t);                // edges + iris under particles

      for (const p of this.P) {
        const cxx = this.center.x, cyy = this.center.y;
        if (ph === 2) {                                  // screen → dense swirling dust
          const bx = lerp(p.ox, p.scx, e2), by = lerp(p.oy, p.scy, e2);
          const rd = Math.hypot(bx - cxx, by - cyy);
          const ang = Math.atan2(by - cyy, bx - cxx) + e2 * .55;
          p.x = cxx + Math.cos(ang) * rd + Math.sin(tb + p.phi) * 5 * e2;
          p.y = cyy + Math.sin(ang) * rd + Math.cos(tb + p.phi) * 5 * e2;
          c.globalAlpha = p.role === 1 ? .96 : .86;
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(p.x - 1.3, p.y - 1.3, 2.6, 2.6);
        } else if (p.role === 1) {                       // dust → the brain
          const pr = clamp((t - P3s - p.dl) / p.du, 0, 1), e = easeOutExpo(pr);
          p.x = lerp(p.sx, p.tx, e); p.y = lerp(p.sy, p.ty, e);
          const cr = lerp(p.r, 205, e), cg = lerp(p.g, 245, e), cb = lerp(p.b, 100, e);
          c.globalAlpha = lerp(.9, .85, e);
          c.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
          c.fillRect(p.x - 1.2, p.y - 1.2, 2.3, 2.3);
        } else {                                         // ash spirals into the core
          const k = clamp((t - P3s) / 720, 0, 1);
          if (k >= 1) continue;
          const e = easeOutCubic(k);
          const rd = Math.hypot(p.sx - cxx, p.sy - cyy) * (1 - e);
          const ang = Math.atan2(p.sy - cyy, p.sx - cxx) + e * 1.4;
          p.x = cxx + Math.cos(ang) * rd; p.y = cyy + Math.sin(ang) * rd;
          c.globalAlpha = (1 - k) * .5;
          c.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          c.fillRect(p.x - 1, p.y - 1, 2.1, 2.1);
        }
      }
      c.globalAlpha = 1;
      if (fp >= 1) this.drawLabels(c, t);
      this.setCap(ph === 2 ? 'Breaking it out of the old software…'
        : ph === 3 ? 'Generating skills…'
        : 'The brain runs it — with you in the loop.', ph >= 3);
    }

    drawNet(c, fp, t) {
      const { x: cx, y: cy } = this.center;
      // soft brain glow
      const gl = c.createRadialGradient(cx, cy, 0, cx, cy, Math.min(this.W, this.H) * .5);
      gl.addColorStop(0, `rgba(205,245,100,${.10 * fp})`);
      gl.addColorStop(.5, `rgba(120,200,80,${.05 * fp})`);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gl; c.fillRect(0, 0, this.W, this.H);
      // edges
      c.lineWidth = 1;
      this.edges.forEach(([a, b], i) => {
        const mx = (a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * .28;
        const my = (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * .28;
        c.strokeStyle = `rgba(205,245,100,${.16 * fp})`;
        c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(mx, my, b.x, b.y); c.stroke();
        if (fp >= 1) {                                   // pulse flowing toward the core
          const pp = ((t / 1700 + i * .12) % 1);
          const x = (1 - pp) ** 2 * a.x + 2 * (1 - pp) * pp * mx + pp * pp * b.x;
          const y = (1 - pp) ** 2 * a.y + 2 * (1 - pp) * pp * my + pp * pp * b.y;
          c.fillStyle = '#e6ff8a';
          c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill();
        }
      });
      // iris core
      const blink = (t % 5200) > 5040 ? clamp(1 - ((t % 5200) - 5040) / 80, .12, 1) : 1;
      const R = this.coreR;
      const ir = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      ir.addColorStop(0, `rgba(230,255,138,${.95 * fp})`);
      ir.addColorStop(.32, `rgba(205,245,100,${.5 * fp})`);
      ir.addColorStop(1, 'rgba(10,12,8,0)');
      c.fillStyle = ir; c.beginPath(); c.arc(cx, cy, R * 1.5, 0, 7); c.fill();
      c.strokeStyle = `rgba(205,245,100,${.7 * fp})`; c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      c.beginPath(); c.arc(cx, cy, R * .62, 0, 7); c.stroke();
      c.save(); c.translate(cx, cy); c.scale(1, blink);
      c.fillStyle = `rgba(8,12,6,${fp})`;
      c.beginPath(); c.arc(0, 0, R * .42, 0, 7); c.fill();
      c.fillStyle = `rgba(230,255,138,${fp})`;
      c.beginPath(); c.arc(0, 0, R * .17, 0, 7); c.fill();
      c.restore();
      // node rings
      this.nodes.forEach(n => {
        c.strokeStyle = `rgba(205,245,100,${.55 * fp})`; c.lineWidth = 1.2;
        c.beginPath(); c.arc(n.x, n.y, n.r, 0, 7); c.stroke();
        c.fillStyle = `rgba(205,245,100,${.14 * fp})`;
        c.beginPath(); c.arc(n.x, n.y, n.r, 0, 7); c.fill();
      });
    }

    drawLabels(c, t) {
      const { x: cx } = this.center;
      c.font = '500 11px "Geist Mono",monospace';
      this.nodes.forEach((n, i) => {
        const a = clamp((t - this.PH[4] - i * 90) / 360, 0, 1);
        if (a <= 0) return;
        const right = n.x >= cx;
        c.textAlign = right ? 'left' : 'right';
        c.textBaseline = 'middle';
        const lx = n.x + (right ? n.r + 9 : -n.r - 9);
        c.fillStyle = `rgba(164,162,154,${a})`;
        c.fillText(n.label, lx, n.y);
      });
      c.textAlign = 'left';
    }

    setCap(txt, live) {
      if (this._cap === txt) return; this._cap = txt;
      this.cap.textContent = txt; this.cap.classList.toggle('live', !!live);
    }

    renderStatic() {                                   // reduced-motion: final state
      const c = this.cx;
      c.clearRect(0, 0, this.W, this.H);
      c.fillStyle = '#070708'; c.fillRect(0, 0, this.W, this.H);
      c.globalAlpha = .12;
      c.drawImage(this.lg, 0, 0, this.lg.width, this.lg.height, 0, 0, this.W, this.H);
      c.globalAlpha = 1;
      this.drawNet(c, 1, 4200);
      this.drawLabels(c, this.PH ? this.PH[4] + 2000 : 9999);
      this.setCap('Recording → skills → the company brain.', true);
    }

    pause(p) { this._pause = p; if (!p) this.t0 = performance.now() - 1; }
    replay() { this.t0 = performance.now(); this._burst = false; this.snapped = false;
      if (RM) this.renderStatic(); }
  }

  const sc = $('#scene');
  if (sc) {
    const scene = new Scene(sc, $('#sceneCaption'));
    $('#sceneReplay')?.addEventListener('click', () => scene.replay());
    if (!RM) {
      new IntersectionObserver(es => scene.pause(!es[0].isIntersecting), { threshold: .08 })
        .observe(sc.parentElement);
      document.addEventListener('visibilitychange', () => scene.pause(document.hidden));
    }
  }

  /* ============================================================
     BRAIN CANVAS — calmer always-living graph (the end state)
     ============================================================ */
  const bc = $('#brainCanvas');
  if (bc) {
    const ctx = bc.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
    let W, H, nodes, run = false, raf;
    const size = () => {
      const r = bc.parentElement.getBoundingClientRect(); if (!r.width) return;
      W = r.width; H = r.height; bc.width = W * dpr; bc.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const R = Math.min(W, H) * .36;
      nodes = Array.from({ length: 9 }, (_, i) => {
        const a = i / 9 * Math.PI * 2;
        return { a, r: R, x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R };
      });
    };
    const frame = (t) => {
      if (!run) return; raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, rot = t / 14000;
      const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * .5);
      gl.addColorStop(0, 'rgba(205,245,100,.12)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      nodes.forEach((n, i) => {
        const a = n.a + rot, R = n.r + Math.sin(t / 1100 + i) * 6;
        n.x = cx + Math.cos(a) * R; n.y = cy + Math.sin(a) * R;
      });
      ctx.lineWidth = 1;
      nodes.forEach((n, i) => {
        ctx.strokeStyle = 'rgba(205,245,100,.16)';
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(cx, cy); ctx.stroke();
        const m = nodes[(i + 1) % nodes.length];
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        const pp = (t / 2000 + i * .11) % 1;
        ctx.fillStyle = '#e6ff8a';
        ctx.beginPath(); ctx.arc(lerp(n.x, cx, pp), lerp(n.y, cy, pp), 1.7, 0, 7); ctx.fill();
      });
      nodes.forEach(n => {
        ctx.fillStyle = 'rgba(205,245,100,.5)';
        ctx.beginPath(); ctx.arc(n.x, n.y, 3.4, 0, 7); ctx.fill();
      });
      const cr = Math.min(W, H) * .1;
      const ir = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 1.6);
      ir.addColorStop(0, 'rgba(230,255,138,.95)'); ir.addColorStop(.35, 'rgba(205,245,100,.45)');
      ir.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ir; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(205,245,100,.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.stroke();
      const bl = (t % 5600) > 5440 ? clamp(1 - ((t % 5600) - 5440) / 90, .1, 1) : 1;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, bl);
      ctx.fillStyle = '#080c06'; ctx.beginPath(); ctx.arc(0, 0, cr * .44, 0, 7); ctx.fill();
      ctx.fillStyle = '#e6ff8a'; ctx.beginPath(); ctx.arc(0, 0, cr * .18, 0, 7); ctx.fill();
      ctx.restore();
    };
    size(); new ResizeObserver(size).observe(bc.parentElement);
    const draw1 = () => { run = true; frame(performance.now()); run = false; cancelAnimationFrame(raf); };
    if (RM) { draw1(); }
    else new IntersectionObserver(es => {
      if (es[0].isIntersecting && !run) { run = true; raf = requestAnimationFrame(frame); }
      else if (!es[0].isIntersecting && run) { run = false; cancelAnimationFrame(raf); }
    }, { threshold: .1 }).observe(bc);
  }
})();
