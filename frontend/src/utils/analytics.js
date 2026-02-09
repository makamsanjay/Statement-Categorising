const GA_ID = "G-ZJVH8MV221";
let enabled = false;

export function enableAnalytics() {
  if (enabled || !window.gtag) return;
  enabled = true;

  // Grant analytics consent
  window.gtag("consent", "update", {
    analytics_storage: "granted",
  });

  // Configure GA
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
    send_page_view: false, // SPA handles this manually
  });

  console.log("Analytics enabled");
}

export function trackPageView(path) {
  if (!window.gtag || !enabled) return;

  window.gtag("event", "page_view", {
    page_path: path,
    send_to: GA_ID,
  });
}
