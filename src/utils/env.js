function getEnv(name, def, opts = {}) {
  const val = process.env[name];
  if (val == null || val === '') {
    if (def !== undefined) return def;
    if (opts.required) throw new Error(`Missing required env var ${name}`);
    return undefined;
  }
  return val;
}

function parseMembers(envVal) {
  if (!envVal) return [];
  return envVal
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

module.exports = {
  getEnv,
  parseMembers,
};
