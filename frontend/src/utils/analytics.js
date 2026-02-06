let loaded = false;

export function loadGoogleAnalytics() {
  if (loaded) return;
  loaded = true;

  // 🔒 DO NOTHING for now
  // When ready, uncomment below and add GA ID

  /*
  const script = document.createElement("script");
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
  */

  console.log("📊 Google Analytics loaded (consent granted)");
}
