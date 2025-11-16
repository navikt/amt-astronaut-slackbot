import assert from 'node:assert/strict';
import {test} from 'node:test';
import {StateService} from '../src/services/stateService.js';

class MemStorage {
    constructor() {
        this.state = {roster: [], remaining: [], current: null, paused: false, lastPickAt: null};
    }

    async init() {
    }

    async getState() {
        return this.state;
    }

    async setState(s) {
        this.state = JSON.parse(JSON.stringify(s));
        return this.state;
    }
}

const setupStateService = async (initialState) => {
    const storage = new MemStorage();
    const service = new StateService(storage);
    await service.init();
    if (initialState) await storage.setState(initialState);
    return service;
}

test('picks next and cycles through roster then resets', async () => {
    const service = await setupStateService();

    await service.ensureRosterFromConfig(['Ada', 'Bob']);
    let {picked} = await service.pickNextForUpcomingWeek({members: []});
    assert.ok(['Ada', 'Bob'].includes(picked));
    const first = picked;

    let st = await service.getState();
    assert.equal(st.remaining.length, 1);

    ({picked} = await service.pickNextForUpcomingWeek({members: []}));
    assert.ok(picked && picked !== first);

    st = await service.getState();
    if (st.remaining.length === 0) {
        await service.pickNextForUpcomingWeek({members: []});
        st = await service.getState();
    }
    assert.ok(st.remaining.length >= 1);
});

test('replaceCurrentWithNew returns current to remaining when possible', async () => {
    const service = await setupStateService();

    await service.ensureRosterFromConfig(['Ada', 'Bob']);
    await service.pickNextForUpcomingWeek({members: []});
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
    const service = await setupStateService();

    await service.pause();
    let st = await service.getState();
    assert.equal(st.paused, true);

    await service.resume();
    st = await service.getState();
    assert.equal(st.paused, false);
});

// New tiny tests

test('ensureRosterFromConfig does not overwrite existing non-empty roster/remaining', async () => {
    const service = await setupStateService({
        roster: ['Ada', 'Bob'],
        remaining: ['Bob'],
        current: 'Ada',
        paused: false,
        lastPickAt: null
    });

    await service.ensureRosterFromConfig(['Zed', 'Yara']);
    const st = await service.getState();
    assert.deepStrictEqual(st.roster, ['Ada', 'Bob']);
    assert.deepStrictEqual(st.remaining, ['Bob']);
    assert.strictEqual(st.current, 'Ada');
});

test('status returns correct shape and counts', async () => {
    const service = await setupStateService();

    await service.ensureRosterFromConfig(['Ada', 'Bob', 'Cy']);
    const {picked} = await service.pickNextForUpcomingWeek({members: []});
    const st = await service.status();

    assert.ok(typeof st.paused === 'boolean');
    assert.ok(st.totalCount === 3);
    assert.ok(st.remainingCount >= 1 && st.remainingCount <= 2);
    assert.ok(st.current === picked || st.current === null);
});

test('pickNextForUpcomingWeek returns null when paused', async () => {
    const service = await setupStateService();

    await service.ensureRosterFromConfig(['Ada', 'Bob']);
    await service.pause();
    const res = await service.pickNextForUpcomingWeek({members: []});
    assert.strictEqual(res.picked, null);
});
