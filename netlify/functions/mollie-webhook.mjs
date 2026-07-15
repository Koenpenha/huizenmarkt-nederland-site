import { getCustomerEmail, sendProductEmail } from "./lib/email.mjs";
import { markEmailSent, wasEmailSent } from "./lib/idempotency.mjs";
import { getProduct } from "./lib/products.mjs";

async function fetchPayment(paymentId) {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error("MOLLIE_API_KEY niet geconfigureerd");

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payment = await res.json();
  if (!res.ok) {
    throw new Error(payment.detail || payment.title || "Betaling ophalen mislukt");
  }
  return payment;
}

async function deliverPdfEmail(payment) {
  const paymentId = payment.id;
  const productSlug = payment.metadata?.product;
  const product = getProduct(productSlug);

  if (!product) {
    console.error(`[webhook] Onbekend product voor ${paymentId}: ${productSlug}`);
    return { ok: false, error: "Onbekend product" };
  }

  if (await wasEmailSent(paymentId)) {
    console.log(`[webhook] E-mail al verstuurd voor ${paymentId}`);
    return { ok: true, duplicate: true };
  }

  const customerEmail = getCustomerEmail(payment);
  if (!customerEmail) {
    console.error(`[webhook] Geen e-mailadres voor ${paymentId}`);
    return { ok: false, error: "Geen klant-e-mailadres" };
  }

  const sendResult = await sendProductEmail({
    to: customerEmail,
    productName: payment.metadata?.productName || product.name,
    filename: payment.metadata?.filename || product.filename,
    paymentId,
  });

  if (!sendResult.ok) {
    console.error(`[webhook] E-mail mislukt voor ${paymentId}:`, sendResult.error);
    return sendResult;
  }

  await markEmailSent(paymentId, {
    email: customerEmail,
    product: productSlug,
    provider: sendResult.provider,
  });

  console.log(`[webhook] PDF verstuurd naar ${customerEmail} voor ${paymentId} via ${sendResult.provider}`);
  return { ok: true, email: customerEmail, provider: sendResult.provider };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("OK", { status: 200 });

  try {
    const body = await req.text();
    const paymentId = new URLSearchParams(body).get("id");
    if (!paymentId) {
      console.warn("[webhook] Geen payment id in body");
      return new Response("OK", { status: 200 });
    }

    const payment = await fetchPayment(paymentId);

    if (payment.status !== "paid") {
      console.log(`[webhook] ${paymentId} status=${payment.status}, geen actie`);
      return new Response("OK", { status: 200 });
    }

    await deliverPdfEmail(payment);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[webhook] Onverwachte fout:", err);
    return new Response("OK", { status: 200 });
  }
};
