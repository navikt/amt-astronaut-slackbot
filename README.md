# AMT Astronaut Slackbot

A tiny Slack bot that picks and announces "Ukens Astronaut" for Team Komet.

- Picks next week's astronaut every Friday 13:00 (Europe/Oslo)
- Reminds the channel Monday 08:00 (Europe/Oslo)
- Supports pause/resume and override (replace current with a new pick)
- State is persisted in a GCP bucket via NAIS

## Configuration

Required secrets (Kubernetes Secret `amt-astronaut-slackbot`):
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL_ID`

Env:
- `SLASH_COMMAND` (default: `/astronaut`)
- `PORT` (default: `3000`)

Bucket:
- The NAIS manifest provisions a GCP bucket with alias/name `amt-astronaut-bucket` and injects `NAIS_BUCKETS_AMT_ASTRONAUT_BUCKET_NAME`.

## Commands

- `/astronaut next` – override current and pick a new astronaut
- `/astronaut pause` – pause scheduled messages
- `/astronaut resume` – resume scheduled messages
- `/astronaut status` – show current state

## Run tests

```sh
npm test
```

## Deploy

Push to `main` triggers GitHub Actions that build and deploy to `prod-gcp` using `nais/deploy` with `.nais/nais.yaml`.
