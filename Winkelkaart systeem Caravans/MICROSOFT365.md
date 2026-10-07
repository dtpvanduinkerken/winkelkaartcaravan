# Microsoft 365 activeren

De code voor Microsoft Graph is klaar. Verzending is pas actief na inrichting in de Microsoft 365-omgeving en een succesvolle test.

## Door de Microsoft 365-beheerder

1. Registreer in Microsoft Entra een app `Caravanwinkelkaart aanvragen` voor alleen deze organisatie (single tenant). Voor deze serverkoppeling is geen redirect-URL nodig.
2. Noteer Directory (tenant) ID en Application (client) ID.
3. Richt verzendtoegang in voor uitsluitend de afzendermailbox `marketing@vanduinkerken.com`. Gebruik bij voorkeur Exchange Online Application RBAC met de rol `Application Mail.Send` en een scope die uitsluitend deze mailbox bevat. Verleen niet daarnaast een onbeperkte Entra `Mail.Send`-application permission: permissies zijn aanvullend en die toestemming zou de mailboxscope omzeilen. Als jullie beheerder de oudere application access policy gebruikt, laat die de Graph `Mail.Send`-application permission met admin consent beperken tot deze mailbox en de beperking controleren.
4. Maak een client secret met passende vervaldatum; bewaar de waarde direct in de serverconfiguratie en plan vernieuwing voor de vervaldatum.
5. Vul `M365_TENANT_ID`, `M365_CLIENT_ID`, `M365_CLIENT_SECRET` in `.env` in. `MAIL_PROVIDER=microsoft365`, `MAIL_FROM=marketing@vanduinkerken.com` en `MAIL_TO=marketing@vanduinkerken.com` zijn al voorbereid. Als marketing een alias is, gebruik bij `MAIL_FROM` de daadwerkelijke toegestane mailboxidentiteit.
6. Herstart `python3 server.py`. Dien één herkenbare testaanvraag in en controleer de inbox en Verzonden items. Een Graph-acceptatie is nog geen bewijs van inboxbezorging.

De secret hoort nooit in de browsercode of in de chat. `.env` staat buiten de publiek geserveerde map en is uitgesloten van Git. SMTP AUTH hoeft voor deze Graph-koppeling niet aangezet te worden.

## Officiële documentatie

- https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
- https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac
