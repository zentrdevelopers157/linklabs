(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const yearEl = $('#yr'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = $('#nav');
  if (nav) {
    const navScroll = () => nav.classList.toggle('scrolled', scrollY > 16);
    addEventListener('scroll', navScroll, { passive: true }); navScroll();
    const burger = $('#burger');
    if (burger) burger.addEventListener('click', () => nav.classList.toggle('open'));
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -36px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  const toastEl = $('#toast'); let toastT;
  const toast = m => { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2800); };

  if ($$('.prof-row').length && $('.sheet')) {
  const PROF = {
    frame:   { part:'Sliding Window Frame', series:'FT-80', wt:'2.1 kg/m', scale:'1 : 1', rev:'C' },
    sash:    { part:'Casement Sash',        series:'FT-55', wt:'1.6 kg/m', scale:'1 : 1', rev:'A' },
    mullion: { part:'Curtain-Wall Mullion', series:'CW-100', wt:'3.4 kg/m', scale:'1 : 2', rev:'B' },
    tube:    { part:'Round Tube',           series:'TB-30', wt:'0.9 kg/m', scale:'1 : 1', rev:'D' },
    custom:  { part:'Custom Profile',       series:'FT-··',  wt:'—',        scale:'TBD',  rev:'RFQ' }
  };
  const rows = $$('.prof-row'), sheets = $$('.sheet svg');
  const tb = k => $('#tb-' + k);
  function setSheet(key) {
    rows.forEach(r => r.classList.toggle('on', r.dataset.p === key));
    sheets.forEach(s => s.classList.toggle('on', s.dataset.p === key));
    const d = PROF[key];
    tb('part').textContent = d.part; tb('series').textContent = d.series;
    tb('wt').textContent = d.wt; tb('scale').textContent = d.scale; tb('rev').textContent = d.rev;
  }
  rows.forEach(r => {
    r.addEventListener('click', () => setSheet(r.dataset.p));
    r.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) setSheet(r.dataset.p); });
  });
  setSheet('frame');

  }

  const proc = $('#process');
  if (proc) {
  const clipR = $('#bclipr'), head = $('#phead'), pct = $('#st-pct'), bar = $('#st-bar');
  const nodes = $$('.pnode');
  const sNum = $('#st-num'), sTit = $('#st-title'), sDes = $('#st-desc');
  const STAGES = [
    { th: 0,   n: '01', t: 'BILLET',     d: '6063-T5 aluminium billets — homogenized, checked and cut to press length. A mill certificate follows every lot.' },
    { th: .14, n: '02', t: 'DIE',        d: 'Your cross-section becomes a hardened steel die. 500+ existing dies for stock series, or custom-machined to your drawing in 10–15 days.' },
    { th: .34, n: '03', t: 'EXTRUDE',    d: 'Heated to 480°C and pushed through the die in one continuous stroke — up to 12 m lengths, straightened and cooled on the run-out table.' },
    { th: .56, n: '04', t: 'FINISH',     d: 'Anodized, powder-coated, electrophoretic or woodgrain. Color samples are matched and approved before a single meter goes into production.' },
    { th: .78, n: '05', t: 'QC',         d: 'Wall thickness, dimension, hardness and surface checked against the drawing — piece by piece, to GB/T 5237.' },
    { th: .94, n: '06', t: 'PACK & SHIP',d: 'Paper-wrapped, film-protected, containerized at Nansha or Yantian. LCL or FCL — delivered to your port or your door.' }
  ];
  let curStage = 0;
  function setStage(i) {
    if (i === curStage) return; curStage = i;
    const s = STAGES[i], box = $('.stage-txt');
    box.classList.add('sw');
    setTimeout(() => {
      sNum.textContent = s.n; sTit.textContent = s.t; sDes.textContent = s.d;
      box.classList.remove('sw');
    }, 170);
  }
  function procScroll() {
    const r = proc.getBoundingClientRect();
    const total = proc.offsetHeight - innerHeight;
    const p = Math.max(0, Math.min(1, -r.top / (total || 1)));
    const c = Math.max(0, Math.min(1, (p - .18) / .78));
    clipR.setAttribute('width', (636 * c).toFixed(1));
    head.setAttribute('transform', 'translate(' + (244 + 636 * c).toFixed(1) + ' 0)');
    head.style.opacity = c > .01 ? 1 : 0;
    pct.textContent = String(Math.round(c * 100)).padStart(2, '0') + '%';
    bar.style.width = (c * 100).toFixed(1) + '%';
    nodes.forEach((n, i) => n.classList.toggle('on', p >= STAGES[i].th));
    let idx = 0; STAGES.forEach((s, i) => { if (p >= s.th) idx = i; });
    setStage(idx);
  }
  let tick = false;
  const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(() => { procScroll(); tick = false; }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  procScroll();

  }

  if ($('#finstrip')) {
  const FINC = [
    'Silver — clear anodized, 12 µm satin. The architectural default.',
    'Champagne — the bestseller. Warm metallic, anodized or powder-matched.',
    'Bronze — deep bronze for premium facades and interiors.',
    'Black — matte black, the modern minimal frame.',
    'White — powder coat, RAL 9016 matched to sample.',
    'Anthracite — RAL 7016, the European window standard.',
    'Woodgrain — sublimated oak & walnut. Timber looks, aluminum duty cycles.'
  ];
  $$('#finstrip .fin').forEach(b => {
    const show = () => $('#fincap').textContent = FINC[+b.dataset.i];
    b.addEventListener('mouseenter', show);
    b.addEventListener('click', show);
  });

  }

  const MAIL = '984598518@qq.com';
  const copyMail = $('#copyMail');
  if (copyMail) {
  $('#copyMail').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(MAIL); toast('Email copied — ' + MAIL); }
    catch {
      const t = document.createElement('textarea'); t.value = MAIL;
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); toast('Email copied — ' + MAIL); } catch { toast(MAIL); }
      t.remove();
    }
  });

  }

  const qform = $('#qform');
  if (qform) {
  $('#qform').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, el = n => f.elements[n];
    const name = el('name').value.trim(), email = el('email').value.trim(), msg = el('message').value.trim();
    const bad = [];
    const mark = (n, ok) => { el(n).closest('.fld').classList.toggle('err', !ok); if (!ok) bad.push(el(n)); };
    mark('name', !!name);
    mark('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
    mark('message', !!msg);
    if (bad.length) { toast('Please complete the highlighted fields.'); bad[0].focus(); return; }
    const subject = '[FT-Aluminum] ' + el('interest').value + ' — ' + name;
    const body = 'Name: ' + name + '\nCompany: ' + (el('company').value.trim() || '—') +
      '\nEmail: ' + email + '\nInterest: ' + el('interest').value + '\nVolume: ' + el('volume').value +
      '\n\nMessage:\n' + msg + '\n\n— sent from the Frank Tan profiles site';
    location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    toast('Opening your email app — we reply within 24 h.');
  });
  $$('#qform input, #qform textarea').forEach(i =>
    i.addEventListener('input', () => i.closest('.fld').classList.remove('err')));

  }

  const reel = $('#reel');
  if (reel) {
    const cap = $('#film-cap'), ftBox = $('#film-text'), ftNum = $('#ft-num'), ftLine = $('#ft-line');
    const FILM_TEXT = {
      extrude:   [ {t:.4, n:'01', s:'480°C'}, {t:3.0, n:'02', s:'ONE CONTINUOUS STROKE'}, {t:5.6, n:'03', s:'COOLED · STRAIGHTENED · CUT'} ],
      finish:    [ {t:.4, n:'01', s:'±0.1 MM'}, {t:3.0, n:'02', s:'CHANNELS · HOLES · LENGTHS'}, {t:5.6, n:'03', s:'READY FOR ASSEMBLY'} ],
      warehouse: [ {t:.4, n:'01', s:'500+ DIES'}, {t:3.0, n:'02', s:'ONE WAREHOUSE · ONE INVOICE'}, {t:5.6, n:'03', s:'ONE CONTAINER · WORLDWIDE'} ]
    };
    let curKey = 'extrude', curLine = -1, ftRAF = 0;
    function setFilmText(n, s) {
      ftNum.textContent = n; ftLine.textContent = s;
      ftBox.classList.remove('go'); void ftBox.offsetWidth; ftBox.classList.add('go');
    }
    function filmTick() {
      const lines = FILM_TEXT[curKey] || [];
      let idx = -1;
      for (let i = 0; i < lines.length; i++) if (reel.currentTime >= lines[i].t) idx = i;
      if (idx !== curLine) { curLine = idx; if (idx >= 0) setFilmText(lines[idx].n, lines[idx].s); else ftBox.classList.remove('go'); }
      ftRAF = reel.paused ? 0 : requestAnimationFrame(filmTick);
    }
    reel.addEventListener('play', () => { if (!ftRAF) ftRAF = requestAnimationFrame(filmTick); });
    $$('.film-btn').forEach(b => b.addEventListener('click', () => {
      $$('.film-btn').forEach(x => x.classList.toggle('on', x === b));
      cap.textContent = b.dataset.cap;
      curKey = b.dataset.key; curLine = -1;
      reel.style.opacity = 0;
      setTimeout(() => {
        reel.poster = b.dataset.poster;
        reel.src = b.dataset.src;
        reel.style.opacity = 1;
        reel.play().catch(() => {});
      }, 250);
    }));
    new IntersectionObserver(en => {
      en[0].isIntersecting ? reel.play().catch(() => {}) : reel.pause();
    }, { threshold: .25 }).observe(reel);
  }

  const stage = $('#stage');
  if (stage) {
    setTimeout(() => {
      if (!window.__FT3D) {
        $('#stage-loading')?.classList.add('done');
        $('#gl-fb')?.classList.add('show');
        document.querySelector('.stage-ctl')?.classList.add('hide');
      }
    }, 7000);
  }

  const heroSec = document.querySelector('#hero');
  if (heroSec && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const stg = document.getElementById('stage');
    const mark = document.querySelector('.hero-mark');
    let hp = false;
    addEventListener('scroll', () => {
      if (hp) return; hp = true;
      requestAnimationFrame(() => {
        const r = heroSec.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, -r.top / (r.height || 1)));
        if (stg) stg.style.transform = p > 0 ? 'translateY(' + (70 * p).toFixed(1) + 'px) scale(' + (1 - p * .06).toFixed(3) + ')' : '';
        if (mark) mark.style.transform = p > 0 ? 'translateY(' + (-55 * p).toFixed(1) + 'px)' : '';
        hp = false;
      });
    }, { passive: true });
  }

  const statBs = $$('.stat b');
  if (statBs.length) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; sio.unobserve(e.target);
      const b = e.target;
      const num = parseInt(b.textContent, 10);
      const suf = b.querySelector('i');
      const s = suf ? suf.outerHTML : '';
      if (isNaN(num) || num < 5) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { b.innerHTML = num + s; return; }
      const t0 = performance.now(), dur = 950;
      (function cnt(t) {
        const k = Math.min(1, (t - t0) / dur);
        b.innerHTML = Math.round(num * (1 - Math.pow(1 - k, 3))) + s;
        if (k < 1) requestAnimationFrame(cnt); else b.innerHTML = num + s;
      })(t0);
    }), { threshold: .6 });
    statBs.forEach(b => sio.observe(b));
  }

})();
