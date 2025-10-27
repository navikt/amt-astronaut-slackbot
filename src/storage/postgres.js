const { Pool } = require('pg');

function getNaisAliasPrefix() {
  const all = Object.keys(process.env).filter((k) => /^NAIS_DATABASE_.+_URL$/.test(k));
  const urlKeys = all.filter((k) => !/_JDBC_URL$/.test(k));
  if (urlKeys.length === 0) {
    throw new Error('No NAIS database URL found. Expected exactly one NAIS_DATABASE_<ALIAS>_URL (non-JDBC).');
  }
  if (urlKeys.length > 1) {
    throw new Error(`Multiple NAIS database URLs found (${urlKeys.join(', ')}). Ensure only one NAIS_DATABASE_<ALIAS>_URL (non-JDBC) is present.`);
  }
  return urlKeys[0].replace(/_URL$/, '');
}

function getEnvOr(prefix, keys) {
  for (const k of keys) {
    const full = `${prefix}_${k}`;
    if (process.env[full]) return process.env[full];
  }
  return undefined;
}

class PostgresStorage {
  constructor() {
    const prefix = getNaisAliasPrefix();
    const host = getEnvOr(prefix, ['HOST']);
    const portRaw = getEnvOr(prefix, ['PORT']);
    const user = getEnvOr(prefix, ['USERNAME', 'USER']);
    const password = getEnvOr(prefix, ['PASSWORD']);
    const database = getEnvOr(prefix, ['NAME', 'DATABASE']);

    if (!host || !user || !password || !database) {
      throw new Error('Missing NAIS database connection pieces (HOST/PORT/USER/PASSWORD/NAME).');
    }

    const port = portRaw ? parseInt(portRaw, 10) : undefined;

    this.pool = new Pool({ host, port, user, password, database, ssl: false });
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
