const assert = require('assert');
const test = require('node:test');
const { StateService } = require('../src/services/stateService');

class MemStorage {
  constructor() {
    this.state = { roster: [], remaining: [], current: null, paused: false, lastPickAt: null };
  }
  async init() {}
  async getState() { return this.state; }
  async setState(s) { this.state = JSON.parse(JSON.stringify(s)); return this.state; }
}

function isoDate(str) { return new Date(str).toISOString(); }

test('picks next and cycles through roster then resets', async () => {
  const storage = new MemStorage();
  const service = new StateService(storage);
  await service.init();

  await service.ensureRosterFromEnv('Ada, Bob');
  let { picked } = await service.pickNextForUpcomingWeek({ envMembers: '' });
  assert.ok(['Ada', 'Bob'].includes(picked));
  const first = picked;

  let st = await service.getState();
  assert.equal(st.remaining.length, 1);

  ({ picked } = await service.pickNextForUpcomingWeek({ envMembers: '' }));
  assert.ok(picked && picked !== first);

  st = await service.getState();
  if (st.remaining.length === 0) {
    await service.pickNextForUpcomingWeek({ envMembers: '' });
    st = await service.getState();
  }
  assert.ok(st.remaining.length >= 1);
});

test('replaceCurrentWithNew returns current to remaining when possible', async () => {
  const storage = new MemStorage();
  const service = new StateService(storage);
  await service.init();

  await service.ensureRosterFromEnv('Ada, Bob');
  await service.pickNextForUpcomingWeek({ envMembers: '' });
  let st = await service.getState();
  const prev = st.current;
  const prevRemainingCount = st.remaining.length;

  const res = await service.replaceCurrentWithNew();
  assert.ok(res.picked);
  st = await service.getState();
  assert.ok(st.remaining.length === prevRemainingCount || st.remaining.length >= prevRemainingCount);
  assert.notEqual(st.current, prev);
});

test('pause and resume toggles paused state', async () => {
  const storage = new MemStorage();
  const service = new StateService(storage);
  await service.init();

  await service.pause();
  let st = await service.getState();
  assert.equal(st.paused, true);

  await service.resume();
  st = await service.getState();
  assert.equal(st.paused, false);
});
