import redis from './redis.js';

/**
 * Fighter State Service
 * Manages game state (HP, animations, events) via Redis for persistence and sync
 */
class FighterStateService {
    constructor() {
        this.prefix = 'fighter:';
    }

    async getState(pollId) {
        const state = await redis.get(`${this.prefix}${pollId}`);
        if (state) return JSON.parse(state);
        return this.initializeState(pollId);
    }

    async initializeState(pollId) {
        const initialState = {
            pollId,
            fighterA: { hp: 1.0, lastHit: 0, animation: 'idle' },
            fighterB: { hp: 1.0, lastHit: 0, animation: 'idle' },
            events: []
        };
        await this.saveState(pollId, initialState);
        return initialState;
    }

    async saveState(pollId, state) {
        await redis.set(`${this.prefix}${pollId}`, JSON.stringify(state), 'EX', 3600);
    }

    /**
     * Updates HP based on delta votes and triggers animations
     */
    async updateCombat(pollId, pollData) {
        const state = await this.getState(pollId);

        const vA = pollData.optionA?._count?.votes || 0;
        const vB = pollData.optionB?._count?.votes || 0;

        // Detector de cambios en votos
        const deltaA = vA - (state.fighterA.prevVotes || 0);
        const deltaB = vB - (state.fighterB.prevVotes || 0);

        const now = Date.now();

        // Si P1 (A) recibe un voto, ATACA
        if (deltaA > 0 && (now - (state.fighterA.lastActionTime || 0)) > 500) {
            const actions = ['punch', 'kick', 'special'];
            state.fighterA.animation = actions[Math.floor(Math.random() * actions.length)];
            state.fighterA.lastActionTime = now;
            // El ataque danyina a B
            state.fighterB.hp = Math.max(0, state.fighterB.hp - (deltaA * 0.05));
            state.fighterB.lastHit = now;
        }

        // Si P2 (B) recibe un voto, ATACA
        if (deltaB > 0 && (now - (state.fighterB.lastActionTime || 0)) > 500) {
            const actions = ['punch', 'kick', 'special'];
            state.fighterB.animation = actions[Math.floor(Math.random() * actions.length)];
            state.fighterB.lastActionTime = now;
            // El ataque danyina a A
            state.fighterA.hp = Math.max(0, state.fighterA.hp - (deltaB * 0.05));
            state.fighterA.lastHit = now;
        }

        // Reset animation after 400ms
        if (state.fighterA.animation !== 'idle' && (now - state.fighterA.lastActionTime) > 400) {
            state.fighterA.animation = 'idle';
        }
        if (state.fighterB.animation !== 'idle' && (now - state.fighterB.lastActionTime) > 400) {
            state.fighterB.animation = 'idle';
        }

        state.fighterA.prevVotes = vA;
        state.fighterB.prevVotes = vB;

        await this.saveState(pollId, state);
        return state;
    }
}

export const fighterStateService = new FighterStateService();
