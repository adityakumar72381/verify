let locked = false;
let decisionLocked = false;

/* =========================
   HASH (site.com/abc)
========================= */
const hash = location.pathname.replace(/^\/+|\/+$/g, "");

/* =========================
   SESSION + REFERRER CACHE
========================= */
const SESSION_KEY = "nx_decision:" + hash;
const INITIAL_REFERRER = document.referrer;

/* =========================
   UI ELEMENTS
========================= */
const loadingBox = document.getElementById("loading");
const bypassBox  = document.getElementById("bypass");
const verifyBox  = document.getElementById("verify");
const statusEl   = document.getElementById("status");

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
   LOADER CONTROLS
========================= */
function showLoading() {
  if (loadingBox) loadingBox.style.display = "flex";
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "none";
}

function hideLoading() {
  if (loadingBox) loadingBox.style.display = "none";
}

/* =========================
   INIT
========================= */
(function init() {
  // Empty path → redirect
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // SHOW LOADER FIRST
  showLoading();
  if (statusEl) statusEl.textContent = "Checking link integrity…";

  // Restore decision (same link, same tab)
  const savedDecision = sessionStorage.getItem(SESSION_KEY);

  if (savedDecision === "verify") {
    decisionLocked = true;
    hideLoading();
    verifyBox.style.display = "flex";
    if (statusEl) statusEl.textContent = "Please complete verification…";
    return;
  }

  if (savedDecision === "bypass") {
    decisionLocked = true;
    hideLoading();
    bypassBox.style.display = "flex";
    if (statusEl) statusEl.textContent = "🚫 BYPASS DETECTED.";
    return;
  }

  // Delay decision (UX + stability)
  setTimeout(checkReferrerAndProceed, 1000);
})();

/* =========================
   REFERRER CHECK
========================= */
function checkReferrerAndProceed() {
  if (decisionLocked) return;

  const ref = INITIAL_REFERRER;

  if (!ref) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  const refDomain = extractMainDomain(ref);

  if (!refDomain || !ALLOWED_DOMAINS.has(refDomain)) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  showVerify();
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
  if (decisionLocked) return;
  decisionLocked = true;

  sessionStorage.setItem(SESSION_KEY, "bypass");

  hideLoading();
  bypassBox.style.display = "flex";
  verifyBox.style.display = "none";
  if (statusEl) statusEl.textContent = message;
}

function showVerify() {
  if (decisionLocked) return;
  decisionLocked = true;

  sessionStorage.setItem(SESSION_KEY, "verify");

  hideLoading();
  bypassBox.style.display = "none";
  verifyBox.style.display = "flex";
  if (statusEl) statusEl.textContent = "Please complete verification…";
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

    showBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    if (statusEl) statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
