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
            fighterA: { hp: 1.0, lastHit: 0, animation: 'idle', prevVotes: 0 },
            fighterB: { hp: 1.0, lastHit: 0, animation: 'idle', prevVotes: 0 },
            timer: 180, // 3 minutes total
            lastUpdate: Date.now(),
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
     * Gaming Optimized: Includes passive decay and vote scaling
     */
    async updateCombat(pollId, pollData) {
        const state = await this.getState(pollId);

        const vA = pollData.optionA?._count?.votes || 0;
        const vB = pollData.optionB?._count?.votes || 0;

        const deltaA = vA - (state.fighterA.prevVotes || 0);
        const deltaB = vB - (state.fighterB.prevVotes || 0);

        const now = Date.now();
        const lastUpdate = state.lastUpdate || now;
        const timeDelta = (now - lastUpdate) / 1000;

        // Passive Decay (0.1% per second)
        const passiveDecay = 0.001 * timeDelta;
        state.fighterA.hp = Math.max(0, state.fighterA.hp - passiveDecay);
        state.fighterB.hp = Math.max(0, state.fighterB.hp - passiveDecay);

        // Player A Attacks
        if (deltaA > 0 && (now - (state.fighterA.lastActionTime || 0)) > 400) {
            const types = ['punch', 'kick', 'special'];
            state.fighterA.animation = types[Math.floor(Math.random() * types.length)];
            state.fighterA.lastActionTime = now;
            const damage = 0.05 + (deltaA * 0.01);
            state.fighterB.hp = Math.max(0, state.fighterB.hp - damage);
            state.fighterB.lastHit = now;
        }

        // Player B Attacks
        if (deltaB > 0 && (now - (state.fighterB.lastActionTime || 0)) > 400) {
            const types = ['punch', 'kick', 'special'];
            state.fighterB.animation = types[Math.floor(Math.random() * types.length)];
            state.fighterB.lastActionTime = now;
            const damage = 0.05 + (deltaB * 0.01);
            state.fighterA.hp = Math.max(0, state.fighterA.hp - damage);
            state.fighterA.lastHit = now;
        }

        // Animation reset
        if (state.fighterA.animation !== 'idle' && (now - state.fighterA.lastActionTime) > 600) {
            state.fighterA.animation = 'idle';
        }
        if (state.fighterB.animation !== 'idle' && (now - state.fighterB.lastActionTime) > 600) {
            state.fighterB.animation = 'idle';
        }

        state.fighterA.prevVotes = vA;
        state.fighterB.prevVotes = vB;
        state.lastUpdate = now;

        state.combatOver = state.fighterA.hp <= 0 || state.fighterB.hp <= 0;
        if (state.combatOver) {
            state.winner = state.fighterA.hp <= 0 ? 'B' : 'A';
        }

        await this.saveState(pollId, state);
        return state;
    }
}

export const fighterStateService = new FighterStateService();
