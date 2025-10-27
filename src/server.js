const { App, ExpressReceiver } = require('@slack/bolt');
const { getEnv } = require('./utils/env');
const { PostgresStorage } = require('./storage/postgres');
const { StateService } = require('./services/stateService');
const { DEFAULT_TEAM_MEMBERS } = require('./config');

process.on('unhandledRejection', (err) => {
  const msg = err && err.message ? err.message : String(err);
  console.error('UnhandledRejection:', msg);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  const msg = err && err.message ? err.message : String(err);
  console.error('UncaughtException:', msg);
  process.exit(1);
});

const signingSecret = getEnv('SLACK_SIGNING_SECRET', undefined, { required: true });
const botToken = getEnv('SLACK_BOT_TOKEN', undefined, { required: true });
const port = parseInt(getEnv('PORT', '3000'), 10);

const receiver = new ExpressReceiver({ signingSecret });
const app = new App({ token: botToken, receiver });

const storage = new PostgresStorage();
const service = new StateService(storage);

(async () => {
  await service.init();
  await service.ensureRosterFromEnv(DEFAULT_TEAM_MEMBERS.join(','));

  receiver.app.get('/internal/isAlive', (_req, res) => res.status(200).send('ALIVE'));
  receiver.app.get('/internal/isReady', async (_req, res) => {
    try {
      await service.getState();
      res.status(200).send('READY');
    } catch (e) {
      res.status(500).send('NOT_READY');
    }
  });

  const commandName = getEnv('SLASH_COMMAND', '/astronaut');

  app.command(commandName, async ({ ack, command, respond }) => {
    await ack();
    const text = (command.text || '').trim();
    const [sub] = text.split(/\s+/);
    const subcmd = (sub || 'help').toLowerCase();

    try {
      switch (subcmd) {
        case 'next':
        case 'ny': {
          const { picked } = await service.replaceCurrentWithNew();
          if (!picked) {
            await respond({ text: 'Fant ingen tilgjengelig kandidat (oppdater roster i databasen).', response_type: 'ephemeral' });
          } else {
            await respond({ text: `Ny Ukens astronaut: ${picked}`, response_type: 'ephemeral' });
          }
          break;
        }
        case 'pause': {
          await service.pause();
          await respond({ text: 'Pauset. Ingen meldinger vil bli sendt.', response_type: 'ephemeral' });
          break;
        }
        case 'resume':
        case 'start': {
          await service.resume();
          await respond({ text: 'Startet igjen. Planlagte meldinger vil sendes.', response_type: 'ephemeral' });
          break;
        }
        case 'status': {
          const st = await service.status();
          await respond({
            response_type: 'ephemeral',
            text: `Status:\n- Paused: ${st.paused}\n- Current: ${st.current ?? 'ingen'}\n- Remaining: ${st.remainingCount}/${st.totalCount}`,
          });
          break;
        }
        case 'help':
        default: {
          await respond({
            response_type: 'ephemeral',
            text: `Bruk: ${commandName} [next|pause|resume|status]`,
          });
          break;
        }
      }
    } catch (err) {
      console.error('Command error:', err && err.message ? err.message : String(err));
      await respond({ response_type: 'ephemeral', text: 'Noe gikk galt. Se logger.' });
    }
  });

  await app.start(port);
  console.log(`Slack bot server started on port ${port}`);
})().catch((err) => {
  const msg = err && err.message ? err.message : String(err);
  console.error('Startup failed:', msg);
  process.exit(1);
});
