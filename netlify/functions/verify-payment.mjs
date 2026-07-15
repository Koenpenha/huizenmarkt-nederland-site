import { wasEmailSent } from "./lib/idempotency.mjs";
import { getProduct } from "./lib/products.mjs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "MOLLIE_API_KEY niet geconfigureerd" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const paymentId = new URL(req.url).searchParams.get("id");
  if (!paymentId) {
    return new Response(JSON.stringify({ error: "payment id ontbreekt" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payment = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: payment.detail || "Betaling niet gevonden" }), {
      status: res.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const paid = payment.status === "paid";
  const productSlug = payment.metadata?.product || null;
  const product = productSlug ? getProduct(productSlug) : null;
  const filename = payment.metadata?.filename || product?.filename || null;
  const emailSent = paid ? await wasEmailSent(paymentId) : false;

  return new Response(
    JSON.stringify({
      paid,
      status: payment.status,
      product: productSlug,
      productName: payment.metadata?.productName || product?.name || null,
      downloadUrl: paid && filename ? `/.netlify/functions/download-pdf?id=${encodeURIComponent(paymentId)}` : null,
      emailSent,
      emailPending: paid && !emailSent,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
};
