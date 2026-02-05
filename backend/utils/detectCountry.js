const geoip = require("geoip-lite");

/**
 * Detect country + pricing group from request IP
 */
module.exports = async function detectPricingGroupFromIP(req) {
  try {
    // 🔍 Get client IP safely (proxy / ngrok / prod)
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "";

    // Normalize localhost IPv6
    if (ip === "::1") ip = "127.0.0.1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    const geo = geoip.lookup(ip);

    // 🌍 Country code (ISO-2)
    const country = geo?.country || "IN";

    // 💰 Pricing group mapping
    let pricingGroup = "INR";
    if (["US"].includes(country)) pricingGroup = "USD";
    else if (["GB"].includes(country)) pricingGroup = "GBP";
    else if (
      ["FR", "DE", "ES", "IT", "NL", "BE", "EU"].includes(country)
    )
      pricingGroup = "EUR";

    console.log("🌍 IP:", ip);
    console.log("🌍 COUNTRY:", country);
    console.log("💰 PRICING GROUP:", pricingGroup);

    return {
      country,
      pricingGroup
    };
  } catch (err) {
    console.error("❌ Geo detection failed:", err);
    return {
      country: "IN",
      pricingGroup: "INR"
    };
  }
};
