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

Note: Meta Pixel and GA4 deliberately **do not fire** on localhost or preview
domains — see "Tracking" below.

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

**One** Meta Pixel and **one** GA4 installation, both in `js/script.js`. No
Google Tag Manager, by design — do not add GTM on top of these or events will
be counted twice.

```js
var META_PIXEL_ID = "1627930795149614";   // live
var GA4_MEASUREMENT_ID = "";              // ← paste the real G-XXXXXXXXXX here
var LIVE_HOSTS = ["anjaliretail.com", "www.anjaliretail.com"];
```

Tracking only initialises when the hostname is in `LIVE_HOSTS`. Localhost and
Vercel preview URLs send nothing, so test traffic never reaches your ad
reporting. Add a host to that array if you want a staging domain measured.

GA4 stays completely dormant until `GA4_MEASUREMENT_ID` is filled in.

### Events

| Event | Fires when |
|---|---|
| `PageView` (Pixel) / `page_view` (GA4) | Page load, once |
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

### Verifying the Pixel

1. Install the **Meta Pixel Helper** Chrome extension.
2. Open the live domain (not a preview URL).
3. The helper should show pixel `1627930795149614` with **one** PageView.
4. Click a WhatsApp button — a custom `whatsapp_click` event appears.
5. In Events Manager → Test Events, confirm the same.

If PageView shows twice, something has added a second Pixel snippet — there
should be exactly one `fbq("init")` in the project, in `js/script.js`.

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

- No API keys, tokens or credentials exist anywhere in this project. Keep it
  that way — anything in `js/script.js` is public.
- The Google Maps embed in the Find Us section uses the public embed endpoint
  and needs no API key.
