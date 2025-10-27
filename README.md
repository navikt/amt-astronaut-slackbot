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

Påkrevde hemmeligheter (Kubernetes Secret `amt-astronaut-slackbot` i namespace `amt`)
- SLACK_SIGNING_SECRET
- SLACK_BOT_TOKEN
- SLACK_CHANNEL_ID

Ingress
- Ingress: `https://amt-astronaut-slackbot.nav.no`
- Slack Request URL: `https://amt-astronaut-slackbot.nav.no/slack/events`
