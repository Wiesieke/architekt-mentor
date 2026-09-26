// api/enquiry.js — messages from the public contact form, sent through LH.pl SMTP.
const nodemailer = require("nodemailer");

const MAILBOX = "architektura@sensinte.com";
const SERVICES = new Set([
  "HLD w 5 dni", "Przegląd architektury", "Konsultacja", "Nie wiem jeszcze — doradźcie"
]);
const WINDOW_MS = 15 * 60 * 1000, LIMIT = 3;
const attempts = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(t => t > now - WINDOW_MS);
  if (recent.length >= LIMIT) { attempts.set(ip, recent); return true; }
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 2000) {
    for (const [key, values] of attempts) {
      if (values[values.length - 1] < now - WINDOW_MS) attempts.delete(key);
    }
  }
  return false;
}

function cleanLine(value, max) {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, max + 1) : "";
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Użyj metody POST." });
  if (!process.env.LH_SMTP_HOST || !process.env.LH_SMTP_USER || !process.env.LH_SMTP_PASSWORD) {
    return res.status(503).json({ error: "Wysyłka jest chwilowo niedostępna. Napisz bezpośrednio na architektura@sensinte.com." });
  }
  if (!/^(mail-serwer\d+|c\d+)\.lh\.pl$/i.test(process.env.LH_SMTP_HOST)) {
    return res.status(503).json({ error: "Wysyłka jest chwilowo niedostępna." });
  }
  if (!/^[a-z0-9._+-]+@sensinte\.com$/i.test(process.env.LH_SMTP_USER)) {
    return res.status(503).json({ error: "Wysyłka jest chwilowo niedostępna." });
  }
  if (Number(req.headers["content-length"]) > 7000) return res.status(413).json({ error: "Wiadomość jest za długa." });
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
    return res.status(415).json({ error: "Niepoprawny format zapytania." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Niepoprawne dane." }); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ error: "Niepoprawne dane." });
  // Hidden field catches basic form bots. Treat as submitted without sending.
  if (body.website) return res.status(200).json({ ok: true });
  const name = cleanLine(body.name, 120);
  const company = cleanLine(body.company, 120);
  const email = cleanLine(body.email, 254);
  const service = cleanLine(body.service, 80);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (name.length < 2 || name.length > 120 || company.length > 120 ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !SERVICES.has(service) || message.length < 10 || message.length > 3000) {
    return res.status(400).json({ error: "Sprawdź imię, e-mail i opis (10–3000 znaków)." });
  }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  // Best effort per-instance limit. Add shared rate limiting / bot challenge if traffic grows.
  if (limited(ip)) return res.status(429).json({ error: "Zbyt wiele zapytań. Spróbuj później." });

  try {
    const transport = nodemailer.createTransport({
      host: process.env.LH_SMTP_HOST,
      port: 465,
      secure: true,
      auth: { user: process.env.LH_SMTP_USER, pass: process.env.LH_SMTP_PASSWORD },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
    await transport.sendMail({
      from: process.env.LH_SMTP_USER,
      to: MAILBOX,
      replyTo: { name, address: email },
      subject: "Zapytanie ze strony: " + service,
      text: [
        "Imię i nazwisko: " + name,
        "Firma: " + company,
        "E-mail: " + email,
        "Usługa: " + service,
        "",
        "Opis:",
        message
      ].join("\n")
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    // Do not log visitor content or SMTP credentials.
    console.error("Enquiry delivery failed:", error?.code || "SMTP_ERROR");
    return res.status(502).json({ error: "Wiadomość nie została wysłana. Spróbuj ponownie lub napisz bezpośrednio na architektura@sensinte.com." });
  }
};
