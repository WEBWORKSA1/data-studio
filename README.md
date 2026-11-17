# Data.Studio

**The free studio for working with data** — browser-based data tools, an open-dataset directory, live data feeds that refresh automatically, guides, video lessons, a monthly data-viz contest, and a lead-generation desk for custom dashboard and analytics work.

Static site (HTML/CSS/vanilla JS). Hosted free on **GitHub Pages** from the `main` branch root. No build step.

---

## Launch checklist

1. **Publish on GitHub Pages**: go to Settings → Pages → *Build and deployment* → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.
   The site will be live at `https://webworksa1.github.io/data-studio/`.
2. **Custom domain (data.studio)**: at your registrar, add the apex `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and a `CNAME` for `www` → `webworksa1.github.io`. Then go to Settings → Pages → Custom domain → `data.studio` → tick **Enforce HTTPS**.
   *(All internal links are relative, so the site works on both URLs.)*
3. **Forms**: all forms post through FormSubmit (AJAX). The address is assembled at runtime and never rendered. The **first** submission triggers an activation email, so open it and click *Activate*. Optional: put the random alias FormSubmit gives you into `assets/js/config.js` → `formAlias`, so even the obfuscated address leaves the code.
4. **AdSense**: `ads.txt` is in place and the AdSense script is in the `<head>` of every page. In AdSense:
   - Add the site.
   - Turn on **Auto ads**.
   - Turn on **Privacy & messaging → European regulations message** (Google-certified CMP) for EEA/UK/CH visitors.
5. **Automation**: the workflow (`.github/workflows/update-data.yml`, or `automation/update-data.yml` if it had to be moved) refreshes `data/*.json` every 6 hours (FX rates, World Bank indicators, new research papers, data news, trending open-source repos, new tutorial videos) and updates `sitemap.xml`. If it sits in `automation/`, move it to `.github/workflows/`, then enable Actions and set Settings → Actions → General → Workflow permissions → **Read and write**.
6. **Donations**: add your payment links (PayPal.me / Stripe Payment Link / Buy Me a Coffee / Ko-fi) in `assets/js/config.js` → `donate`. Until then, the support page collects pledges by form, and you reply with a payment link.

## Structure

```
index.html            Home
tools/                7 in-browser tools (chart maker, CSV⇄JSON, profiler, pivot, cleaner, A/B test, sample size)
chart-guide.html      Interactive chart chooser
datasets.html         Open dataset directory (data/datasets.json)
live.html             Self-updating live data (data/*.json)
learn.html            Video lessons (auto-refreshed) + learning paths
guides/               Long-form original guides
glossary.html         Data glossary
services.html         Lead generation — custom dashboards & analytics (multi-step form)
contests.html         Monthly Data Viz Challenge + submission form
careers.html          Talent network / hiring
support.html          Donations & pledges
advertise.html        Sponsorship / advertising / partnership
about, contact, privacy, terms, disclaimer, 404
assets/css/site.css   Design system
assets/js/site.js     Header/footer, forms, consent, video embeds, helpers
assets/js/config.js   Site configuration (form alias, donation links, contest)
assets/js/tools.js    Shared tool utilities
scripts/update-data.mjs  Data refresh script (Node 20, zero deps)
docs/                 Strategy + phase-wise build prompts
```

## Expanding

- **New tool**: copy any file in `tools/`, add a card in `tools/index.html` and an entry in `sitemap.xml`.
- **New guide**: copy a file in `guides/`, add it to `guides/index.html` and `sitemap.xml`.
- **New live feed**: add a fetcher in `scripts/update-data.mjs` that writes `data/<name>.json`, and render it in `live.html`.

## Trademark notice

Data.Studio is an independent website. It is not affiliated with, endorsed by, or sponsored by Google LLC. "Data Studio" and "Looker" are trademarks of Google LLC. See `disclaimer.html`.
