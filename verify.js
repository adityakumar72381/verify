let locked = false;

/* =========================
   HASH (site.com/abc)
========================= */
const hash = location.pathname.replace(/^\/+|\/+$/g, "");

/* =========================
   UI ELEMENTS
========================= */
const bypassBox = document.getElementById("bypass");
const verifyBox = document.getElementById("verify");
const notFoundBox = document.getElementById("notfound");
const statusEl = document.getElementById("status");

/* =========================
   HANDLE /404 ROUTE (EARLY EXIT)
========================= */
if (hash === "404") {
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "flex";

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  let sec = 5;
  const el = document.getElementById("countdown");
  if (el) {
    const timer = setInterval(() => {
      sec--;
      el.textContent = sec;
      if (sec <= 0) {
        clearInterval(timer);
        location.replace("/");
      }
    }, 1000);
  }

  throw new Error("404 page rendered");
}

/* =========================
   ALLOWED REFERRER DOMAINS
========================= */
const ALLOWED_DOMAINS = new Set([
  "vplink",
  "inshorturl",
  "lksfy",
  "urllinkshort",
  "arolinks"
]);

/* =========================
   INIT (NO UI SHOWN YET)
========================= */
(function init() {
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // Hide everything initially
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "none";

  // Run referrer check immediately
  checkReferrerAndProceed();
})();

/* =========================
   REFERRER CHECK
========================= */
function checkReferrerAndProceed() {
  const ref = document.referrer;

  // ❌ No referrer → bypass
  if (!ref) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  const refDomain = extractMainDomain(ref);

  // ❌ Invalid domain → bypass
  if (!refDomain || !ALLOWED_DOMAINS.has(refDomain)) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  // ✅ Valid referrer → NOW show verify HTML
  showVerify();
  if (statusEl) statusEl.textContent = "Please complete verification…";
}

/* =========================
   HELPERS
========================= */
function extractMainDomain(ref) {
  try {
    const host = new URL(ref).hostname;
    const parts = host.split(".");
    return parts.length > 1 ? parts[parts.length - 2] : null;
  } catch {
    return null;
  }
}

function showBypass(message) {
  if (bypassBox) bypassBox.style.display = "flex";
  if (verifyBox) verifyBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "none";
  if (statusEl) statusEl.textContent = message;
}

function showVerify() {
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "flex";
  if (notFoundBox) notFoundBox.style.display = "none";
}

/* =========================
   TURNSTILE CALLBACK
========================= */
async function onVerified(token) {
  if (locked) return;
  locked = true;

  if (statusEl) statusEl.textContent = "Verifying request…";

  try {
    const res = await fetch("https://backend.nxlinks.site/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "/" + hash,
        turnstile_token: token
      })
    });

    const data = await res.json();

    if (data.success && data.url) {
      location.replace(data.url);
      return;
    }

    if (data.reason === "not_found") {
      location.replace("/404");
      return;
    }

    showBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    if (statusEl) statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
