// Data.Studio live-data refresher. Node 20+, zero dependencies.
// Run by the GitHub Actions workflow every 6 hours: node scripts/update-data.mjs
import { writeFile, readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const DATA = new URL('data/', ROOT);
const UA = 'DataStudioBot/1.0 (+https://data.studio/about.html)';
const iso = (d) => d.toISOString().slice(0, 10);
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

async function get(url, { text = false, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return text ? await r.text() : await r.json();
  } finally { clearTimeout(t); }
}
const save = (name, data) => writeFile(new URL(`${name}.json`, DATA), JSON.stringify(data, null, 1) + '\n');

let prevMeta = {};
try { prevMeta = JSON.parse(await readFile(new URL('meta.json', DATA), 'utf8')); } catch {}
const meta = { updatedAt: prevMeta.updatedAt || null, sources: {} };
let okCount = 0;

async function task(name, fn) {
  try {
    const n = await fn();
    meta.sources[name] = { ok: true, count: n, at: new Date().toISOString() };
    okCount++;
    console.log(`✓ ${name}: ${n}`);
  } catch (e) {
    meta.sources[name] = { ok: false, error: String(e && e.message || e).slice(0, 200), at: new Date().toISOString() };
    console.error(`✗ ${name}: ${e && e.message}`);
  }
}

/* 1. Exchange rates (ECB reference rates via Frankfurter) */
await task('fx', async () => {
  const bases = ['https://api.frankfurter.app', 'https://api.frankfurter.dev/v1'];
  let latest, base;
  for (const b of bases) {
    try { latest = await get(`${b}/latest?from=USD`); base = b; break; } catch (e) { console.error('  fx base failed', b, e.message); }
  }
  if (!latest || !latest.rates) throw new Error('FX source unavailable');
  const series = {}, change = {};
  try {
    const start = new Date(Date.now() - 45 * 864e5);
    const ts = await get(`${base}/${iso(start)}..?from=USD`);
    const dates = Object.keys(ts.rates || {}).sort();
    series.EUR = dates.slice(-30).map((d) => [d, ts.rates[d].EUR]).filter((p) => p[1] != null);
    if (dates.length >= 2) {
      const last = ts.rates[dates[dates.length - 1]], prev = ts.rates[dates[dates.length - 2]];
      for (const c of Object.keys(last)) if (prev[c]) change[c] = +(((last[c] - prev[c]) / prev[c]) * 100).toFixed(3);
    }
  } catch (e) { console.error('  fx series failed', e.message); }
  await save('fx', { base: 'USD', date: latest.date, rates: latest.rates, change, series, source: 'European Central Bank reference rates via Frankfurter API' });
  return Object.keys(latest.rates).length;
});

/* 2. World Bank indicators (most recent non-empty value) */
await task('worldbank', async () => {
  const C = ['USA', 'CHN', 'IND', 'JPN', 'DEU', 'GBR', 'FRA', 'BRA', 'CAN', 'ITA', 'KOR', 'AUS', 'MEX', 'IDN', 'SAU', 'TUR', 'NGA', 'ZAF', 'ESP', 'LKA'];
  const IND = { gdp: 'NY.GDP.MKTP.CD', pop: 'SP.POP.TOTL', gdppc: 'NY.GDP.PCAP.CD', life: 'SP.DYN.LE00.IN', net: 'IT.NET.USER.ZS' };
  const map = {};
  for (const [k, code] of Object.entries(IND)) {
    const j = await get(`https://api.worldbank.org/v2/country/${C.join(';')}/indicator/${code}?format=json&mrnev=1&per_page=500`);
    for (const row of (Array.isArray(j) && j[1]) || []) {
      const id = row.countryiso3code || (row.country && row.country.id);
      if (!id) continue;
      map[id] = map[id] || { iso3: id, name: row.country.value };
      if (row.value != null) map[id][k] = { v: row.value, y: row.date };
    }
  }
  const countries = Object.values(map).filter((c) => c.gdp || c.pop);
  if (!countries.length) throw new Error('No World Bank data');
  await save('worldbank', { countries, source: 'World Bank World Development Indicators (CC BY 4.0)' });
  return countries.length;
});

/* 3. New research papers (arXiv) */
await task('papers', async () => {
  const q = 'cat:cs.DB+OR+cat:stat.ML+OR+cat:stat.AP+OR+cat:stat.CO';
  const xml = await get(`https://export.arxiv.org/api/query?search_query=${q}&sortBy=submittedDate&sortOrder=descending&max_results=20`, { text: true });
  const papers = xml.split('<entry>').slice(1).map((e) => {
    const pick = (tag) => ((e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || '').trim().replace(/\s+/g, ' ');
    const authors = [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => decode(m[1].trim()));
    const category = (e.match(/<arxiv:primary_category[^>]*term="([^"]+)"/) || [])[1] || '';
    return { title: decode(pick('title')), url: pick('id').replace(/^http:/, 'https:'), published: pick('published'), authors, category };
  }).filter((p) => p.title && p.url);
  if (!papers.length) throw new Error('No papers parsed');
  await save('papers', { papers, source: 'arXiv API' });
  return papers.length;
});

/* 4. Data news (Hacker News via Algolia) */
await task('news', async () => {
  const queries = ['data visualization', 'dataset', 'analytics', 'data engineering', 'SQL', 'statistics', 'dashboard'];
  const since = Math.floor(Date.now() / 1000) - 14 * 86400;
  const seen = new Map();
  for (const q of queries) {
    try {
      const j = await get(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&numericFilters=created_at_i>${since},points>15&hitsPerPage=20`);
      for (const h of j.hits || []) {
        if (!h.title || seen.has(h.objectID)) continue;
        const hn = `https://news.ycombinator.com/item?id=${h.objectID}`;
        seen.set(h.objectID, { title: h.title, url: h.url || hn, hn, points: h.points || 0, comments: h.num_comments || 0, created: h.created_at });
      }
    } catch (e) { console.error('  hn query failed', q, e.message); }
  }
  const stories = [...seen.values()].sort((a, b) => b.points - a.points).slice(0, 25);
  if (!stories.length) throw new Error('No stories');
  await save('news', { stories, source: 'Hacker News (Algolia API)' });
  return stories.length;
});

/* 5. Trending open-source data projects (GitHub) */
await task('repos', async () => {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const created = iso(new Date(Date.now() - 365 * 864e5)), pushed = iso(new Date(Date.now() - 30 * 864e5));
  const m = new Map();
  for (const t of ['data-visualization', 'data-analysis', 'data-engineering', 'analytics']) {
    try {
      const j = await get(`https://api.github.com/search/repositories?q=topic:${t}+created:>${created}+pushed:>${pushed}&sort=stars&order=desc&per_page=10`, { headers });
      for (const r of j.items || []) m.set(r.full_name, { name: r.full_name, url: r.html_url, description: (r.description || '').slice(0, 180), stars: r.stargazers_count, language: r.language, topic: t });
    } catch (e) { console.error('  gh topic failed', t, e.message); }
  }
  const repos = [...m.values()].sort((a, b) => b.stars - a.stars).slice(0, 12);
  if (!repos.length) throw new Error('No repos');
  await save('repos', { repos, source: 'GitHub Search API' });
  return repos.length;
});

/* 6. Latest lessons from data educators (YouTube RSS) */
await task('videos', async () => {
  const CH = {
    UCtYLUTtgS3k1Fg4y5tAhLbw: { name: 'StatQuest with Josh Starmer' },
    'UC7cs8q-gJRlGwj4A8OmCmXg': { name: 'Alex The Analyst' },
    'UC8butISFwT-Wl7EV0hUK0BQ': { name: 'freeCodeCamp.org', filter: /data|sql|python|statistic|analy|excel|power bi|tableau|machine learning|pandas|dashboard/i },
    UCYO_jab_esuFRV4b17AJtAw: { name: '3Blue1Brown' },
    UCLLw7jmFsvfIVaUFsLs8mlQ: { name: 'Luke Barousse' },
    UCCezIgC97PvUuR4_gbFUs5g: { name: 'Corey Schafer' }
  };
  const vids = [];
  for (const [id, cfg] of Object.entries(CH)) {
    try {
      const xml = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { text: true });
      const author = decode((xml.match(/<author>\s*<name>([^<]+)<\/name>/) || [])[1] || cfg.name);
      for (const e of xml.split('<entry>').slice(1, 11)) {
        const v = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
        const title = decode((e.match(/<title>([^<]+)<\/title>/) || [])[1] || '');
        const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
        if (!v || !title) continue;
        if (cfg.filter && !cfg.filter.test(title)) continue;
        if (/#shorts/i.test(title)) continue;
        vids.push({ id: v, title, channel: author, published });
      }
    } catch (e) { console.error('  yt failed', id, e.message); }
  }
  if (!vids.length) throw new Error('No videos');
  vids.sort((a, b) => new Date(b.published) - new Date(a.published));
  await save('videos', { videos: vids.slice(0, 36), source: 'YouTube channel feeds' });
  return vids.length;
});

/* 7. Sitemap lastmod for dynamic pages */
try {
  const url = new URL('sitemap.xml', ROOT);
  const xml = await readFile(url, 'utf8');
  const today = iso(new Date());
  const out = xml.replace(/<url>([\s\S]*?)<\/url>/g, (block) =>
    /<loc>https:\/\/data\.studio\/(live\.html|learn\.html)?<\/loc>/.test(block) ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${today}</lastmod>`) : block);
  if (out !== xml) await writeFile(url, out);
} catch (e) { console.error('sitemap update failed', e.message); }

if (okCount > 0) meta.updatedAt = new Date().toISOString();
await save('meta', meta);
console.log(`Done: ${okCount}/${Object.keys(meta.sources).length} feeds refreshed.`);
