const NodeClam = require("clamscan");
const fs = require("fs");

let clamscan;

async function initClam() {
  if (clamscan) return clamscan;

  const cl = new NodeClam().init({
    removeInfected: false,       // we handle deletion
    quarantineInfected: false,
    scanLog: null,
    debugMode: false,

    clamdscan: {
      socket: false,
      host: "127.0.0.1",
      port: 3310,
      timeout: 60000,
      localFallback: true
    },

    clamscan: {
      path: "/opt/homebrew/bin/clamscan", // ✅ macOS homebrew path
      scanArchives: true,
      active: true
    }
  });

  clamscan = await cl;
  return clamscan;
}

async function scanFile(filePath) {
  const clam = await initClam();
  const { isInfected, viruses } = await clam.scanFile(filePath);

  if (isInfected) {
    // 🔥 immediately delete
    fs.unlinkSync(filePath);

    throw new Error(
      `Security threat detected (${viruses.join(", ")}). Upload blocked.`
    );
  }

  return true;
}

module.exports = { scanFile };
