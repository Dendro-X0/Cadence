import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Settings } from '@cadence/core-domain/settings'
import type { Task } from '@cadence/core-domain/task'
import type { SessionTemplate } from '@cadence/core-domain/session-template'

interface FocusDB extends DBSchema {
  settings: { key: 'app'; value: Settings }
  tasks: { key: string; value: Task }
  templates: { key: string; value: SessionTemplate }
}

const DB_NAME = 'focus-motive' as const
const DB_VERSION = 2 as const
const SETTINGS_KEY: 'app' = 'app'

export class FocusRepository {
  private static dbPromise: Promise<IDBPDatabase<FocusDB>> | null = null

  private static open(): Promise<IDBPDatabase<FocusDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<FocusDB>(DB_NAME, DB_VERSION, {
        upgrade(db: IDBPDatabase<FocusDB>) {
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
          if (!db.objectStoreNames.contains('tasks')) {
            db.createObjectStore('tasks')
          }
          if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates')
        }
      })
    }
    return this.dbPromise!
  }

  // Settings
  static async saveSettings({ settings }: { settings: Settings }): Promise<{ ok: true }> {
    const db = await this.open()
    await db.put('settings', settings, SETTINGS_KEY)
    return { ok: true }
  }

  static async loadSettings(defaults: Settings): Promise<{ settings: Settings }> {
    const db = await this.open()
    const stored = await db.get('settings', SETTINGS_KEY)
    return { settings: stored ?? defaults }
  }

  // Tasks
  static async addTask({ title }: { title: string }): Promise<{ task: Task }> {
    const db = await this.open()
    const task: Task = { id: crypto.randomUUID(), title, createdAt: Date.now(), done: false }
    await db.put('tasks', task, task.id)
    return { task }
  }

  static async listTasks(): Promise<{ tasks: readonly Task[] }> {
    const db = await this.open()
    const keys = await db.getAllKeys('tasks')
    const tasks = await Promise.all(keys.map((k: string) => db.get('tasks', k)))
    const sorted = (tasks.filter(Boolean) as Task[]).sort((a, b) => a.createdAt - b.createdAt)
    return { tasks: sorted }
  }

  static async toggleTask({ id }: { id: string }): Promise<{ task: Task | null }> {
    const db = await this.open()
    const existing = await db.get('tasks', id)
    if (!existing) return { task: null }
    const updated: Task = { ...existing, done: !existing.done }
    await db.put('tasks', updated, id)
    return { task: updated }
  }

  static async removeTask({ id }: { id: string }): Promise<{ removed: boolean }> {
    const db = await this.open()
    const exists = await db.get('tasks', id)
    if (!exists) return { removed: false }
    await db.delete('tasks', id)
    return { removed: true }
  }

  // Templates
  static async saveTemplate({ tpl }: { tpl: SessionTemplate }): Promise<{ ok: true }> {
    const db = await this.open()
    await db.put('templates', tpl, tpl.id)
    return { ok: true }
  }

  static async listTemplates(): Promise<{ templates: readonly SessionTemplate[] }> {
    const db = await this.open()
    const keys = await db.getAllKeys('templates')
    const all = await Promise.all(keys.map((k: string) => db.get('templates', k)))
    return { templates: (all.filter(Boolean) as SessionTemplate[]) }
  }

  static async removeTemplate({ id }: { id: string }): Promise<{ removed: boolean }> {
    const db = await this.open()
    const exists = await db.get('templates', id)
    if (!exists) return { removed: false }
    await db.delete('templates', id)
    return { removed: true }
  }
}
