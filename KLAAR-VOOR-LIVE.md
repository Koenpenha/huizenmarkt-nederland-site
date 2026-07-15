# Klaar voor live — Mollie payment links

`config.js` bevat nog placeholders. Volg deze checklist (copy-paste klaar).

---

## PRIJZEN — NOOIT HETZELFDE BEDRAG

| Product | Bedrag | Slug in config.js |
|---------|--------|-------------------|
| **Starter Pack Q3 2026** | **EUR 14,95** | `starter-pack` |
| **Beleggings Pack Q3 2026** | **EUR 34,95** | `beleggings-pack` |

**Controleer altijd vóór publicatie:** Starter = 14,95 · Belegging = 34,95.
**Nooit beide op hetzelfde bedrag** — dat is een veelgemaakte fout in het Mollie-dashboard.

Website (`index.html`, `config.js`) en Netlify (`create-payment.mjs`) staan al goed.
Alleen de **Mollie payment links** moeten het juiste bedrag hebben.

---

## Stap 1: Maak 2 payment links in Mollie

1. Ga naar https://my.mollie.com/dashboard/org_19215289/payment-links
2. **Payment links** -> **Create payment link**
3. Maak **twee aparte links** met **verschillende bedragen**:

| Product | Bedrag | Omschrijving | Redirect URL |
|---------|--------|--------------|--------------|
| Starter Pack Q3 2026 | **EUR 14,95** | Starter Pack Q3 2026 | https://huizenmarkt-nederland.nl/bedankt.html |
| Beleggings Pack Q3 2026 | **EUR 34,95** | Beleggings Pack Q3 2026 | https://huizenmarkt-nederland.nl/bedankt.html |

**Instellingen per link:**
- Currency: **EUR**
- Betaalmethoden: **iDEAL** aan (Bancontact optioneel)
- Redirect URL: `https://huizenmarkt-nederland.nl/bedankt.html`

---

## Fout herstellen: Beleggings-link op EUR 14,95

Als je per ongeluk **beide links op EUR 14,95** hebt aangemaakt:

1. Open https://my.mollie.com/dashboard/org_19215289/payment-links
2. Zoek de link met naam **Beleggings Pack** (of vergelijkbaar) die **EUR 14,95** toont
3. **Verwijder** die verkeerde Beleggings-link (of deactiveer)
4. **Create payment link** -> nieuwe link:
   - Naam: **Beleggings Pack Q3 2026**
   - Bedrag: **EUR 34,95** (niet 14,95!)
   - Redirect: `https://huizenmarkt-nederland.nl/bedankt.html`
5. Laat de **Starter Pack**-link op **EUR 14,95** staan — die klopt

**Let op:** Mollie payment links zijn vaak niet achteraf te wijzigen qua bedrag. Maak liever een **nieuwe** link op 34,95 en verwijder de oude.

---

## Stap 2: Plak links in config.js

Open `website/config.js` en vervang regels 6-7:

```javascript
paymentLinks: {
  'starter-pack': 'https://paymentlink.mollie.com/payment/JOUW-STARTER-LINK',
  'beleggings-pack': 'https://paymentlink.mollie.com/payment/JOUW-BELEGGINGS-LINK'
},
```

**Mapping (niet verwisselen):**

| Slug | Product | Bedrag | Mollie-link |
|------|---------|--------|-------------|
| `starter-pack` | Starter Pack Q3 2026 | EUR 14,95 | link met 14,95 in dashboard |
| `beleggings-pack` | Beleggings Pack Q3 2026 | EUR 34,95 | link met 34,95 in dashboard |

---

## Stap 3: Test + redeploy

1. Lokaal testen: `cd website && npx serve .` -> http://localhost:3000
2. Klik **Koop met iDEAL** bij beide packs -> controleer bedrag in Mollie-checkout
3. Deploy opnieuw naar Netlify (ZIP of CLI) zodat `config.js` live staat
4. Doe een testbetaling (eventueel klein bedrag in testmodus)

---

## Na betaling (handmatig)

Mollie stuurt een bevestigingsmail. Stuur het juiste PDF naar de klant:

- **Starter Pack (14,95)** -> `website/downloads/starter-pack-Q3-2026.pdf`
- **Beleggings Pack (34,95)** -> `website/downloads/beleggings-pack-Q3-2026.pdf`

---

## Checklist vóór live

- [ ] Starter-link = EUR 14,95 in Mollie-dashboard
- [ ] Beleggings-link = EUR 34,95 in Mollie-dashboard (niet 14,95!)
- [ ] Beide URLs in `config.js` geplakt (juiste slug)
- [ ] Test-checkout toont juiste bedragen
- [ ] Site gedeployed naar Netlify
