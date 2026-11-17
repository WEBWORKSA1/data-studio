/* Data.Studio core: layout, forms, consent, embeds, data helpers */
(function () {
  'use strict';
  var body = document.body;
  var ROOT = body.getAttribute('data-root') || './';
  var CFG = window.DS_CONFIG || {};
  var LOGO = '<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0A0F1F"/><rect x="7" y="16" width="4" height="9" rx="1.5" fill="#12C29B"/><rect x="14" y="10" width="4" height="15" rx="1.5" fill="#8C8CFF"/><rect x="21" y="6" width="4" height="19" rx="1.5" fill="#FFB020"/></svg>';

  var NAV = [
    ['tools/index.html', 'Tools'],
    ['chart-guide.html', 'Chart Guide'],
    ['datasets.html', 'Datasets'],
    ['live.html', 'Live Data'],
    ['learn.html', 'Learn'],
    ['guides/index.html', 'Guides'],
    ['contests.html', 'Contests'],
    ['support.html', 'Support']
  ];

  function p(path) { return ROOT + path; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function resolve(path) { var a = document.createElement('a'); a.href = p(path); return a.pathname; }
  function isActive(path) {
    var here = location.pathname.replace(/\/$/, '/index.html');
    var target = resolve(path);
    if (here === target) return true;
    if (/\/index\.html$/.test(path) && path.indexOf('/') > -1) {
      var dir = target.replace(/index\.html$/, '');
      return here.indexOf(dir) === 0;
    }
    return false;
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var links = NAV.map(function (n) {
      return '<a href="' + p(n[0]) + '"' + (isActive(n[0]) ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    el.className = 'site-header';
    el.innerHTML =
      '<div class="wrap nav-wrap">' +
      '<a class="logo" href="' + p('index.html') + '" aria-label="Data.Studio home">' + LOGO + '<span>Data<b>.</b>Studio</span></a>' +
      '<button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu"><span></span><span></span><span></span></button>' +
      '<nav id="nav-links" class="nav-links" aria-label="Main">' + links +
      '<a class="btn btn-sm btn-brand" href="' + p('services.html') + '">Hire Data Experts</a></nav></div>';
    var btn = el.querySelector('.nav-toggle');
    var nav = el.querySelector('.nav-links');
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Footer ---------- */
  function col(title, items) {
    return '<div><h4>' + title + '</h4><ul>' + items.map(function (i) {
      return '<li><a href="' + p(i[0]) + '">' + i[1] + '</a></li>';
    }).join('') + '</ul></div>';
  }
  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.className = 'site-footer';
    el.innerHTML =
      '<div class="wrap"><div class="foot-grid">' +
      '<div><a class="logo" href="' + p('index.html') + '">' + LOGO + '<span>Data<b>.</b>Studio</span></a>' +
      '<p>The free studio for working with data. Clean, convert, profile, chart and test your data right in the browser, with open datasets and live data that refreshes on its own.</p>' +
      '<form class="foot-news" data-ds-form="Newsletter" data-success="You\'re subscribed. Watch your inbox for The Data Brief.">' +
      '<label class="sr-only" for="fn-email">Email</label><input id="fn-email" type="email" name="email" placeholder="you@company.com" required>' +
      '<input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off">' +
      '<button class="btn btn-brand btn-sm" type="submit">Subscribe</button></form>' +
      '<p class="form-note" style="color:#7F88AA">The Data Brief: new tools, datasets and contest news. No spam, unsubscribe anytime.</p></div>' +
      col('Free tools', [['tools/chart-maker.html', 'Chart Maker'], ['tools/csv-json-converter.html', 'CSV ⇄ JSON'], ['tools/data-profiler.html', 'Data Profiler'], ['tools/pivot-table.html', 'Pivot Table'], ['tools/data-cleaner.html', 'Data Cleaner'], ['tools/ab-test-calculator.html', 'A/B Test Calculator'], ['tools/sample-size-calculator.html', 'Sample Size Calculator']]) +
      col('Explore', [['datasets.html', 'Open Datasets'], ['live.html', 'Live Data'], ['learn.html', 'Video Lessons'], ['guides/index.html', 'Guides'], ['chart-guide.html', 'Chart Guide'], ['glossary.html', 'Data Glossary']]) +
      col('Work with us', [['services.html', 'Hire Data Experts'], ['contests.html', 'Data Viz Challenge'], ['careers.html', 'Careers & Talent'], ['support.html', 'Support Us'], ['advertise.html', 'Advertise & Sponsor']]) +
      col('Company', [['about.html', 'About'], ['contact.html', 'Contact'], ['privacy.html', 'Privacy Policy'], ['terms.html', 'Terms of Use'], ['disclaimer.html', 'Disclaimer & Trademarks']]) +
      '</div><div class="foot-legal"><span>© <span data-year></span> Data.Studio. Independent website, not affiliated with Google LLC. "Data Studio" and "Looker" are trademarks of Google LLC. <a href="' + p('disclaimer.html') + '">Trademark notice</a>.</span>' +
      '<span>Built for people who work with data.</span></div></div>';
  }

  /* ---------- Forms (hidden recipient) ---------- */
  function endpoint() {
    if (CFG.formAlias) return 'https://formsubmit.co/ajax/' + CFG.formAlias;
    var u = String.fromCharCode(119, 101, 98, 119, 111, 114, 107, 115, 97, 49);
    return 'https://formsubmit.co/ajax/' + u + String.fromCharCode(64) + ['gmail', 'com'].join('.');
  }
  function showError(form, msg) {
    var e = form.querySelector('.form-error');
    if (!e) { e = document.createElement('div'); e.className = 'form-error'; e.setAttribute('role', 'alert'); form.appendChild(e); }
    e.textContent = msg;
  }
  function submitForm(form) {
    var hp = form.querySelector('[name="_honey"]');
    if (hp && hp.value) return;
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (k === '_honey') return;
      if (typeof v !== 'string') return;
      data[k] = data[k] ? data[k] + ', ' + v : v;
    });
    var kind = form.getAttribute('data-ds-form') || 'Form';
    data._subject = 'Data.Studio | ' + kind + (data.name ? ' | ' + data.name : '');
    data._template = 'table';
    data._captcha = 'false';
    data.form_type = kind;
    data.page = location.href;
    data.submitted_at = new Date().toISOString();
    if (data.email) data._replyto = data.email;
    var btn = form.querySelector('[type="submit"]');
    var label = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    var old = form.querySelector('.form-error'); if (old) old.remove();
    fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return { success: r.ok ? 'true' : 'false' }; }); })
      .then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'Submission failed');
        var msg = form.getAttribute('data-success') || 'Thank you! Your message has been received. We usually reply within 1–2 business days.';
        var box = document.createElement('div');
        box.className = 'form-success';
        box.setAttribute('role', 'status');
        box.innerHTML = '<strong>Received ✓</strong>' + esc(msg);
        form.replaceWith(box);
        try { localStorage.setItem('ds-lead', '1'); } catch (e) {}
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        showError(form, 'Sorry, something went wrong sending your message. Please try again in a moment.');
      });
  }
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches || !form.matches('form[data-ds-form]')) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    submitForm(form);
  });

  /* ---------- Multi-step forms ---------- */
  function initSteps() {
    document.querySelectorAll('form[data-steps]').forEach(function (form) {
      var steps = form.querySelectorAll('.step');
      var bar = form.querySelector('.steps-bar i');
      var i = 0;
      function show(n) {
        steps.forEach(function (s, k) { s.classList.toggle('active', k === n); });
        if (bar) bar.style.width = Math.round(((n + 1) / steps.length) * 100) + '%';
        i = n;
      }
      function valid(step) {
        var ok = true;
        step.querySelectorAll('input,select,textarea').forEach(function (f) {
          if (ok && !f.checkValidity()) { f.reportValidity(); ok = false; }
        });
        return ok;
      }
      form.addEventListener('click', function (e) {
        var t = e.target.closest('[data-next],[data-prev]');
        if (!t) return;
        e.preventDefault();
        if (t.hasAttribute('data-next')) { if (valid(steps[i]) && i < steps.length - 1) show(i + 1); }
        else if (i > 0) show(i - 1);
        var top = form.getBoundingClientRect().top + window.scrollY - 100;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
      });
      show(0);
    });
  }

  /* ---------- Prefill from query (?service=…&plan=…) ---------- */
  function prefill() {
    var q = new URLSearchParams(location.search);
    q.forEach(function (v, k) {
      document.querySelectorAll('form [name="' + k.replace(/"/g, '') + '"]').forEach(function (f) {
        if (f.type === 'radio' || f.type === 'checkbox') { if (f.value === v) f.checked = true; }
        else if (!f.value) f.value = v;
      });
    });
  }

  /* ---------- Cookie notice ---------- */
  function cookie() {
    var key = 'ds-consent';
    try { if (localStorage.getItem(key)) return; } catch (e) { return; }
    var d = document.createElement('div');
    d.className = 'cookie';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Cookie notice');
    d.innerHTML = '<p>We use cookies for essential site functions and, through Google AdSense, to show ads that keep our tools free. See our <a href="' + p('privacy.html') + '">Privacy Policy</a>.</p>' +
      '<button class="btn btn-sm btn-light" data-c="ok">Accept</button><button class="btn btn-sm btn-outline-light" data-c="min">Essential only</button>';
    d.addEventListener('click', function (e) {
      var c = e.target.getAttribute('data-c');
      if (!c) return;
      try { localStorage.setItem(key, c); } catch (err) {}
      d.remove();
    });
    document.body.appendChild(d);
  }
  try {
    if (localStorage.getItem('ds-consent') === 'min') {
      (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
    }
  } catch (e) {}

  /* ---------- YouTube lite embeds ---------- */
  function ytThumb(el) {
    var id = el.getAttribute('data-id');
    if (!id || el.getAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    el.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg)';
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Play video');
  }
  function initYT(scope) {
    (scope || document).querySelectorAll('.yt[data-id]').forEach(ytThumb);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.yt[data-id]');
    if (!el || el.querySelector('iframe')) return;
    var id = encodeURIComponent(el.getAttribute('data-id'));
    el.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(el.getAttribute('data-title') || 'Video') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  });

  /* ---------- Sticky CTA (tool pages) ---------- */
  function stickyCTA() {
    var el = document.querySelector('.sticky-cta');
    if (!el) return;
    try { if (sessionStorage.getItem('ds-cta-x') || localStorage.getItem('ds-lead')) return; } catch (e) {}
    var shown = false;
    window.addEventListener('scroll', function () {
      if (!shown && window.scrollY > 700) { el.classList.add('show'); shown = true; }
    }, { passive: true });
    var x = el.querySelector('.x');
    if (x) x.addEventListener('click', function () {
      el.classList.remove('show');
      try { sessionStorage.setItem('ds-cta-x', '1'); } catch (e) {}
    });
  }

  /* ---------- Data helpers ---------- */
  var bust = Math.floor(Date.now() / 600000);
  function getJSON(name) {
    return fetch(p('data/' + name + '.json?v=' + bust)).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function fmtNum(n, d) {
    if (n == null || isNaN(n)) return '—';
    var abs = Math.abs(n);
    if (d == null) d = abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtBig(n) {
    if (n == null || isNaN(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return fmtNum(n);
  }
  function ago(iso) {
    var t = new Date(iso).getTime();
    if (!t) return '';
    var s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    var d = Math.round(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }
  function updatedStamp() {
    var els = document.querySelectorAll('[data-updated]');
    if (!els.length) return;
    getJSON('meta').then(function (m) {
      els.forEach(function (el) {
        el.textContent = m.updatedAt ? 'Data refreshed ' + ago(m.updatedAt) + ' · ' + new Date(m.updatedAt).toUTCString().replace(' GMT', ' UTC') : 'Data refresh pending';
      });
    }).catch(function () {});
  }

  window.DS = { root: ROOT, p: p, esc: esc, getJSON: getJSON, fmtNum: fmtNum, fmtBig: fmtBig, ago: ago, initYT: initYT, config: CFG };

  /* ---------- Boot ---------- */
  renderHeader();
  renderFooter();
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  initSteps();
  prefill();
  initYT();
  stickyCTA();
  updatedStamp();
  cookie();
})();
