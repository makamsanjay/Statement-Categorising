const router = require("express").Router();
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  try {
    const { name, email, type, message } = req.body;

    // 🔒 Defensive validation
    if (!name || !email || !type || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    // 🔒 Prevent crash if type is not string
    const safeType =
      typeof type === "string" ? type.toUpperCase() : "GENERAL";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Support Form" <${process.env.SUPPORT_EMAIL}>`,
      to: process.env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Support] ${safeType} request`,
      html: `
        <h3>New Support Request</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Type:</b> ${type}</p>
        <p><b>Message:</b><br/>${message}</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("SUPPORT ERROR:", err);
    res.status(500).json({ error: "Failed to send support request" });
  }
});

module.exports = router;
