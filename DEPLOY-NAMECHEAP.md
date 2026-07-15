# Live zetten huizenmarkt-nederland.nl

## 1. Netlify Drop
- https://app.netlify.com/drop
- Sleep map website/ erheen
- Noteer URL bv. naam-123.netlify.app

## 2. Netlify domein
- Domain management -> Add: huizenmarkt-nederland.nl + www

## 3. Namecheap Advanced DNS - VERWIJDER:
- CNAME www -> parkingpage.namecheap.com
- URL Redirect @ -> www

## 4. Namecheap - VOEG TOE:
- A Record @ -> 75.2.60.5
- CNAME www -> JOUW-SITE.netlify.app

## 5. Wacht 30 min, check https://huizenmarkt-nederland.nl