# Live zetten — automatische PDF-levering

De website gebruikt **Mollie API checkout** met automatische PDF-levering per e-mail na betaling.

> Volledige uitleg voor niet-technisch gebruik: **`AUTO-LEVERING.md`**

---

## Stap 1: Mollie API key

1. Log in op [mollie.com/dashboard](https://www.mollie.com/dashboard)
2. Voltooi bedrijfsgegevens (KVK, bankrekening)
3. Ga naar **Developers → API keys**
4. Kopieer je **Live API key** (`live_...`) of test key (`test_...`)

---

## Stap 2: E-mail provider instellen

Kies **één** optie:

### Optie A: Resend (aanbevolen)

1. Maak account op [resend.com](https://resend.com)
2. Verifieer domein `huizenmarkt-nederland.nl`
3. Maak API key aan

### Optie B: SMTP (Namecheap e-mail)

Gebruik je bestaande mailbox `info@huizenmarkt-nederland.nl` met SMTP-gegevens.

---

## Stap 3: Netlify deploy + environment variables

1. Deploy de map `website/` naar Netlify (Git of ZIP — zie hieronder)
2. Zorg dat `netlify.toml` actief is (`functions = "netlify/functions"`)
3. Ga naar **Site settings → Environment variables**

**Minimaal verplicht:**

```
MOLLIE_API_KEY=live_xxxxxxxx
FROM_EMAIL=info@huizenmarkt-nederland.nl
FROM_NAME=Huizenmarkt Nederland
```

**Plus Resend óf SMTP:**

```
RESEND_API_KEY=re_xxxxxxxx
```

of

```
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=info@huizenmarkt-nederland.nl
SMTP_PASS=jouw-wachtwoord
SMTP_SECURE=false
```

4. **Redeploy** na het toevoegen van env vars

---

## Stap 4: PDF's klaarzetten

```bash
cd stories/html
node build-starter-pdf.mjs
node build-beleggings-pdf.mjs

mkdir -p ../../website/downloads
cp ../../products/starter-pack-Q3-2026.pdf ../../website/downloads/
cp ../../products/beleggings-pack-Q3-2026.pdf ../../website/downloads/
```

Deploy opnieuw zodat PDF's op de server staan.

---

## Stap 5: Testen

1. Zet eerst `MOLLIE_API_KEY=test_...` voor testbetaling
2. Klik op de site **Koop met iDEAL**
3. Betaal in Mollie testmodus
4. Controleer:
   - Bedankpagina toont bevestiging + downloadknop
   - PDF komt per e-mail binnen
5. Schakel over naar live API key

---

## Configuratie website

In `config.js` staat:

```javascript
checkout: 'api',  // automatische flow
```

Fallback naar handmatige payment links:

```javascript
checkout: 'links',
paymentLinks: {
  'starter-pack': 'https://payment-links.mollie.com/payment/...',
  'beleggings-pack': 'https://payment-links.mollie.com/payment/...'
}
```

---

## Checklist

- [ ] Mollie account + bedrijfsgegevens compleet
- [ ] `MOLLIE_API_KEY` in Netlify
- [ ] `RESEND_API_KEY` of `SMTP_*` in Netlify
- [ ] PDF's in `website/downloads/`
- [ ] Netlify deploy met functions (niet alleen statische Drop)
- [ ] Testbetaling + PDF per e-mail ontvangen
- [ ] Live API key geactiveerd

---

## Hulp

- Technische setup Mollie: `MOLLIE-SETUP.md`
- Automatische levering uitleg: `AUTO-LEVERING.md`
- DNS/domein: `DEPLOY-NAMECHEAP.md`
