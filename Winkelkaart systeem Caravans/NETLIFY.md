# Online zetten op Netlify Free

Deze versie gebruikt Netlify Functions en de Brevo API. Het bestaande formulier, afzendernaam, optierijen en HTML-e-mail blijven behouden. De Python-server blijft bruikbaar voor lokale SMTP-verzending.

1. Maak in Brevo bij SMTP & API → API Keys een API-sleutel. De SMTP-sleutel werkt niet voor deze koppeling. Deel de API-sleutel niet in de chat.
2. Zet de projectbestanden in een Git-repository en verbind deze via Netlify → Add new project → Import an existing project. Neem `.env` nooit op. Netlify gebruikt `netlify.toml` voor de public-map en Functions; geen buildcommand nodig. Alleen `public` naar Netlify Drop slepen installeert deze Functions niet.
3. Stel bij Netlify → Project configuration → Environment variables in:
   - `BREVO_API_KEY`: de nieuwe Brevo API-sleutel; markeer deze als geheime waarde.
   - `MAIL_FROM`: exact dezelfde, door Brevo geaccepteerde afzender als lokaal in `.env`.
   - `MAIL_FROM_NAME`: `Caravan winkelkaart`.
   - `MAIL_TO`: `marketing@vanduinkerken.com`.
   Gebruik Functions/runtime scope indien deze keuze beschikbaar is. Er zijn geen SMTP- of Microsoft 365-gegevens nodig op Netlify.
4. Deploy opnieuw na het invullen. Open de Netlify-link, verstuur een fictieve testaanvraag en controleer de inbox en Brevo Logs. De succesmelding betekent API-acceptatie, geen garantie op inboxbezorging.

De API-sleutel blijft op de server. De functie valideert de velden en ontsmet de e-mailtekst. De ontvanger wordt uitsluitend door de serverinstellingen bepaald. Netlify beperkt deze route tot vijf aanvragen per minuut per IP en domein; de browser voorkomt dubbelklikken. Aanvragen worden niet door de app opgeslagen, maar Brevo verwerkt de e-mails.

Kies het Free-abonnement. Houd Netlify- en Brevo-gebruiksgrenzen in de gaten; gratis hosting is niet onbeperkt. Deze bestanden zijn voorbereid en lokaal getest; publicatie en echte API-bezorging moeten na het instellen nog worden gecontroleerd.

## Ordernummeroverzicht

Ordernummers worden na geaccepteerde e-mailverzending gedeeld bewaard in Netlify Blobs. Er zijn geen extra API-sleutels nodig. De gegevens blijven bij nieuwe deploys behouden. Alleen ordernummer en eerste verzenddatum worden opgeslagen. Het overzicht is toegankelijk voor bezoekers van de app; er is geen login. Voorloopnullen blijven behouden en hoofdletters tellen niet mee bij de herkenning. Dubbel gebruik geeft een waarschuwing en blokkeert een nieuwe aanvraag niet. Eerdere aanvragen worden niet achteraf geïmporteerd. Previewdeploys gebruiken een aparte opslag. Lokaal bewaart Python nummers in .orders.json, uitgesloten van Git; deze worden niet naar Netlify overgezet.

Upload ook package.json, package-lock.json en netlify/functions/orders.mjs plus de aangepaste public- en netlify/lib-bestanden. Netlify installeert de opslagbibliotheek automatisch. Controleer na deploy met een fictief ordernummer de verzending, het overzicht en de waarschuwing vanaf een tweede browser.
