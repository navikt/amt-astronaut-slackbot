import {getEnv} from '../utils/env.js';
import {BucketStorage} from '../storage/bucket.js';
import {StateService} from '../services/stateService.js';
import {getSlackClient} from './slackClient.js';
import {DEFAULT_TEAM_MEMBERS} from '../config.js';

const fridayMessage = (name) => `👨‍🚀 Neste ukes Astronaut er ${name} 🚀`;

const main = async () => {
  const storage = new BucketStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, {required: true});

  const {picked} = await service.pickNextForUpcomingWeek({members: DEFAULT_TEAM_MEMBERS});
  if (!picked) {
    console.log('No pick (paused or roster empty).');
    return;
  }

  const client = getSlackClient();
  const text = fridayMessage(picked);

  await client.chat.postMessage({channel, text});
  console.log(`Posted Friday pick: ${picked}`);
}

main().catch((err) => {
  console.error('Friday job failed:', err?.message ?? String(err));
  process.exitCode = 1;
});