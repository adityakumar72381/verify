let locked = false;
let bypassLocked = false; // 🔒 hard lock when bypass detected

/* =========================
   HASH (site.com/abc)
========================= */
const hash = location.pathname.replace(/^\/+|\/+$/g, "");

/* =========================
   UI ELEMENTS
========================= */
const loadingBox = document.getElementById("loading");
const bypassBox = document.getElementById("bypass");
const verifyBox = document.getElementById("verify");
const notFoundBox = document.getElementById("notfound");
const statusEl = document.getElementById("status");

/* =========================
   HANDLE /404 ROUTE (EARLY EXIT)
========================= */
if (hash === "404") {
  if (loadingBox) loadingBox.style.display = "none";
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "flex";

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
   INIT (LOADER ONLY)
========================= */
(function init() {
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  showLoading("Checking link integrity…");

  // Allow browser to settle referrer
  setTimeout(checkReferrerAndProceed, 800);
})();

/* =========================
   REFERRER CHECK
========================= */
function checkReferrerAndProceed() {
  if (bypassLocked) return;

  const ref = document.referrer;

  if (!ref) {
    lockBypass("🚫 BYPASS DETECTED.");
    return;
  }

  const refDomain = extractMainDomain(ref);
  if (!refDomain || !ALLOWED_DOMAINS.has(refDomain)) {
    lockBypass("🚫 BYPASS DETECTED.");
    return;
  }

  // ✅ PASSED
  showVerify();
  if (statusEl) statusEl.textContent = "Please complete verification…";
}

/* =========================
   HARD BYPASS LOCK
========================= */
function lockBypass(message) {
  bypassLocked = true;
  locked = true; // ⛔ prevents Turnstile + API
  showBypass(message);
}

/* =========================
   UI HELPERS
========================= */
function showLoading(message) {
  if (loadingBox) loadingBox.style.display = "flex";
  if (verifyBox) verifyBox.style.display = "none";
  if (bypassBox) bypassBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "none";
  if (statusEl && message) statusEl.textContent = message;
}

function showVerify() {
  if (loadingBox) loadingBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "flex";
  if (bypassBox) bypassBox.style.display = "none";
  if (notFoundBox) notFoundBox.style.display = "none";
}

function showBypass(message) {
  if (loadingBox) loadingBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "none";
  if (bypassBox) bypassBox.style.display = "flex";
  if (notFoundBox) notFoundBox.style.display = "none";
  if (statusEl && message) statusEl.textContent = message;
}

/* =========================
   DOMAIN HELPER
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

/* =========================
   TURNSTILE CALLBACK
========================= */
async function onVerified(token) {
  // ⛔ HARD BLOCK
  if (locked || bypassLocked) return;

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

    lockBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    if (statusEl) statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
