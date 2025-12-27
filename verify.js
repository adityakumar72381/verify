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
const statusEl = document.getElementById("status");

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
  // Empty path → redirect to main site
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // Show neutral state first
  showVerify();
  statusEl.textContent = "Checking link integrity…";

  // Delay decision (UX purpose)
  setTimeout(checkReferrerAndProceed, 1000);
})();

/* =========================
   REFERRER CHECK
========================= */
function checkReferrerAndProceed() {
  const ref = document.referrer;

  if (!ref) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  const refDomain = extractMainDomain(ref);

  if (!refDomain || !ALLOWED_DOMAINS.has(refDomain)) {
    showBypass("🚫 BYPASS DETECTED.");
    return;
  }

  // Passed checks → allow Turnstile
  showVerify();
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
  bypassBox.style.display = "flex";
  verifyBox.style.display = "none";
  if (statusEl) statusEl.textContent = message;
}

function showVerify() {
  bypassBox.style.display = "none";
  verifyBox.style.display = "flex";
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
