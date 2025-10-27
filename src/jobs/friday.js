const { getEnv } = require('../utils/env');
const { PostgresStorage } = require('../storage/postgres');
const { StateService } = require('../services/stateService');
const { fridayMessage } = require('../services/messageService');
const { getSlackClient } = require('./slackClient');
const { DEFAULT_TEAM_MEMBERS } = require('../config');

(async () => {
  const storage = new PostgresStorage();
  const service = new StateService(storage);
  await service.init();

  const channel = getEnv('SLACK_CHANNEL_ID', undefined, { required: true });

  const { picked, state } = await service.pickNextForUpcomingWeek({ envMembers: DEFAULT_TEAM_MEMBERS.join(',') });
  if (!picked) {
    console.log('No pick (paused or no members).');
    process.exit(0);
  }

  const client = getSlackClient();
  const text = fridayMessage({ name: picked, weekStartISO: state.currentWeekStart });

  await client.chat.postMessage({ channel, text });
  console.log(`Posted Friday pick: ${picked}`);

  await storage.close();
})().catch((err) => {
  console.error('Friday job failed:', err && err.message ? err.message : String(err));
  process.exit(1);
});
