/* =========================
   BACKGROUND EFFECTS
========================= */
function createBackgroundEffects() {
  const container = document.getElementById("particles");
  if (!container) return;

  // Floating particles
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = (15 + Math.random() * 20) + "s";
    particle.style.animationDelay = Math.random() * 15 + "s";
    container.appendChild(particle);
  }

  // Snowflakes
  for (let i = 0; i < 20; i++) {
    const snowflake = document.createElement("div");
    snowflake.className = "snowflake";
    snowflake.textContent = "❄";

    snowflake.style.left = Math.random() * 100 + "%";
    snowflake.style.animationDuration = (12 + Math.random() * 18) + "s";
    snowflake.style.animationDelay = Math.random() * 10 + "s";
    snowflake.style.fontSize = (0.5 + Math.random()) + "rem";
    snowflake.style.opacity = 0.2 + Math.random() * 0.4;

    container.appendChild(snowflake);
  }
}

document.addEventListener("DOMContentLoaded", createBackgroundEffects);
