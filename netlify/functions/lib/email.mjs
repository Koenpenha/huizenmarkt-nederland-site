import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS = path.join(__dirname, "..", "..", "..", "downloads");

const FROM_EMAIL = process.env.FROM_EMAIL || "info@huizenmarkt-nederland.nl";
const FROM_NAME = process.env.FROM_NAME || "Huizenmarkt Nederland";

function readPdfBase64(filename) {
  const safeName = path.basename(filename);
  const filePath = path.join(DOWNLOADS, safeName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF niet gevonden: ${safeName}`);
  }
  return fs.readFileSync(filePath).toString("base64");
}

function buildEmailContent(productName) {
  return {
    subject: `Je ${productName} — Huizenmarkt Nederland`,
    text: [
      "Hoi,",
      "",
      `Bedankt voor je aankoop van de ${productName}.`,
      "Je PDF staat als bijlage in deze e-mail.",
      "",
      "Veel leesplezier met de marktanalyse.",
      "",
      "Groet,",
      "Huizenmarkt Nederland",
      "info@huizenmarkt-nederland.nl",
    ].join("\n"),
    html: `
      <p>Hoi,</p>
      <p>Bedankt voor je aankoop van de <strong>${productName}</strong>.</p>
      <p>Je PDF staat als bijlage in deze e-mail.</p>
      <p>Veel leesplezier met de marktanalyse.</p>
      <p>Groet,<br/>Huizenmarkt Nederland<br/>
      <a href="mailto:info@huizenmarkt-nederland.nl">info@huizenmarkt-nederland.nl</a></p>
    `.trim(),
  };
}

async function sendViaResend({ to, productName, filename, paymentId }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("VERVANG") || apiKey.includes("re_xxxx")) {
    return { ok: false, skipped: true, reason: "RESEND_API_KEY niet ingesteld" };
  }

  const content = buildEmailContent(productName);
  const pdfBase64 = readPdfBase64(filename);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `hm-${paymentId}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: [{ filename, content: pdfBase64 }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.message || data.error || `Resend HTTP ${res.status}` };
  }
  return { ok: true, provider: "resend", id: data.id || null };
}

async function sendViaSmtp({ to, productName, filename }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return { ok: false, skipped: true, reason: "SMTP niet geconfigureerd" };
  }

  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const content = buildEmailContent(productName);
  const filePath = path.join(DOWNLOADS, path.basename(filename));

  const info = await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: [{ filename: path.basename(filename), path: filePath }],
  });

  return { ok: true, provider: "smtp", id: info.messageId || null };
}

export async function sendProductEmail({ to, productName, filename, paymentId }) {
  if (!to) {
    return { ok: false, error: "Geen klant-e-mailadres beschikbaar" };
  }

  const resendResult = await sendViaResend({ to, productName, filename, paymentId });
  if (resendResult.ok) return resendResult;
  if (!resendResult.skipped) return resendResult;

  const smtpResult = await sendViaSmtp({ to, productName, filename });
  if (smtpResult.ok) return smtpResult;
  if (!smtpResult.skipped) return smtpResult;

  return {
    ok: false,
    error: "Geen e-mailprovider geconfigureerd (zet RESEND_API_KEY of SMTP_* in Netlify)",
  };
}

export function getCustomerEmail(payment) {
  return (
    payment?.billingEmail ||
    payment?.customerDetails?.email ||
    payment?.details?.consumerEmail ||
    payment?.metadata?.customerEmail ||
    null
  );
}
