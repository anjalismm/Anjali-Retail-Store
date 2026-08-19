# Anjali Retail Store — Landing Page

Marketing site for **Anjali Retail Store**, a supermarket and factory outlet in
Rajakilpakkam, Chennai. Its job is to drive local customers to the physical
store, and to generate WhatsApp orders, phone enquiries and delivery enquiries.

A retail venture of Nataraj Oil Mills Private Limited (established 1993).

---

## Technology

Plain static HTML, CSS and JavaScript. No build step, no framework, no
dependencies to install. Fonts come from Google Fonts; everything else is
served from this repository.

One serverless function, `api/meta-events.js`, forwards Meta events server-side
via the Conversions API. Vercel runs it automatically as a Node function — no
configuration needed.

## Folder structure

```
/
├── index.html                  Home page (the whole landing page)
├── 404.html                    Custom not-found page
├── privacy-policy.html
├── terms-and-conditions.html
├── robots.txt
├── sitemap.xml
├── favicon.png                 Browser tab icon
├── assets/
│   ├── logo-header-red.png     Header wordmark
│   ├── logo-wordmark-white.png Footer wordmark
│   ├── delivery-rider.png      Delivery illustration
│   └── images/                 Store photographs, category icons, offer artwork
├── css/
│   └── style.css               All layout rules, breakpoints, hover states, animations
├── api/
│   └── meta-events.js          Meta Conversions API route (serverless)
├── js/
│   └── script.js               Config block + all behaviour
├── README.md
├── DEPLOYMENT.md
└── .gitignore
```

## Run it locally

No server is strictly required — you can open `index.html` in a browser. To
test exactly as it will behave live (relative paths, the Google Maps embed),
run a small static server from the project folder:

```bash
# Python 3
python3 -m http.server 5173

# or Node
npx serve .
```

Then open <http://localhost:5173>.

Note: GA4 deliberately **does not fire** on localhost or preview domains —
see "Tracking" below.

---

## Updating the site

### Offers

All offer content lives in one place: the `OFFER` object at the top of
`js/script.js`. It feeds **both** the Store Offers section and the popup, so
you only edit it once.

```js
var OFFER = {
  title: "Store Offers",
  subtitle: "Get Anjali Sesame Oil at Special Prices!",
  validity: "Offer valid until August 31, 2026",   // popup wording
  validityShort: "VALIDITY — AUGUST 31, 2026",     // offer card wording
  visitUrl: "https://maps.app.goo.gl/...",
  whatsappUrl: "https://wa.me/917094040000",
  items: [
    {
      id: "gingelly-500",                 // used as the offer_click tracking label
      image: "assets/images/offer-500ml.png",
      alt: "...",                         // describe the artwork for screen readers
      cardTitle: "...",                   // heading on the Offers section card
      cardText: "...",                    // body on the Offers section card
      popupText: "..."                    // single line inside the popup
    }
  ]
};
```

To launch a new offer: drop the new artwork into `assets/images/`, then update
the image paths, text and validity dates here. Add or remove items freely — the
section and popup both re-render to match.

### Popup frequency

Directly below `OFFER` in `js/script.js`:

```js
var POPUP_DELAY_MS = 800;          // how long after load the popup appears
var POPUP_KEY = "offerPopupShown"; // sessionStorage key
```

Behaviour: shows automatically **once per browsing session**. Refreshing or
navigating does not reopen it. Clicking any **Offers** link always opens it.
A new browsing session shows it again. (Uses `sessionStorage`, not
`localStorage`, so it never suppresses permanently.)

### Google reviews

The `REVIEWS` array in `js/script.js`. One object per review, in display order:

```js
{ name: "...", rating: 5, date: "6 weeks ago", text: "..." }
```

Omit `date` entirely if it isn't known — the card then just reads
"Google Review". **Only add genuine reviews from the Google Business Profile.**
The number of carousel slides follows the array length automatically.

Two reviews are currently stored exactly as Google truncates them (ending in
"..."). When you have the full text, paste it over the existing string.

### Images

All photographs are in `assets/images/`, in WebP. To replace one, save the new
file over the old filename and the site picks it up. Keep the alt text in
`index.html` accurate for whatever the new picture shows.

- `hero.webp` — hero photograph (loads eagerly, preloaded; keep it optimised)
- `gal-1` … `gal-9` — gallery, lazy-loaded, clickable lightbox
- `cat-*` — the 15 category icons
- `why-1` … `why-6` — Why Choose Us card icons
- `offer-500ml.png`, `offer-1litre.png` — offer artwork

### Social media URLs

In `index.html`, in the footer's **FOLLOW US** block. Three links: Facebook,
Instagram, YouTube. They also appear in the `sameAs` array of the JSON-LD
structured data in `<head>` — update both.

### Business details

Address, phone, WhatsApp number and opening hours appear in three places:

1. The **Find Us** section of `index.html`
2. The footer of `index.html`
3. The JSON-LD `GroceryStore` block in `<head>` of `index.html`

The phone/WhatsApp number is `+91 709 4040 000`, written as `tel:+917094040000`
and `https://wa.me/917094040000`.

---

## Tracking

Two tags, each installed exactly once per page, in the `<head>` of all four HTML
files:

| Tag | ID |
|---|---|
| Google Analytics 4 (gtag.js) | `G-JY51RSTE6V` |
| Meta Pixel | `1627930795149614` |

There is **no** Google Tag Manager, by design — do not add GTM on top of these
or every conversion will be counted twice.

The base tags send `page_view` and `PageView` automatically on load.
`js/script.js` never initialises either tag; its `track()` helper only forwards
**custom** events to whichever tag has loaded, so nothing double-fires.

These tags fire on **every** hostname, including localhost and Vercel preview
URLs. If you want to keep test traffic out of your reporting, filter by hostname
inside GA4 and Events Manager rather than editing the snippets.

To change an ID, edit it in all four HTML files (`index.html`, `404.html`,
`privacy-policy.html`, `terms-and-conditions.html`).

### Meta Conversions API (server-side)

Every Meta event is sent **twice** — once from the browser Pixel, once from the
server via `api/meta-events.js` — both carrying the same `event_id`, so Meta
collapses the pair into a single event. This recovers conversions that ad
blockers and iOS tracking prevention drop from the browser alone.

Set two environment variables in **Vercel → Settings → Environment Variables**
(all environments):

| Variable | Value |
|---|---|
| `PIXEL_ID` | `1627930795149614` |
| `META_ACCESS_TOKEN` | System-user token from Events Manager → Settings → Conversions API |

`META_ACCESS_TOKEN` is a secret. It exists only in the environment variable and
is read server-side in `api/meta-events.js` — never in browser code, never
committed to git.

If either variable is missing the route logs a warning and returns
`{forwarded:false}`; the browser Pixel keeps working and the page is unaffected.

To watch server events arrive live, add a third variable
`META_TEST_EVENT_CODE` with the code from **Events Manager → Test Events**, then
remove it once verified.

GA4 stays completely dormant until `GA4_MEASUREMENT_ID` is filled in.

### Events

| Event | Fires when |
|---|---|
| `page_view` | Page load, once |
| `get_directions` | Any Get Directions / Directions link |
| `visit_store` | Any Visit Store button |
| `whatsapp_click` | Any WhatsApp button |
| `call_now` | Any phone link |
| `offer_click` | An offer card in the Store Offers section (`offer_id` parameter) |
| `offer_popup_view` | The popup opens — automatically or via the Offers button |
| `offer_popup_close` | The popup is closed |
| `offer_popup_visit_store` | Visit Store inside the popup |
| `offer_popup_whatsapp` | Order on WhatsApp inside the popup |

`contact_form_submit` is reserved: the site has no form today, so nothing fires
it. Add the call if a form is introduced later.

### Verifying events

**GA4:** open the site, then GA4 → **Reports → Realtime**. Your visit appears
within seconds. Click a WhatsApp button and look for `whatsapp_click` under
event names.

**Meta:** install the **Meta Pixel Helper** browser extension — it should show
pixel `1627930795149614` with exactly **one** PageView. Then
**Events Manager → Test Events** shows events arriving live as you click.

For the Conversions API, check **Events Manager → your pixel → Overview**. Each
event should show both **Browser** and **Server** as connection methods, with a
high deduplication rate. If you see doubled counts instead, the `event_id` is
not matching — confirm `window.__arPageViewId` exists in the page source and is
passed to both `fbq('track', ...)` and the `/api/meta-events` POST.

If either PageView fires twice, a second snippet has been added somewhere.
There should be exactly one `gtag('config'` and one `fbq('init'` **per page**,
both in the `<head>`, and none in `js/script.js`.

---

## Deployment

See **DEPLOYMENT.md** for the full step-by-step guide.

Short version: push to GitHub, import the repository into Vercel as a static
site (no framework, no build command, output directory `/`), then add the
custom domain.

## Favicon

`favicon.png` (root) and `assets/apple-touch-icon.png` (180×180) are both
included, cut from the Anjali Retail wordmark. If you would rather use a
multi-size `favicon.ico`, drop it at the root and change the `<link rel="icon">`
tag in all four HTML files.

## Notes

- No API keys, tokens or credentials are committed to this repository. The Meta
  access token lives only in a Vercel environment variable. Anything in
  `js/script.js` is public — never put a secret there.
- Both tracking tags are in the `<head>` of each HTML page, not in
  `js/script.js`. Keep it that way — one place per page, easy to audit.
- The Google Maps embed in the Find Us section uses the public embed endpoint
  and needs no API key.
