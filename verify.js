let locked = false;

/* =========================
   HASH (site.com/abc)
========================= */
const hash = location.pathname.replace(/^\/+|\/+$/g, "");

/* =========================
   UI
========================= */
const bypassBox = document.getElementById("bypass");
const verifyBox = document.getElementById("verify");
const statusEl = document.getElementById("status");

/* =========================
   INIT
========================= */
(function init() {
  // Empty path → main site
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // Always show verify page
  showVerify();
})();

/* =========================
   UI HELPERS
========================= */
function showBypass(message = "🚫 Access denied.") {
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

    // Backend rejected → bypass
    showBypass("🚫 " + (data.reason || "Access denied"));

  } catch (e) {
    console.error(e);
    locked = false;
    statusEl.textContent = "❌ Verification failed. Try again.";
  }
}

window.onVerified = onVerified;
