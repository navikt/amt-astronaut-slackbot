# AMT Astronaut Slackbot

En liten Slack-bot som velger "Ukens Astronaut" for Team Komet. Den plukker neste ukes astronaut fredag kl 13:00 (Europe/Oslo) og sender en påminnelse mandag kl 08:00 (Europe/Oslo). Applikasjonen kjører i NAIS prod-gcp.

Hva den gjør
- Vedlikeholder en liste med teammedlemmer i Postgres.
- Trekker en tilfeldig kandidat fredag (for neste uke) og fjerner vedkommende fra listen.
- Når listen er tom, repopuleres den automatisk fra roster.
- Mandag sender den en påminnelse for gjeldende astronaut.
- Slash-kommandoer i Slack for override/pause/resume/status:
  - /astronaut next (eller ny)
  - /astronaut pause
  - /astronaut resume (eller start)
  - /astronaut status

Teknologi
- Node.js 20, @slack/bolt, @slack/web-api, postgres
- NAIS Application (for slash-kommandoer) og NAIS Naisjob (for fredag/mandag)
- Postgres i GCP Cloud SQL via NAIS-injiserte miljøvariabler

Drift i NAIS (prod-gcp)
- Manifester ligger i `.nais/`:
  - `.nais/app.yaml` (applikasjonen som tar imot slash-kommandoer)
  - `.nais/job-friday.yaml` (CRON_TZ=Europe/Oslo 13:00 fredager)
  - `.nais/job-monday.yaml` (CRON_TZ=Europe/Oslo 08:00 mandager)
- Alle ressurser konfigurerer GCP Cloud SQL via `gcp.sqlInstances` og bruker `NAIS_DATABASE_<ALIAS>_URL`.

Påkrevde hemmeligheter (Kubernetes Secret `amt-astronaut-slackbot` i namespace `amt`)
- SLACK_SIGNING_SECRET
- SLACK_BOT_TOKEN
- SLACK_CHANNEL_ID

Miljøvariabler
- SLASH_COMMAND (default: /astronaut)

Ingress
- Ingress: `https://amt-astronaut-slackbot.nav.no`
- Slack Request URL: `https://amt-astronaut-slackbot.nav.no/slack/events`

Database (NAIS Postgres)
- Applikasjonen forventer nøyaktig én `NAIS_DATABASE_<ALIAS>_URL` og feiler tydelig hvis ingen eller flere finnes.
- SSL er aktivert i klienten (pg) med `rejectUnauthorized: false`.

Test
- Enkle tester for kjernelogikk kan kjøres med `npm test`.
