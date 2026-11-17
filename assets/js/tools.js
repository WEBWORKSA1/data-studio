/* Data.Studio shared tool utilities (requires PapaParse for CSV) */
(function () {
  'use strict';
  var T = {};

  T.parse = function (text, opts) {
    opts = opts || {};
    var res = Papa.parse(String(text || '').trim(), {
      header: opts.header !== false,
      skipEmptyLines: opts.skipEmpty === false ? false : 'greedy',
      dynamicTyping: opts.typed !== false,
      delimiter: opts.delimiter || ''
    });
    var fields = (res.meta && res.meta.fields) || [];
    fields = fields.map(function (f, i) { return f === '' || f == null ? 'column_' + (i + 1) : f; });
    return { rows: res.data, fields: fields, errors: res.errors || [], delimiter: res.meta && res.meta.delimiter };
  };

  T.isNum = function (v) { return typeof v === 'number' && isFinite(v); };
  T.toNum = function (v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v == null) return null;
    var s = String(v).replace(/[$€£₹,%\s]/g, '');
    if (s === '' || isNaN(s)) return null;
    return Number(s);
  };
  T.isEmpty = function (v) { return v == null || (typeof v === 'string' && v.trim() === ''); };

  T.download = function (name, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  T.copy = function (text, btn) {
    var done = function () { if (btn) { var t = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = t; }, 1400); } };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  };

  T.table = function (rows, fields, limit) {
    limit = limit || 200;
    var esc = window.DS ? DS.esc : function (s) { return s; };
    var h = '<table class="data"><thead><tr>' + fields.map(function (f) { return '<th>' + esc(f) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.slice(0, limit).forEach(function (r) {
      h += '<tr>' + fields.map(function (f) {
        var v = r[f];
        return '<td' + (T.isNum(v) ? ' class="num"' : '') + '>' + esc(v == null ? '' : v) + '</td>';
      }).join('') + '</tr>';
    });
    h += '</tbody></table>';
    if (rows.length > limit) h += '<p class="form-note" style="padding:8px 12px">Showing first ' + limit + ' of ' + rows.length.toLocaleString() + ' rows.</p>';
    return h;
  };

  /* Wire a dropzone (.dropzone containing input[type=file]) to a textarea */
  T.dropzone = function (zone, textarea, onLoad) {
    var input = zone.querySelector('input[type=file]');
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('drag'); }); });
    function read(file) {
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) { alert('Files up to 25 MB work best in the browser.'); }
      var r = new FileReader();
      r.onload = function () { textarea.value = r.result; if (onLoad) onLoad(file); };
      r.readAsText(file);
    }
    zone.addEventListener('drop', function (e) { read(e.dataTransfer.files[0]); });
    input.addEventListener('change', function () { read(input.files[0]); });
  };

  T.stats = function (nums) {
    var a = nums.slice().sort(function (x, y) { return x - y; });
    var n = a.length;
    if (!n) return null;
    var sum = 0; a.forEach(function (v) { sum += v; });
    var mean = sum / n;
    var sq = 0; a.forEach(function (v) { sq += (v - mean) * (v - mean); });
    var q = function (pq) { var pos = (n - 1) * pq, lo = Math.floor(pos), hi = Math.ceil(pos); return a[lo] + (a[hi] - a[lo]) * (pos - lo); };
    return { n: n, sum: sum, mean: mean, min: a[0], max: a[n - 1], median: q(0.5), q1: q(0.25), q3: q(0.75), std: n > 1 ? Math.sqrt(sq / (n - 1)) : 0, sorted: a };
  };

  /* Normal distribution helpers */
  T.normCdf = function (z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989422804014327 * Math.exp(-z * z / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? 1 - p : p;
  };
  T.normInv = function (p) {
    if (p <= 0 || p >= 1) return NaN;
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
    var b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    var c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    var d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    var pl = 0.02425, q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };

  T.palettes = {
    studio: ['#5B5BF7', '#12C29B', '#FFB020', '#F2557A', '#2BB0ED', '#8E6CF0', '#7ACC29', '#FF7A45', '#14A3A3', '#C75CD1'],
    ocean: ['#0B4F6C', '#01BAEF', '#20BF55', '#0E7C7B', '#17BEBB', '#3D5A80', '#98C1D9', '#2E86AB', '#56CFE1', '#1D3557'],
    sunset: ['#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D', '#43AA8B', '#577590', '#9B5DE5', '#F15BB5', '#00BBF9'],
    mono: ['#151B2E', '#3A4466', '#5A6482', '#7F88AA', '#A4ABC6', '#C8CDE0', '#2B3350', '#4C5675', '#6E7898', '#949CBB']
  };

  window.DST = T;
})();
