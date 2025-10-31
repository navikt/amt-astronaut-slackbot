const { getEnv } = require('../utils/env');
const { BucketStorage } = require('../storage/bucket');
const { StateService } = require('../services/stateService');
const { getSlackClient } = require('./slackClient');
const { DEFAULT_TEAM_MEMBERS } = require('../config');

function fridayMessage(name) {
  return `👨‍🚀 Neste ukes Astronaut er ${name} 🚀`;
}

(async () => {
  const storage = new BucketStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, { required: true });

  const { picked } = await service.pickNextForUpcomingWeek({ members: DEFAULT_TEAM_MEMBERS });
  if (!picked) {
    console.log('No pick (paused or roster empty).');
    process.exit(0);
  }

  const client = getSlackClient();
  const text = fridayMessage(picked);

  await client.chat.postMessage({ channel, text });
  console.log(`Posted Friday pick: ${picked}`);

  await storage.close();
})().catch((err) => {
  console.error('Friday job failed:', err && err.message ? err.message : String(err));
  process.exit(1);
});
