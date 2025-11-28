# AMT Astronaut Slackbot

En liten Slack bot som velger og annonserer "Ukens Astronaut" for Team Komet.

- Velger neste ukes astronaut hver fredag kl 13:00 og sender en melding i Slack-kanalen
- Sender en påminnelse i kanalen mandag 08:00 uken etter
- Støtter pause/start og override av nåværende astronaut
- State blir persistert i GCP bucket

## Config

Påkrevde secrets (Kubernetes Secret `amt-astronaut-slackbot`):
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL_ID`

Env:
- `SLASH_COMMAND`: `/astronaut`
- `PORT`: `3000`

Bucket:
- Nais manifestet provisjonerer en GCP bucket med alias/navn `amt-astronaut-bucket-dev`.
- Se eksempel av innhold i state i `src/storage/example-state/state.json`

## Kommandoer

- `/astronaut next` – override nåværende og velger en ny astronaut.
- `/astronaut pause` – pauser boten
- `/astronaut resume` – starter boten igjen
- `/astronaut status` – viser nåværende status

## Test

```sh
npm test
```

## Deploy

Push til `main` trigger GitHub Actions som bygger og deployer til `dev-gcp` ved bruk av `nais/deploy` med `.nais/nais.yaml`
