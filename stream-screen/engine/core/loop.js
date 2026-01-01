/**
 * Game Loop
 * Handles deterministic updates and decoupling from render.
 */
export class GameLoop {
    constructor(updateFn, renderFn, fps = 60) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.fps = fps;
        this.frameTime = 1000 / fps;
        this.lastTime = 0;
        this.accumulator = 0;
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.lastTime = Date.now();
        this.step();
    }

    stop() {
        this.isRunning = false;
    }

    step() {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.accumulator += deltaTime;

        // Deterministic Update (Fixed Timestep)
        while (this.accumulator >= this.frameTime) {
            this.updateFn(this.frameTime);
            this.accumulator -= this.frameTime;
        }

        // Render (Uncapped or tied to VSync/Display)
        this.renderFn(now);

        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => this.step());
        } else {
            setTimeout(() => this.step(), 1);
        }
    }
}
