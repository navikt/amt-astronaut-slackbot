import { WebClient } from '@slack/web-api';
import { getEnv } from '../utils/env.js';

export const getSlackClient = () => {
  const token = getEnv('SLACK_BOT_TOKEN', undefined, { required: true });
  return new WebClient(token, { retryConfig: { retries: 3 } });
};
