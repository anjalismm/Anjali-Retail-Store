/* ==========================================================================
   Anjali Retail Store — site behaviour
   --------------------------------------------------------------------------
   EDIT ONLY THE CONFIG BLOCK BELOW for day-to-day changes (offers, tracking
   IDs, contact links). Everything under "Runtime" is plumbing.
   ========================================================================== */

/* ── 1. TRACKING IDS ─────────────────────────────────────────────────────── */

/* ── 2. CURRENT STORE OFFER ──────────────────────────────────────────────────
   ONE source of truth. Feeds both the Store Offers section and the popup.
   To launch a new offer, edit this object only. */

var OFFER = {
  title: "Store Offers",
  subtitle: "Get Anjali Sesame Oil at Special Prices!",
  validity: "Offer valid until August 31, 2026",
  validityShort: "VALIDITY — AUGUST 31, 2026",
  visitUrl: "https://maps.app.goo.gl/ZLKQkJnTE3etk6569",
  whatsappUrl: "https://wa.me/917094040000",
  items: [
    {
      id: "gingelly-500",
      image: "assets/images/offer-500ml.png",
      alt: "For shopping above Rs 1000 — 500 ml Anjali Sesame Oil for Rs 100",
      cardTitle: "500 ml Anjali Sesame Oil for \u20B9100",
      cardText: "Spend \u20B91000 and add a 500 ml bottle of Anjali cold-pressed sesame oil for just \u20B9100.",
      popupText: "Spend \u20B91000 \u2192 Get 500 ml Gingelly Oil for \u20B9100"
    },
    {
      id: "gingelly-1l",
      image: "assets/images/offer-1litre.png",
      alt: "For shopping above Rs 2000 — 1 litre Anjali Sesame Oil for Rs 200",
      cardTitle: "1 Litre Anjali Sesame Oil for \u20B9200",
      cardText: "Spend \u20B92000 and add a 1 litre bottle of Anjali cold-pressed sesame oil for just \u20B9200.",
      popupText: "Spend \u20B92000 \u2192 Get 1 Litre Gingelly Oil for \u20B9200"
    }
  ]
};

/* Automatic popup shows once per browsing session (sessionStorage).
   The Offers button always opens it, regardless of this flag. */
var POPUP_DELAY_MS = 800;
var POPUP_KEY = "offerPopupShown";

/* ── 3. GOOGLE REVIEWS ───────────────────────────────────────────────────────
   Genuine reviews from the Google Business Profile only. Never invent one.
   { name, rating, date (optional), text } */

var REVIEWS = [
  { name: "Nandha Gopan", rating: 5, date: "6 weeks ago", text: "Anjali Retail is a fantastic place for regular shopping. The shelves are always well-stocked with top brands (from soaps..." },
  { name: "Jeyapnsh", rating: 5, date: "6 weeks ago", text: "Good quality products and reasonable prices. The fruits and vegetables are always fresh. The store is clean, and the service is good. Happy with my shopping experience." },
  { name: "JayaPrakash", rating: 5, date: "20 weeks ago", text: "I recently visited Anjali Retail Store and had a really good experience. The store is neat, well-organized, and easy to..." },
  { name: "Srinivasamurthy santhosh", rating: 5, date: "21 weeks ago", text: "very nice place with quality products at good prices. Feels great to buy directly from the factory outlet – really a wow experience! \uD83D\uDE0A" },
  { name: "Devi Kalyani", rating: 5, date: "9 weeks ago", text: "This has a lot of great grocery" }
];

/* ══════════════════════════════ Runtime ═══════════════════════════════════ */

(function () {
  "use strict";

  var WA_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" style="flex:none"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.79 9.79 0 0 1-1.5-5.23c0-5.41 4.4-9.81 9.82-9.81 2.62 0 5.08 1.02 6.94 2.88a9.75 9.75 0 0 1 2.87 6.94c0 5.41-4.4 9.82-9.81 9.82zM20.52 3.45A11.7 11.7 0 0 0 12.05 0C5.55 0 .26 5.29.25 11.79c0 2.08.55 4.1 1.58 5.89L.15 24l6.46-1.69a11.76 11.76 0 0 0 5.43 1.35h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.22-6.11-3.45-8.34z"/></svg>';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  /* ── Event dispatch ────────────────────────────────────────────────────────
     The GA4 tag (G-JY51RSTE6V) and Meta Pixel (1627930795149614) base codes are
     installed once each, in the <head> of every page. They send page_view and
     PageView on load. This helper only forwards CUSTOM events to whichever of
     them has loaded — it never initialises either, so nothing double-fires. */

  function track(name, params) {
    params = params || {};
    if (window.fbq) window.fbq("trackCustom", name, params);
    if (window.gtag) window.gtag("event", name, params);
  }

  /* Declarative click tracking: data-act="whatsapp_click" etc. */
  var ACT = {
    onDirections: "get_directions",
    onVisitStore: "visit_store",
    onWhatsApp: "whatsapp_click",
    onCall: "call_now"
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    if (ACT[act]) track(ACT[act]);
    if (act === "toggleMenu") toggleMenu();
    if (act === "closeMenu") setMenu(false);
    if (act === "openOfferPopup") openPopup();
    if (act === "openOfferPopupFromMenu") { setMenu(false); openPopup(); }
    if (act === "prev") goReview(reviewIndex - 1);
    if (act === "next") goReview(reviewIndex + 1);
  });

  /* ── Mobile menu ── */

  var menu = $('[data-r="mobile-menu"]');
  function setMenu(open) { if (menu) menu.setAttribute("data-open", open ? "1" : "0"); }
  function toggleMenu() { if (menu) setMenu(menu.getAttribute("data-open") !== "1"); }

  /* ── Store Offers section (rendered from OFFER) ── */

  var grid = $("#offers-grid");
  if (grid) {
    grid.innerHTML = OFFER.items.map(function (o) {
      return '<a href="' + esc(OFFER.whatsappUrl) + '" target="_blank" rel="noopener noreferrer" data-offer="' + esc(o.id) + '" data-h="offer-card" ' +
        'style="display:block;border:1px solid #f0e6e6;border-radius:18px;overflow:hidden;background:#fff">' +
        '<img src="' + esc(o.image) + '" alt="' + esc(o.alt) + '" width="1200" height="628" loading="lazy" decoding="async" style="display:block;width:100%;height:auto">' +
        '<div style="padding:18px 20px 20px">' +
        '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:17px;margin:0;color:#14100f;letter-spacing:-0.3px">' + esc(o.cardTitle) + '</h3>' +
        '<p style="font-size:13px;line-height:1.6;color:#6b6261;margin:7px 0 0">' + esc(o.cardText) + '</p>' +
        '<p style="font-size:11.5px;font-weight:700;letter-spacing:0.6px;color:#ED111B;margin:12px 0 0">' + esc(OFFER.validityShort) + '</p>' +
        '</div></a>';
    }).join("");
    grid.addEventListener("click", function (e) {
      var a = e.target.closest("[data-offer]");
      if (a) { track("offer_click", { offer_id: a.getAttribute("data-offer") }); track("whatsapp_click"); }
    });
  }

  /* ── Offer popup ── */

  var popupRoot = $("#offer-popup-root");

  function popupMarkup() {
    return '<div data-r="popupoverlay" style="position:fixed;inset:0;z-index:95;background:rgba(20,12,12,0.62);display:flex;align-items:center;justify-content:center;padding:clamp(14px,4vw,32px)">' +
      '<div role="dialog" aria-modal="true" aria-labelledby="ar-popup-title" data-r="popupcard" style="position:relative;width:min(560px,94vw);max-height:88vh;overflow-y:auto;background:#fff;border-radius:22px;box-shadow:0 24px 60px rgba(20,12,12,0.28);padding:clamp(22px,3.4vw,34px)">' +
      '<button type="button" data-popup-close="1" aria-label="Close offer" data-r="popupclose" style="position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid #f0e6e6;background:#fff;color:#14100f;font-size:20px;line-height:1;cursor:pointer;transition:background 200ms ease,color 200ms ease">\u00D7</button>' +
      '<p style="font-size:11.5px;font-weight:700;letter-spacing:1.6px;color:#ED111B;margin:0">OFFERS &amp; DISCOUNTS</p>' +
      '<h2 id="ar-popup-title" style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:clamp(23px,2.6vw,29px);letter-spacing:-1px;margin:8px 0 0;color:#14100f">' + esc(OFFER.title) + ' <span style="color:#ED111B">\u2665</span></h2>' +
      '<p style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:15px;color:#14100f;margin:12px 0 0">' + esc(OFFER.subtitle) + '</p>' +
      '<div style="display:grid;gap:12px;margin-top:18px">' +
      OFFER.items.map(function (o) {
        return '<div style="display:flex;align-items:center;gap:14px;border:1px solid #dff0e5;background:#f4fbf6;border-radius:14px;padding:12px 14px">' +
          '<img src="' + esc(o.image) + '" alt="' + esc(o.alt) + '" width="1200" height="628" loading="lazy" decoding="async" style="width:76px;height:auto;border-radius:8px;flex:none">' +
          '<p style="font-size:13.5px;line-height:1.55;color:#14100f;margin:0">' + esc(o.popupText) + '</p></div>';
      }).join("") +
      '</div>' +
      '<p style="font-size:11.5px;font-weight:700;letter-spacing:0.6px;color:#ED111B;margin:16px 0 0">' + esc(OFFER.validity) + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px">' +
      '<a href="' + esc(OFFER.visitUrl) + '" target="_blank" rel="noopener noreferrer" data-popup-cta="visit" data-h="popup-visit" style="flex:1 1 190px;background:#ED111B;color:#fff;border-radius:10px;padding:13px 22px;font-weight:700;font-size:14px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;transition:background 240ms ease">Visit Store</a>' +
      '<a href="' + esc(OFFER.whatsappUrl) + '" target="_blank" rel="noopener noreferrer" data-popup-cta="whatsapp" data-r="wa" style="flex:1 1 190px;background:#20B15A;color:#fff;border-radius:10px;padding:13px 22px;font-weight:700;font-size:14px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:9px;transition:background 240ms ease,transform 240ms ease,box-shadow 240ms ease">' + WA_ICON + 'Order on WhatsApp</a>' +
      '</div></div></div>';
  }

  var lastFocus = null;

  function openPopup() {
    if (!popupRoot || popupRoot.firstChild) return;
    lastFocus = document.activeElement;
    popupRoot.innerHTML = popupMarkup();
    document.body.setAttribute("data-lock", "1");
    track("offer_popup_view");
    var close = $("[data-popup-close]", popupRoot);
    if (close) close.focus();
  }

  function closePopup() {
    if (!popupRoot || !popupRoot.firstChild) return;
    popupRoot.innerHTML = "";
    document.body.removeAttribute("data-lock");
    track("offer_popup_close");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (popupRoot) {
    popupRoot.addEventListener("click", function (e) {
      var cta = e.target.closest("[data-popup-cta]");
      if (cta) {
        if (cta.getAttribute("data-popup-cta") === "visit") { track("offer_popup_visit_store"); track("visit_store"); }
        else { track("offer_popup_whatsapp"); track("whatsapp_click"); }
        return;
      }
      if (e.target.closest("[data-popup-close]") || e.target === $('[data-r="popupoverlay"]', popupRoot)) closePopup();
    });

    var seen = false;
    try { seen = sessionStorage.getItem(POPUP_KEY) === "true"; } catch (err) {}
    if (!seen) {
      setTimeout(function () {
        try { sessionStorage.setItem(POPUP_KEY, "true"); } catch (err) {}
        openPopup();
      }, POPUP_DELAY_MS);
    }
  }

  /* ── Reviews carousel ── */

  var reviewIndex = 0, fadeT = null;
  var card = $('[data-r="revcard"]');
  var dotsBox = $("#review-dots");

  function paintReview() {
    var r = REVIEWS[reviewIndex];
    if (!r) return;
    $("#review-stars").textContent = "\u2605\u2605\u2605\u2605\u2605".slice(0, r.rating || 5);
    $("#review-rating-label").setAttribute("aria-label", (r.rating || 5) + " out of 5 stars");
    $("#review-text").textContent = r.text;
    $("#review-name").textContent = r.name;
    $("#review-meta").textContent = r.date ? "Google Review \u2022 " + r.date : "Google Review";
    if (dotsBox) {
      $$("button", dotsBox).forEach(function (b, i) {
        b.style.width = i === reviewIndex ? "26px" : "9px";
        b.style.background = i === reviewIndex ? "#22a75a" : "#cfe4d6";
        b.setAttribute("aria-current", i === reviewIndex ? "true" : "false");
      });
    }
  }

  function goReview(i) {
    var n = REVIEWS.length;
    if (!n) return;
    var next = ((i % n) + n) % n;
    if (next === reviewIndex || !card) return;
    clearTimeout(fadeT);
    card.setAttribute("data-fade", "1");
    fadeT = setTimeout(function () {
      reviewIndex = next;
      paintReview();
      card.setAttribute("data-fade", "0");
    }, 300);
  }

  if (dotsBox) {
    dotsBox.innerHTML = REVIEWS.map(function (_, i) {
      return '<button type="button" data-dot="' + i + '" aria-label="Show review ' + (i + 1) + ' of ' + REVIEWS.length +
        '" style="width:9px;height:9px;border:0;border-radius:99px;background:#cfe4d6;padding:0;cursor:pointer;transition:width 240ms ease,background 240ms ease"></button>';
    }).join("");
    dotsBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-dot]");
      if (b) goReview(Number(b.getAttribute("data-dot")));
    });
  }
  paintReview();

  if (card) {
    var touchX = null;
    card.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    card.addEventListener("touchend", function (e) {
      if (touchX == null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 45) goReview(reviewIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ── Gallery lightbox ── */

  var lightbox = null;

  function openLightbox(src, alt) {
    closeLightbox();
    lightbox = document.createElement("div");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", alt || "Anjali Retail Store photograph");
    lightbox.style.cssText = "position:fixed;inset:0;z-index:90;background:rgba(10,6,6,0.88);display:flex;align-items:center;justify-content:center;padding:clamp(12px,4vw,32px);cursor:zoom-out";
    lightbox.innerHTML =
      '<button type="button" aria-label="Close photograph" style="position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#14100f;font-size:22px;line-height:1;cursor:pointer">\u00D7</button>' +
      '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" style="max-width:min(96vw,1200px);max-height:86vh;width:auto;height:auto;object-fit:contain;border-radius:14px;display:block">';
    lightbox.addEventListener("click", closeLightbox);
    document.body.appendChild(lightbox);
    document.body.setAttribute("data-lock", "1");
    lightbox.querySelector("button").focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    if (!popupRoot || !popupRoot.firstChild) document.body.removeAttribute("data-lock");
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest("[data-lightbox]");
    if (img) openLightbox(img.getAttribute("src"), img.getAttribute("alt"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (popupRoot && popupRoot.firstChild) closePopup();
    else closeLightbox();
  });
})();
