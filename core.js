(() => {
  const s = document.createElement("script");
  s.src = "/runtime.js?v=" + Date.now().toString(36);
  s.async = true;
  s.onerror = () => location.replace("/");
  document.head.appendChild(s);
})();
