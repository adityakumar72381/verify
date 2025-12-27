let locked = false;
let decisionLocked = false;

/* =========================
HASH (site.com/abc)
========================= */
const hash = location.pathname.replace(/^\/+|\/+$/g, "");

/* =========================
CACHE REFERRER (ONCE)
========================= */
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
INIT
========================= */
(function init() {
  // Empty path → redirect
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // STEP 1: detect referrer immediately
  const isAllowed = isValidReferrer(INITIAL_REFERRER);

  // STEP 2: show loader AFTER detection
  showLoading();
  statusEl.textContent = "Checking link integrity…";

  // STEP 3: lock & show result
  setTimeout(() => {
    if (decisionLocked) return;
    decisionLocked = true;

    if (!isAllowed) {
      showBypass("🚫 BYPASS DETECTED.");
    } else {
      showVerify();
      statusEl.textContent = "Please complete verification…";
    }
  }, 1000);
})();

/* =========================
REFERRER VALIDATION
========================= */
function isValidReferrer(ref) {
  if (!ref) return false;

  const domain = extractMainDomain(ref);
  return domain && ALLOWED_DOMAINS.has(domain);
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

/* =========================
UI HELPERS
========================= */
function showLoading() {
  loadingBox.style.display = "flex";
  bypassBox.style.display  = "none";
  verifyBox.style.display  = "none";
}

function showBypass(message) {
  loadingBox.style.display = "none";
  bypassBox.style.display  = "flex";
  verifyBox.style.display  = "none";
  statusEl.textContent = message;
}

function showVerify() {
  loadingBox.style.display = "none";
  bypassBox.style.display  = "none";
  verifyBox.style.display  = "flex";
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
      location.replace(data.url);
      return;
    }

    showBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
