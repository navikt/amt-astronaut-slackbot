const { getEnv } = require('../utils/env');
const { PostgresStorage } = require('../storage/postgres');
const { StateService } = require('../services/stateService');
const { mondayMessage } = require('../services/messageService');
const { getSlackClient } = require('./slackClient');

(async () => {
  const storage = new PostgresStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, { required: true });

  const state = await service.getState();
  if (state.paused || !state.current) {
    console.log('Skipping Monday reminder (paused or no current).');
    process.exit(0);
  }

  const client = getSlackClient();
  const text = mondayMessage({ name: state.current });

  await client.chat.postMessage({ channel, text });
  console.log(`Posted Monday reminder: ${state.current}`);

  await storage.close();
})().catch((err) => {
  console.error('Monday job failed', err);
  process.exit(1);
});
