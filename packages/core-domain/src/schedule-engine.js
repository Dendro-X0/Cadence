import { appConstants } from './constants';
import { FocusTimer } from './focus-timer';
/**
 * ScheduleEngine runs a template's blocks sequentially with optional repeats.
 */
export class ScheduleEngine {
    constructor({ template, events }) {
        Object.defineProperty(this, "template", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "blockIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "remainingCycles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'idle'
        });
        this.template = template;
        this.events = events ?? {};
        this.remainingCycles = Math.max(1, template.repeat ?? 1);
    }
    currentBlock() {
        return this.template.blocks[this.blockIndex];
    }
    nextBlock() {
        const i = this.blockIndex + 1;
        if (i < this.template.blocks.length)
            return this.template.blocks[i];
        if ((this.remainingCycles - 1) > 0)
            return this.template.blocks[0];
        return null;
    }
    start() {
        if (this.status === 'running')
            return;
        if (!this.timer)
            this.startCurrentBlock();
        else
            this.timer.start();
        this.status = 'running';
    }
    pause() {
        if (this.status !== 'running')
            return;
        this.timer?.pause();
        this.status = 'paused';
    }
    reset({ template } = {}) {
        if (template) {
            this.template = template;
            this.blockIndex = 0;
            this.remainingCycles = Math.max(1, template.repeat ?? 1);
        }
        if (this.timer)
            this.timer.reset();
        this.timer = null;
        this.status = 'idle';
        if (this.events.onTick) {
            const ms = this.currentBlock().durationMinutes * appConstants.msPerMinute;
            this.events.onTick(ms);
        }
    }
    skip() {
        this.finishBlock();
    }
    extend({ minutes }) {
        if (!this.timer)
            return;
        const extra = Math.max(1, Math.floor(minutes)) * appConstants.msPerMinute;
        const newDuration = this.timer.remainingMs() + extra;
        this.timer.reset({ durationMs: newDuration });
        this.timer.start();
    }
    startCurrentBlock() {
        const block = this.currentBlock();
        const durationMs = block.durationMinutes * appConstants.msPerMinute;
        if (this.events.onBlockStart)
            this.events.onBlockStart(this.blockIndex, block);
        this.timer = new FocusTimer({
            durationMs,
            onTick: (ms) => this.events.onTick && this.events.onTick(ms),
            onFinish: () => this.finishBlock()
        });
        this.timer.start();
    }
    finishBlock() {
        const block = this.currentBlock();
        if (this.events.onBlockEnd)
            this.events.onBlockEnd(this.blockIndex, block);
        this.timer = null;
        this.blockIndex++;
        if (this.blockIndex >= this.template.blocks.length) {
            this.blockIndex = 0;
            this.remainingCycles--;
            if (this.remainingCycles <= 0) {
                this.status = 'idle';
                if (this.events.onComplete)
                    this.events.onComplete();
                return;
            }
        }
        this.startCurrentBlock();
    }
}
