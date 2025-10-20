import { openDB } from 'idb';
const DB_NAME = 'focus-motive';
const DB_VERSION = 2;
const SETTINGS_KEY = 'app';
export class FocusRepository {
    static open() {
        if (!this.dbPromise) {
            this.dbPromise = openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('settings'))
                        db.createObjectStore('settings');
                    if (!db.objectStoreNames.contains('tasks')) {
                        db.createObjectStore('tasks');
                    }
                    if (!db.objectStoreNames.contains('templates'))
                        db.createObjectStore('templates');
                }
            });
        }
        return this.dbPromise;
    }
    // Settings
    static async saveSettings({ settings }) {
        const db = await this.open();
        await db.put('settings', settings, SETTINGS_KEY);
        return { ok: true };
    }
    static async loadSettings(defaults) {
        const db = await this.open();
        const stored = await db.get('settings', SETTINGS_KEY);
        return { settings: stored ?? defaults };
    }
    // Tasks
    static async addTask({ title }) {
        const db = await this.open();
        const task = { id: crypto.randomUUID(), title, createdAt: Date.now(), done: false };
        await db.put('tasks', task, task.id);
        return { task };
    }
    static async listTasks() {
        const db = await this.open();
        const keys = await db.getAllKeys('tasks');
        const tasks = await Promise.all(keys.map((k) => db.get('tasks', k)));
        const sorted = tasks.filter(Boolean).sort((a, b) => a.createdAt - b.createdAt);
        return { tasks: sorted };
    }
    static async toggleTask({ id }) {
        const db = await this.open();
        const existing = await db.get('tasks', id);
        if (!existing)
            return { task: null };
        const updated = { ...existing, done: !existing.done };
        await db.put('tasks', updated, id);
        return { task: updated };
    }
    static async removeTask({ id }) {
        const db = await this.open();
        const exists = await db.get('tasks', id);
        if (!exists)
            return { removed: false };
        await db.delete('tasks', id);
        return { removed: true };
    }
    // Templates
    static async saveTemplate({ tpl }) {
        const db = await this.open();
        await db.put('templates', tpl, tpl.id);
        return { ok: true };
    }
    static async listTemplates() {
        const db = await this.open();
        const keys = await db.getAllKeys('templates');
        const all = await Promise.all(keys.map((k) => db.get('templates', k)));
        return { templates: all.filter(Boolean) };
    }
    static async removeTemplate({ id }) {
        const db = await this.open();
        const exists = await db.get('templates', id);
        if (!exists)
            return { removed: false };
        await db.delete('templates', id);
        return { removed: true };
    }
}
Object.defineProperty(FocusRepository, "dbPromise", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: null
});
