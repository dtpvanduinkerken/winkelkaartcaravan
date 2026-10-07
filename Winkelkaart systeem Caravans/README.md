# Aanvraag caravanwinkelkaart

Responsive caravanformulier met optierijen, controlevoorbeeld en automatische e-mail via Brevo SMTP. De browser stuurt naar de eigen Python-server; die verstuurt de mail. SMTP-gegevens blijven op de server, buiten de map public. Formspree wordt niet meer gebruikt.

## Activeren

1. Maak een Brevo-account en activeer Transactional Email.
2. Voeg een afzender toe en doorloop de verificatie die Brevo vereist. Zonder DNS-toegang moeten we eerst controleren of Brevo verzending met deze afzender toestaat; afleverbaarheid is niet gegarandeerd.
3. Haal SMTP login en SMTP key op bij SMTP & API. Gebruik een SMTP key, geen API key of Outlook-wachtwoord.
4. Vul lokaal in .env: SMTP_USER met de SMTP login, SMTP_PASSWORD met de SMTP key, MAIL_FROM met de in Brevo toegestane afzender. MAIL_TO staat op marketing@vanduinkerken.com.
5. Start of herstart met `python3 server.py`. Open http://localhost:8080 en verstuur een fictieve testaanvraag. Controleer de inbox en Brevo Transactional Logs.

Een succesvolle serverreactie betekent dat de mailserver de aanvraag heeft geaccepteerd, niet dat de mail in de inbox staat. Bij een fout blijft het formulier ingevuld. De app bewaart geen aanvragen op schijf; Brevo verwerkt de mail.

## Online zetten op Netlify

De app is voorbereid voor Netlify Free met Brevo API-verzending. Zie [NETLIFY.md](NETLIFY.md) voor de stappen. Publicatie gebeurt met de volledige projectconfiguratie en Functions via een Git-import, niet alleen de public-map via Netlify Drop. De lokale Python/SMTP-preview blijft werken.

Sofia Pro wordt gebruikt als deze lokaal beschikbaar is; anders Arial.

Documentatie: https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP
