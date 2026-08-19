/**
 * Meta Conversions API — server-side event forwarding
 * ---------------------------------------------------
 * Vercel serverless function. The browser Pixel and this route send the SAME
 * event with the SAME event_id, so Meta deduplicates them into one event.
 *
 * Required environment variables (Vercel → Settings → Environment Variables):
 *   PIXEL_ID           e.g. 1627930795149614
 *   META_ACCESS_TOKEN  system-user token from Events Manager → Settings
 *
 * Never expose META_ACCESS_TOKEN to the browser. It only lives here.
 *
 * NO PII. This site collects no name, email or phone, and this route never
 * accepts or forwards any. The only identifiers sent are the visitor's IP,
 * user agent, and the _fbp / _fbc browser cookies — all non-personal.
 */

const GRAPH_VERSION = "v19.0";

// Standard events keep their canonical Meta names; everything else is custom.
const STANDARD_EVENTS = new Set([
  "PageView", "ViewContent", "Search", "AddToCart", "AddToWishlist",
  "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead", "CompleteRegistration",
  "Contact", "CustomizeProduct", "Donate", "FindLocation", "Schedule",
  "StartTrial", "SubmitApplication", "Subscribe"
]);

/**
 * Client IP. Vercel always sets x-forwarded-for, but check every header a proxy
 * might use before falling back to the socket — an event missing
 * client_ip_address costs match quality, so this must never come back empty.
 */
function clientIp(req) {
  const candidates = [
    req.headers["x-vercel-forwarded-for"],
    req.headers["x-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["cf-connecting-ip"]
  ];
  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) {
      // x-forwarded-for is a chain; the left-most entry is the real client.
      const first = raw.split(",")[0].trim();
      if (first) return first;
    }
  }
  const sock = (req.socket && req.socket.remoteAddress) ||
    (req.connection && req.connection.remoteAddress);
  if (!sock) return undefined;
  // Strip the IPv4-mapped IPv6 prefix Node reports for IPv4 clients.
  return sock.replace(/^::ffff:/, "");
}

function readCookie(header, name) {
  if (!header) return undefined;
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** fbc from a raw fbclid, in the format Meta expects: fb.1.<ms>.<fbclid> */
function fbcFromFbclid(fbclid, whenMs) {
  if (!fbclid) return undefined;
  return "fb.1." + (whenMs || Date.now()) + "." + fbclid;
}

/** Last-resort fbc recovery: pull fbclid off the page URL the event came from. */
function fbclidFromUrl(url) {
  if (!url) return undefined;
  const m = String(url).match(/[?&]fbclid=([^&#]+)/);
  if (!m) return undefined;
  try { return decodeURIComponent(m[1]); } catch (err) { return m[1]; }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PIXEL_ID = process.env.PIXEL_ID;
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !META_ACCESS_TOKEN) {
    // Missing config must never break the page — the browser Pixel still works.
    console.error("Meta CAPI: PIXEL_ID or META_ACCESS_TOKEN is not set");
    return res.status(200).json({ forwarded: false, reason: "not_configured" });
  }

  // Body can arrive pre-parsed, as a string, or as a Buffer depending on how it
  // was sent (fetch vs sendBeacon Blob). Handle all three.
  let payload = req.body;
  if (Buffer.isBuffer(payload)) payload = payload.toString("utf8");
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (err) { payload = null; }
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const {
    event_name,
    event_id,
    event_source_url,
    event_time,
    custom_data,
    fbp,
    fbc
  } = payload;

  if (!event_name || !event_id) {
    return res.status(400).json({ error: "event_name and event_id are required" });
  }

  const cookieHeader = req.headers.cookie;

  /* user_data — non-personal identifiers only, each with a fallback chain so it
     is present on 100% of events:
       client_ip_address  request headers → socket
       client_user_agent  user-agent header
       fbp                request body → _fbp cookie
       fbc                request body → _fbc cookie → fbclid on the source URL
     No hashed or unhashed name, email or phone is ever attached. */
  const resolvedFbc =
    fbc ||
    readCookie(cookieHeader, "_fbc") ||
    fbcFromFbclid(fbclidFromUrl(event_source_url), Number(event_time) * 1000);

  const user_data = {
    client_ip_address: clientIp(req),
    client_user_agent: req.headers["user-agent"],
    fbp: fbp || readCookie(cookieHeader, "_fbp"),
    fbc: resolvedFbc
  };
  Object.keys(user_data).forEach(k => {
    if (user_data[k] === undefined || user_data[k] === null || user_data[k] === "") {
      delete user_data[k];
    }
  });

  // Surfaced in the response so a missing identifier is diagnosable rather than
  // silently eroding match quality.
  const missing = ["client_ip_address", "client_user_agent", "fbp"]
    .filter(k => !user_data[k]);
  if (missing.length) {
    console.warn("Meta CAPI: event " + event_name + " missing " + missing.join(", "));
  }

  const event = {
    event_name,
    event_id,                                    // matches the browser Pixel call
    event_time: Number(event_time) || Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url,
    user_data
  };

  if (custom_data && typeof custom_data === "object" && Object.keys(custom_data).length) {
    event.custom_data = custom_data;
  }

  const body = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) {
    // Set this temporarily to watch events land in Events Manager → Test Events.
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events` +
    `?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`;

  try {
    const metaRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await metaRes.json();

    if (!metaRes.ok) {
      console.error("Meta CAPI rejected event:", JSON.stringify(result));
      // Still 200 to the browser: a failed server send is not a page error.
      return res.status(200).json({ forwarded: false, meta: result });
    }

    return res.status(200).json({
      forwarded: true,
      event_name,
      event_id,
      standard: STANDARD_EVENTS.has(event_name),
      sent: Object.keys(user_data),
      missing,
      events_received: result.events_received
    });
  } catch (err) {
    console.error("Meta CAPI request failed:", err);
    return res.status(200).json({ forwarded: false, reason: "request_failed" });
  }
};
