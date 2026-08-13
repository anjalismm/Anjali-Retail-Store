# Deployment Guide

From this folder to a live website on your own domain. Follow the steps in
order. Nothing here needs a terminal except Step 2 (and there is a no-terminal
alternative).

---

## Step 1 — Create the GitHub repository

1. Sign in at <https://github.com> and click **New repository**.
2. Name it, for example, `anjali-retail-website`.
3. Set it to **Private** (recommended) or Public.
4. Do **not** tick "Add a README" — this project already has one.
5. Click **Create repository**.

## Step 2 — Upload this project

**With the browser (no terminal):** on the empty repository page click
**uploading an existing file**, drag in the entire contents of this folder —
`index.html`, `404.html`, the two legal pages, `robots.txt`, `sitemap.xml`,
`assets/`, `css/`, `js/`, `README.md`, `DEPLOYMENT.md`, `.gitignore` — then
click **Commit changes**.

**With git:**

```bash
cd path/to/this/folder
git init
git add .
git commit -m "Anjali Retail Store landing page"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/anjali-retail-website.git
git push -u origin main
```

Check on GitHub that `index.html` sits at the **top level** of the repository,
not inside a subfolder. Vercel needs it there.

## Step 3 — Connect the repository to Vercel

1. Sign in at <https://vercel.com> with your GitHub account.
2. Click **Add New… → Project**.
3. Find `anjali-retail-website` and click **Import**.
4. Grant Vercel access to the repository if it asks.

## Step 4 — Deploy

On the configuration screen:

- **Framework Preset:** `Other` (Vercel usually detects this automatically)
- **Build Command:** leave empty
- **Output Directory:** leave as the default root
- **Install Command:** leave empty
- **Environment Variables:** none

Click **Deploy**. It finishes in well under a minute — there is nothing to
build.

> No `vercel.json` is included, and none is needed. This is a plain static site
> with real `.html` files, so Vercel's defaults serve it correctly and use
> `404.html` for missing pages automatically. Adding configuration here would
> only be something else to maintain.

## Step 5 — Test the temporary URL

Vercel gives you something like `anjali-retail-website.vercel.app`. Open it and
check:

- All photographs load (hero, categories, gallery, offers)
- The red category ticker scrolls smoothly
- The offer popup appears about a second after loading, and the × closes it
- Clicking **Offers** in the menu reopens the popup
- WhatsApp, Call and Get Directions buttons work
- The gallery lightbox opens and Escape closes it
- The reviews carousel arrows and dots work
- The page looks right on your phone

Tracking will **not** fire here — that is intentional (see Step 10).

## Step 6 — Add the custom domain

1. In Vercel open the project → **Settings → Domains**.
2. Enter `anjaliretail.com` and click **Add**.
3. Also add `www.anjaliretail.com`.
4. Choose which one is primary. This site is built for **www** as the canonical
   address, so set `www.anjaliretail.com` as primary and let `anjaliretail.com`
   redirect to it.

## Step 7 — Configure DNS

Vercel shows the exact records to create. At your domain registrar:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Use the values Vercel displays on screen if they differ from these. Remove any
old A or CNAME records pointing the same names elsewhere. DNS usually updates
within minutes, occasionally up to 48 hours.

## Step 8 — Verify HTTPS

Once DNS resolves, Vercel issues an SSL certificate automatically. In
**Settings → Domains** both entries should show **Valid Configuration**. Visit
`https://www.anjaliretail.com` and confirm the padlock appears and that
`http://` redirects to `https://`.

## Step 9 — Confirm the production domain everywhere

This project is already written for `https://www.anjaliretail.com`. **If you
deploy on a different domain**, search and replace it in these four places:

1. `index.html` — the `<link rel="canonical">` tag
2. `index.html` — the `og:url` and `og:image` meta tags
3. `index.html` — the JSON-LD block (`url`, `logo`, `image`)
4. `sitemap.xml` — all three `<loc>` entries, and `robots.txt` — the `Sitemap:` line

Then update `LIVE_HOSTS` in `js/script.js` so tracking runs on the new domain.

## Step 10 — Verify the Meta Pixel

1. Install the **Meta Pixel Helper** browser extension.
2. Open `https://www.anjaliretail.com` (the real domain — the Pixel is
   deliberately disabled on preview URLs).
3. Confirm pixel `1627930795149614` fires **one** PageView.
4. Click a WhatsApp button and confirm a `whatsapp_click` event.
5. In **Events Manager → Test Events**, watch the events arrive live.

## Step 11 — Set up GA4

1. Create a GA4 property at <https://analytics.google.com> for
   `www.anjaliretail.com`.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. In `js/script.js` set:
   ```js
   var GA4_MEASUREMENT_ID = "G-XXXXXXXXXX";
   ```
4. Commit and push. Vercel redeploys automatically.
5. In GA4 → **Reports → Realtime**, open the site and confirm your visit
   appears, then click a WhatsApp button and look for the `whatsapp_click`
   event.

Do **not** also install Google Tag Manager — the Pixel and GA4 are hardcoded
here, and adding GTM on top would double-count every conversion.

## Step 12 — Connect Google Search Console

1. Go to <https://search.google.com/search-console> and add a property.
2. Choose **Domain** and enter `anjaliretail.com`, then add the TXT record it
   gives you at your registrar.
3. Once verified, open **Sitemaps** and submit:
   `https://www.anjaliretail.com/sitemap.xml`
4. Use **URL Inspection** on the homepage and click **Request Indexing**.
5. Link the Google Business Profile for the store to the same property so local
   search results connect to the site.

## Step 13 — Verify the domain in Meta

1. Open **Meta Business Suite → Business Settings → Brand Safety → Domains**.
2. Add `anjaliretail.com`.
3. Choose **DNS verification** and add the TXT record at your registrar
   (simplest given you already control DNS).
4. Click **Verify**.

This unlocks Aggregated Event Measurement, which you need for iOS conversion
reporting. Afterwards, in **Events Manager → Aggregated Event Measurement**,
rank your events with `whatsapp_click` and `get_directions` highest — they are
your real conversions.

---

## After launch

- Test the site on an actual phone, on mobile data, not just a desktop browser.
- Confirm the WhatsApp button opens WhatsApp on both Android and iOS.
- Watch Realtime in GA4 for the first day to be sure events arrive.
- To update the site later: edit the files, commit, push. Vercel redeploys on
  every push to `main`.
