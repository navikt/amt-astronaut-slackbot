export class StateService {
    constructor(storage) {
        this.storage = storage;
    }

    async init() {
        await this.storage.init();
    }

    async ensureRosterFromConfig(membersArray) {
        const state = await this.storage.getState();
        if (!state.roster || state.roster.length === 0) {
            const members = Array.isArray(membersArray) ? membersArray : [];
            state.roster = members;
            state.remaining = [...members];
            await this.storage.setState(state);
        }
        return state;
    }

    async getState() {
        return this.storage.getState();
    }

    async pause() {
        const state = await this.storage.getState();
        state.paused = true;
        await this.storage.setState(state);
        return state;
    }

    async resume() {
        const state = await this.storage.getState();
        state.paused = false;
        await this.storage.setState(state);
        return state;
    }

    async pickNextForUpcomingWeek({members}) {
        const state = await this.ensureRosterFromConfig(members);
        if (state.paused) return {state, picked: null};

        if (!state.remaining || state.remaining.length === 0) {
            state.remaining = [...state.roster];
        }

        const idx = Math.floor(Math.random() * state.remaining.length);
        const picked = state.remaining.splice(idx, 1)[0] || null;

        state.current = picked;
        state.lastPickAt = new Date().toISOString();
        await this.storage.setState(state);
        return {state, picked};
    }

    async replaceCurrentWithNew() {
        const state = await this.storage.getState();
        if (state.paused) return {state, picked: null};

        const prevCurrent = state.current;

        if (prevCurrent) {
            if (!state.remaining) state.remaining = [];
            if (!state.remaining.includes(prevCurrent)) {
                state.remaining.push(prevCurrent);
            }
        }

        if (!state.remaining || state.remaining.length === 0) {
            state.remaining = [...(state.roster || [])];
        }

        if (!state.remaining || state.remaining.length === 0) {
            state.current = null;
            await this.storage.setState(state);
            return {state, picked: null};
        }

        let candidates = state.remaining;
        const withoutPrev = prevCurrent ? state.remaining.filter((n) => n !== prevCurrent) : state.remaining;
        if (withoutPrev.length > 0) {
            candidates = withoutPrev;
        }

        const idx = Math.floor(Math.random() * candidates.length);
        const picked = candidates[idx] || null;

        const remIdx = state.remaining.indexOf(picked);
        if (remIdx >= 0) state.remaining.splice(remIdx, 1);

        state.current = picked;
        state.lastPickAt = new Date().toISOString();
        await this.storage.setState(state);
        return {state, picked};
    }

    async status() {
        const state = await this.storage.getState();
        return {
            paused: !!state.paused,
            current: state.current || null,
            remainingCount: (state.remaining || []).length,
            totalCount: (state.roster || []).length,
        };
    }
}
