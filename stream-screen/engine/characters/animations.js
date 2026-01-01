import { Poses } from './poses.js';

/**
 * AnimationController
 * Manages states and frame selection based on time.
 */
export class AnimationController {
    constructor() {
        this.currentState = 'IDLE';
        this.currentFrameIdx = 0;
        this.accumulator = 0;
    }

    setState(state) {
        if (this.currentState === state) return;
        this.currentState = state;
        this.currentFrameIdx = 0;
        this.accumulator = 0;
    }

    update(dt, customFrames = null) {
        const frames = customFrames || Poses[this.currentState];
        if (!frames || frames.length === 0) return;

        this.accumulator += dt / 16.67;

        // AI frames might not have 'duration', use 8 as default
        const frameData = frames[this.currentFrameIdx];
        const duration = frameData?.duration || 8;

        if (this.accumulator >= duration) {
            this.accumulator = 0;
            this.currentFrameIdx = (this.currentFrameIdx + 1) % frames.length;
        }
    }

    getCurrentPose() {
        const frames = Poses[this.currentState];
        return frames[this.currentFrameIdx].parts;
    }
}
