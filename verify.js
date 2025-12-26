let locked = false;

/* =========================
   PATH & HASH DETECTION
   site.com/abc → hash = "abc"
========================= */
const pathname = location.pathname.replace(/^\/+|\/+$/g, "");
const hash = pathname || null;

/* =========================
   UI ELEMENTS
========================= */
const bypassBox = document.getElementById("bypass");
const verifyBox = document.getElementById("verify");
const statusEl = document.getElementById("status");

/* =========================
   ENTRY POINT
========================= */
(function init() {
  // 🔴 Empty path → redirect to main site
  if (!hash) {
    location.replace("https://nxlinks.site");
    return;
  }

  // 🔴 No referrer → hard bypass
  if (!document.referrer) {
    showBypass();
    return;
  }

  // ✅ Referrer exists → force verification
  showVerify();
})();

/* =========================
   UI HELPERS
========================= */
function showBypass() {
  if (bypassBox) bypassBox.style.display = "flex";
  if (verifyBox) verifyBox.style.display = "none";
}

function showVerify() {
  if (bypassBox) bypassBox.style.display = "none";
  if (verifyBox) verifyBox.style.display = "flex";
}

/* =========================
   TURNSTILE CALLBACK (FORCED)
========================= */
async function onVerified(token) {
  if (locked) return;
  locked = true;

  statusEl.textContent = "Verifying request…";

  try {
    const res = await fetch("https://cdn.nxlinks.site/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: hash,
        turnstile_token: token
      })
    });

    const data = await res.json();

    if (data && data.status === "success" && data.destination) {
      statusEl.textContent = "Redirecting securely…";
      location.replace(data.destination);
      return;
    }

    // ❌ Backend denied
    showBypass();

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Verification failed. Please refresh.";
    locked = false;
  }
}

window.onVerified = onVerified;
