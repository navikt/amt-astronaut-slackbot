const { Pool } = require('pg');

const URL_ENV = 'NAIS_DATABASE_AMT_ASTRONAUT_SLACKBOT_AMT_ASTRONAUT_SLACKBOT_DB_URL';

function requireConnString() {
  const url = process.env[URL_ENV] || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(`Missing database URL. Expected ${URL_ENV} or DATABASE_URL.`);
  }
  return url;
}

class PostgresStorage {
  constructor(opts = {}) {
    const connectionString = requireConnString();
    const PoolImpl = opts.Pool || Pool;
    this.pool = new PoolImpl({ connectionString });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bot_state (
        id int primary key,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL default now()
      );
    `);
    const res = await this.pool.query('SELECT 1 FROM bot_state WHERE id = 1');
    if (res.rowCount === 0) {
      await this.pool.query('INSERT INTO bot_state (id, data) VALUES (1, $1)', [
        JSON.stringify({ roster: [], remaining: [], current: null, paused: false, lastPickAt: null })
      ]);
    }
  }

  async getState() {
    const res = await this.pool.query('SELECT data FROM bot_state WHERE id = 1');
    return res.rows[0].data;
  }

  async setState(newState) {
    await this.pool.query('UPDATE bot_state SET data = $1, updated_at = now() WHERE id = 1', [JSON.stringify(newState)]);
    return newState;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { PostgresStorage };
