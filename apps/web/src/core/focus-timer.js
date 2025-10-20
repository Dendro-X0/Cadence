import { appConstants } from './constants';
/**
 * FocusTimer implements a simple countdown timer.
 */
export class FocusTimer {
    constructor({ durationMs, onTick, onFinish }) {
        Object.defineProperty(this, "onTick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onFinish", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "durationMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "startMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "elapsedMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'idle'
        });
        Object.defineProperty(this, "intervalId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.durationMs = durationMs;
        this.onTick = onTick;
        this.onFinish = onFinish;
    }
    /**
     * Start or resume the countdown timer.
     */
    start() {
        if (this.status === 'running')
            return;
        this.status = 'running';
        this.startMs = performance.now();
        this.intervalId = window.setInterval(() => this.tick(), appConstants.tickIntervalMs);
    }
    /**
     * Pause the countdown timer.
     */
    pause() {
        if (this.status !== 'running')
            return;
        if (this.startMs !== null)
            this.elapsedMs += performance.now() - this.startMs;
        this.startMs = null;
        this.status = 'paused';
        if (this.intervalId !== null)
            window.clearInterval(this.intervalId);
        this.intervalId = null;
    }
    /**
     * Reset the timer to the initial duration (or a new duration).
     * @param durationMs Optional new duration in milliseconds.
     */
    reset({ durationMs } = {}) {
        if (durationMs !== undefined)
            this.durationMs = durationMs;
        this.startMs = null;
        this.elapsedMs = 0;
        this.status = 'idle';
        if (this.intervalId !== null)
            window.clearInterval(this.intervalId);
        this.intervalId = null;
        if (this.onTick)
            this.onTick(this.durationMs);
    }
    /**
     * Get milliseconds remaining in the current countdown.
     */
    remainingMs() {
        const runningElapsed = this.startMs ? performance.now() - this.startMs : 0;
        const total = this.elapsedMs + runningElapsed;
        const left = Math.max(0, Math.round(this.durationMs - total));
        return left;
    }
    tick() {
        const left = this.remainingMs();
        if (this.onTick)
            this.onTick(left);
        if (left <= 0) {
            if (this.intervalId !== null)
                window.clearInterval(this.intervalId);
            this.intervalId = null;
            this.status = 'idle';
            this.startMs = null;
            this.elapsedMs = 0;
            if (this.onFinish)
                this.onFinish();
        }
    }
}
