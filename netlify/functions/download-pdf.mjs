import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS = path.join(__dirname, "..", "..", "downloads");

export default async (req) => {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return new Response("Niet geconfigureerd", { status: 500 });

  const paymentId = new URL(req.url).searchParams.get("id");
  if (!paymentId) return new Response("Geen toegang", { status: 403 });

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payment = await res.json();
  if (!res.ok || payment.status !== "paid") {
    return new Response("Betaling niet bevestigd", { status: 403 });
  }

  const filename = payment.metadata?.filename;
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new Response("Bestand niet gevonden", { status: 404 });
  }

  const filePath = path.join(DOWNLOADS, path.basename(filename));
  if (!fs.existsSync(filePath)) return new Response("PDF niet beschikbaar", { status: 404 });

  const data = fs.readFileSync(filePath);
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${path.basename(filename)}"`,
      "Cache-Control": "no-store",
    },
  });
};
