/**
 * Game State
 * Manages rounds, scores, and global session events.
 */
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.rounds = 0;
        this.score = { p1: 0, p2: 0 };
        this.isGameOver = false;
        this.timer = 99;
        this.lastUpdate = Date.now();
    }

    update(dt) {
        // Logic for timer countdown etc.
        // The timer is typically synced from the outside in this engine,
        // but let's add a local decrement for safety/smoothness.
        // this.timer -= dt / 1000;
    }
}
