const { Pool } = require('pg');

function getNaisDatabaseUrl() {
  const all = Object.keys(process.env).filter((k) => /^NAIS_DATABASE_.+_URL$/.test(k));
  const keys = all.filter((k) => !/_JDBC_URL$/.test(k));
  if (keys.length === 0) {
    throw new Error('No NAIS database URL found. Expected exactly one NAIS_DATABASE_<ALIAS>_URL (non-JDBC) from NAIS Cloud SQL.');
  }
  if (keys.length > 1) {
    throw new Error(`Multiple NAIS database URLs found (${keys.join(', ')}). Ensure only one NAIS_DATABASE_<ALIAS>_URL (non-JDBC) is present.`);
  }
  return process.env[keys[0]];
}

class PostgresStorage {
  constructor() {
    const url = getNaisDatabaseUrl();
    this.pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
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
