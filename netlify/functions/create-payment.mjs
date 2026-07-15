import { getProduct, getSiteUrl } from "./lib/products.mjs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "MOLLIE_API_KEY niet geconfigureerd" }), {
      status: 500,
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

  const product = getProduct(body.product);
  if (!product) {
    return new Response(JSON.stringify({ error: "Onbekend product" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const siteUrl = getSiteUrl();
  const redirectUrl = `${siteUrl}/bedankt.html?product=${encodeURIComponent(body.product)}`;

  const paymentRes = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: product.amount },
      description: product.description,
      redirectUrl,
      webhookUrl: `${siteUrl}/.netlify/functions/mollie-webhook`,
      metadata: {
        product: body.product,
        filename: product.filename,
        productName: product.name,
      },
    }),
  });

  const payment = await paymentRes.json();
  if (!paymentRes.ok) {
    return new Response(JSON.stringify({ error: payment.detail || payment.title || "Mollie fout" }), {
      status: paymentRes.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    return new Response(JSON.stringify({ error: "Geen checkout URL" }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      checkoutUrl,
      paymentId: payment.id,
      product: body.product,
      productName: product.name,
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
};
