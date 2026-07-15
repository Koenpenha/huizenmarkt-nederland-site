# Huizenmarkt Website

Landing page + verkoop via **Mollie payment links** (iDEAL).

## Lokaal testen

```bash
cd website && npx serve .
```

Open http://localhost:3000 — knoppen werken pas als payment links in `config.js` staan.

## Live zetten

Zie **`ACTIVATIE.md`** (3 stappen: Mollie links → Netlify → PDF-levering).

Technische details: **`MOLLIE-SETUP.md`**

Domein DNS: **`DEPLOY-NAMECHEAP.md`**

## PDF's genereren

```bash
cd ../stories/html
node build-starter-pdf.mjs
node build-beleggings-pdf.mjs
cp ../../products/*.pdf ../../website/downloads/
```

## Config (`config.js`)

| Veld | Waarde | Uitleg |
|------|--------|--------|
| `mode` | `'live'` | Verkoop aan |
| `checkout` | `'links'` | Mollie payment links (standaard) |
| `paymentLinks` | Mollie URLs | Vervang placeholders na aanmaken links |

Optioneel later: `checkout: 'api'` + `MOLLIE_API_KEY` op Netlify voor auto-download.

## Jij hoeft alleen nog

- [ ] Mollie payment links aanmaken (2×)
- [ ] Links plakken in `config.js`
- [ ] PDF's in `downloads/` + deploy
- [ ] Domein koppelen (Namecheap → Netlify)
- [ ] MailerLite embed in `config.mailerlite` (optioneel)
