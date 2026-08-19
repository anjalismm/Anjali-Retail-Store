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
 */

const GRAPH_VERSION = "v19.0";

// Standard events keep their canonical Meta names; everything else is custom.
const STANDARD_EVENTS = new Set([
  "PageView", "ViewContent", "Search", "AddToCart", "AddToWishlist",
  "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead", "CompleteRegistration",
  "Contact", "CustomizeProduct", "Donate", "FindLocation", "Schedule",
  "StartTrial", "SubmitApplication", "Subscribe"
]);

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || undefined;
}

function readCookie(header, name) {
  if (!header) return undefined;
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
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

  let payload = req.body;
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

  // user_data carries no PII — this site collects none. Just the Meta browser
  // cookies plus IP and user agent, which is what CAPI needs for matching.
  const user_data = {
    client_ip_address: clientIp(req),
    client_user_agent: req.headers["user-agent"],
    fbp: fbp || readCookie(cookieHeader, "_fbp"),
    fbc: fbc || readCookie(cookieHeader, "_fbc")
  };
  Object.keys(user_data).forEach(k => user_data[k] === undefined && delete user_data[k]);

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
      events_received: result.events_received
    });
  } catch (err) {
    console.error("Meta CAPI request failed:", err);
    return res.status(200).json({ forwarded: false, reason: "request_failed" });
  }
};
