const { WebClient } = require('@slack/web-api');
const { getEnv } = require('../utils/env');

function getSlackClient() {
  const token = getEnv('SLACK_BOT_TOKEN', undefined, { required: true });
  return new WebClient(token, { retryConfig: { retries: 3 } });
}

module.exports = { getSlackClient };

