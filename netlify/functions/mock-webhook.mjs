/**
 * Lokale test-helper: simuleert een Mollie webhook-call.
 * Alleen actief als MOCK_WEBHOOK_SECRET is gezet en overeenkomt met ?secret=...
 *
 * POST /.netlify/functions/mock-webhook?secret=JOUW_SECRET
 * Body: { "paymentId": "tr_xxxx" }
 */
import { getCustomerEmail, sendProductEmail } from "./lib/email.mjs";
import { markEmailSent, wasEmailSent } from "./lib/idempotency.mjs";
import { getProduct } from "./lib/products.mjs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function fetchPayment(paymentId) {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error("MOLLIE_API_KEY niet geconfigureerd");

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payment = await res.json();
  if (!res.ok) throw new Error(payment.detail || "Betaling niet gevonden");
  return payment;
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const secret = process.env.MOCK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: "MOCK_WEBHOOK_SECRET niet geconfigureerd" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== secret) {
    return new Response(JSON.stringify({ error: "Ongeldig secret" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ongeldige JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const paymentId = body.paymentId;
  if (!paymentId) {
    return new Response(JSON.stringify({ error: "paymentId ontbreekt" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const payment = await fetchPayment(paymentId);
  const product = getProduct(payment.metadata?.product);
  const customerEmail = getCustomerEmail(payment);

  if (payment.status !== "paid") {
    return new Response(
      JSON.stringify({
        ok: false,
        status: payment.status,
        message: "Betaling is nog niet paid — voltooi eerst in Mollie testmodus",
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (await wasEmailSent(paymentId)) {
    return new Response(
      JSON.stringify({ ok: true, duplicate: true, paymentId, email: customerEmail }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const sendResult = await sendProductEmail({
    to: customerEmail,
    productName: payment.metadata?.productName || product?.name || "PDF Pack",
    filename: payment.metadata?.filename || product?.filename,
    paymentId,
  });

  if (!sendResult.ok) {
    return new Response(JSON.stringify({ ok: false, error: sendResult.error, paymentId, email: customerEmail }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  await markEmailSent(paymentId, {
    email: customerEmail,
    product: payment.metadata?.product,
    provider: sendResult.provider,
    mock: true,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      paymentId,
      email: customerEmail,
      provider: sendResult.provider,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
};
