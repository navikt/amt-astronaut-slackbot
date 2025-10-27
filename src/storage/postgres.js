const { Pool } = require('pg');

const PREFIX = 'NAIS_DATABASE_AMT_ASTRONAUT_SLACKBOT_AMT_ASTRONAUT_SLACKBOT_DB_';

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function buildSslConfig(mode, { ca, cert, key }) {
  const m = (mode || '').toLowerCase();
  if (m === 'disable') return false;

  // Base TLS options
  const base = { ca, cert, key };

  // verify-full: verify CA + hostname
  if (m === 'verify-full') {
    return { ...base, rejectUnauthorized: true };
  }

  // verify-ca: verify CA only, skip hostname check
  if (m === 'verify-ca') {
    return {
      ...base,
      rejectUnauthorized: true,
      // Skip hostname verification but keep CA validation
      checkServerIdentity: () => undefined,
    };
  }

  // require/prefer/allow/etc: enable TLS without strict verification
  return { ...base, rejectUnauthorized: false };
}

class PostgresStorage {
  constructor(opts = {}) {
    const host = reqEnv(PREFIX + 'HOST');
    const port = Number(reqEnv(PREFIX + 'PORT'));
    const database = reqEnv(PREFIX + 'DATABASE');
    const user = reqEnv(PREFIX + 'USERNAME');
    const password = reqEnv(PREFIX + 'PASSWORD');

    const sslmode = process.env[PREFIX + 'SSLMODE'] || 'require';
    const sslrootcert = process.env[PREFIX + 'SSLROOTCERT'];
    const sslcert = process.env[PREFIX + 'SSLCERT'];
    const sslkey = process.env[PREFIX + 'SSLKEY_PK8'] || process.env[PREFIX + 'SSLKEY'];

    const ssl = buildSslConfig(sslmode, {
      ca: sslrootcert,
      cert: sslcert,
      key: sslkey,
    });

    const PoolImpl = opts.Pool || Pool;
    this.pool = new PoolImpl({ host, port, database, user, password, ssl });
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
