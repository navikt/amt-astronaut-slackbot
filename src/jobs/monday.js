import {getEnv} from '../utils/env.js';
import {BucketStorage} from '../storage/bucket.js';
import {StateService} from '../services/stateService.js';
import {getSlackClient} from './slackClient.js';

const mondayMessage = (name) => `👨‍🚀 Denne ukens Astronaut er ${name} 🚀`;

const main = async () => {
  const storage = new BucketStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, {required: true});

  const state = await service.getState();
  if (state.paused || !state.current) {
    console.log('Skipping Monday reminder (paused or no current).');
    return;
  }

  const client = getSlackClient();
  const text = mondayMessage(state.current);

  await client.chat.postMessage({channel, text});
  console.log(`Posted Monday reminder: ${state.current}`);
}

main().catch((err) => {
  console.error('Monday job failed:', err?.message ?? String(err));
  process.exitCode = 1;
});