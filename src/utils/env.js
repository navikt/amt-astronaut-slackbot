function getEnv(name, def, opts = {}) {
  const val = process.env[name];
  if (val == null || val === '') {
    if (def !== undefined) return def;
    if (opts.required) throw new Error(`Missing required env var ${name}`);
    return undefined;
  }
  return val;
}

module.exports = {
  getEnv,
};
