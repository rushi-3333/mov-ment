/**
 * Email and SMS delivery (integration points).
 * Set SMTP/SMS env vars to enable; otherwise logs only.
 * - EMAIL_ENABLED, SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - SMS_ENABLED, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 */

async function sendEmail(to, subject, body) {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("[Email stub]", { to, subject, body: body?.slice(0, 80) });
    return { ok: true, stub: true };
  }
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    return { ok: true };
  } catch (err) {
    console.error("Send email error:", err.message);
    return { ok: false, error: err.message };
  }
}

async function sendSMS(to, message) {
  if (process.env.SMS_ENABLED !== "true") {
    console.log("[SMS stub]", { to: to?.slice(-4), message: message?.slice(0, 40) });
    return { ok: true, stub: true };
  }
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      console.log("[SMS] Twilio not configured");
      return { ok: false, error: "SMS not configured" };
    }
    const client = require("twilio")(accountSid, authToken);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to: to.replace(/\D/g, "").length >= 10 ? to : undefined,
    });
    return { ok: true };
  } catch (err) {
    console.error("Send SMS error:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail, sendSMS };
