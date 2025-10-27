const test = require('node:test');
const assert = require('node:assert/strict');

class CapturePool {
  static lastConfig = null;
  constructor(cfg) {
    CapturePool.lastConfig = cfg;
  }
}

const PREFIX = 'NAIS_DATABASE_AMT_ASTRONAUT_SLACKBOT_AMT_ASTRONAUT_SLACKBOT_DB_';

function withDbEnv(overrides, fn) {
  const prev = { ...process.env };
  // clear any previous NAIS db envs
  Object.keys(process.env)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => delete process.env[k]);

  // required
  process.env[PREFIX + 'HOST'] = overrides.HOST || '127.0.0.1';
  process.env[PREFIX + 'PORT'] = String(overrides.PORT || 5432);
  process.env[PREFIX + 'DATABASE'] = overrides.DATABASE || 'db';
  process.env[PREFIX + 'USERNAME'] = overrides.USERNAME || 'user';
  process.env[PREFIX + 'PASSWORD'] = overrides.PASSWORD || 'pass';

  // optional TLS related
  if (overrides.SSLMODE) process.env[PREFIX + 'SSLMODE'] = overrides.SSLMODE;
  if (overrides.SSLROOTCERT) process.env[PREFIX + 'SSLROOTCERT'] = overrides.SSLROOTCERT;
  if (overrides.SSLCERT) process.env[PREFIX + 'SSLCERT'] = overrides.SSLCERT;
  if (overrides.SSLKEY_PK8) process.env[PREFIX + 'SSLKEY_PK8'] = overrides.SSLKEY_PK8;
  if (overrides.SSLKEY) process.env[PREFIX + 'SSLKEY'] = overrides.SSLKEY;

  try {
    fn();
  } finally {
    Object.keys(process.env).forEach((k) => delete process.env[k]);
    Object.assign(process.env, prev);
  }
}

test('sslmode=disable config sets ssl=false', () => {
  withDbEnv({ SSLMODE: 'disable' }, () => {
    const modPath = require.resolve('../src/storage/postgres');
    delete require.cache[modPath];
    const { PostgresStorage } = require('../src/storage/postgres');
    new PostgresStorage({ Pool: CapturePool });
    const cfg = CapturePool.lastConfig;
    assert.equal(cfg.ssl, false);
  });
});

test('sslmode=require enables TLS without strict verification', () => {
  withDbEnv({ SSLMODE: 'require', SSLROOTCERT: 'CA', SSLCERT: 'CERT', SSLKEY_PK8: 'KEY' }, () => {
    const modPath = require.resolve('../src/storage/postgres');
    delete require.cache[modPath];
    const { PostgresStorage } = require('../src/storage/postgres');
    new PostgresStorage({ Pool: CapturePool });
    const cfg = CapturePool.lastConfig;
    assert.deepEqual(cfg.ssl && { rejectUnauthorized: cfg.ssl.rejectUnauthorized, ca: cfg.ssl.ca, cert: cfg.ssl.cert, key: cfg.ssl.key }, {
      rejectUnauthorized: false,
      ca: 'CA',
      cert: 'CERT',
      key: 'KEY',
    });
  });
});

test('sslmode=verify-ca enables TLS with CA validation but skips hostname check', () => {
  withDbEnv({ SSLMODE: 'verify-ca', SSLROOTCERT: 'CA' }, () => {
    const modPath = require.resolve('../src/storage/postgres');
    delete require.cache[modPath];
    const { PostgresStorage } = require('../src/storage/postgres');
    new PostgresStorage({ Pool: CapturePool });
    const cfg = CapturePool.lastConfig;
    assert.equal(cfg.ssl.rejectUnauthorized, true);
    assert.equal(typeof cfg.ssl.checkServerIdentity, 'function');
    assert.equal(cfg.ssl.ca, 'CA');
  });
});

