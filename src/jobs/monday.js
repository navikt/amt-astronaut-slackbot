const { getEnv } = require('../utils/env');
const { BucketStorage } = require('../storage/bucket');
const { StateService } = require('../services/stateService');
const { getSlackClient } = require('./slackClient');

function mondayMessage(name) {
  return `👨‍🚀 Denne ukens Astronaut er ${name} 🚀`;
}

(async () => {
  const storage = new BucketStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, { required: true });

  const state = await service.getState();
  if (state.paused || !state.current) {
    console.log('Skipping Monday reminder (paused or no current).');
    process.exit(0);
  }

  const client = getSlackClient();
  const text = mondayMessage(state.current);

  await client.chat.postMessage({ channel, text });
  console.log(`Posted Monday reminder: ${state.current}`);
})().catch((err) => {
  console.error('Monday job failed:', err && err.message ? err.message : String(err));
  process.exit(1);
});
