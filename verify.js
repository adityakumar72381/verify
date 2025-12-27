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
  loadingBox.style.display = "flex";
  bypassBox.style.display = "none";
  verifyBox.style.display = "none";
}

function hideLoading() {
  loadingBox.style.display = "none";
}

/* =========================
   INIT
========================= */
(function init() {
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  showLoading();
  statusEl.textContent = "Checking link integrity…";

  const savedDecision = sessionStorage.getItem(SESSION_KEY);
  if (savedDecision === "bypass") {
    decisionLocked = true;
    hideLoading();
    bypassBox.style.display = "flex";
    statusEl.textContent = "🚫 BYPASS DETECTED.";
    return;
  }

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

  decisionLocked = true;
  hideLoading();
  verifyBox.style.display = "flex";
  statusEl.textContent = "Please complete verification…";
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
  statusEl.textContent = message;
}

/* =========================
   TURNSTILE CALLBACK
========================= */
async function onVerified(token) {
  if (locked) return;
  locked = true;

  statusEl.textContent = "Verifying request…";

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
      sessionStorage.setItem(SESSION_KEY, "verify"); // ✅ SAVE ONLY ON SUCCESS
      location.replace(data.url);
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "bypass");
    showBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
