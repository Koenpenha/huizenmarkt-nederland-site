# Mollie setup — API checkout + auto e-mail

Standaard: `checkout: api` in config.js

## Netlify env vars

Verplicht:
- MOLLIE_API_KEY
- FROM_EMAIL
- FROM_NAME

E-mail (kies een):
- RESEND_API_KEY (aanbevolen)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE

Test:
- MOCK_WEBHOOK_SECRET

## Functions

| Function | Doel |
|----------|------|
| create-payment | Start Mollie checkout |
| mollie-webhook | PDF per e-mail bij paid |
| verify-payment | Status voor bedankpagina |
| download-pdf | Beveiligde PDF download |
| mock-webhook | Webhook simuleren (test) |

## Fallback

Zet `checkout: links` en vul paymentLinks in voor handmatige modus.