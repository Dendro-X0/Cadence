import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Task } from '../core/types'
import type { Settings } from '../core/settings'

interface FocusDB extends DBSchema {
  settings: { key: 'app'; value: Settings }
  tasks: { key: string; value: Task; indexes: { 'by-done': boolean } }
}

const DB_NAME = 'focus-motive' as const
const DB_VERSION = 1 as const
const SETTINGS_KEY: 'app' = 'app'

/**
 * Repository for persistent storage using IndexedDB.
 * Provides CRUD operations for `Task` and persistence for `Settings`.
 */
export class FocusRepository {
  private static dbPromise: Promise<IDBPDatabase<FocusDB>> | null = null

  private static open(): Promise<IDBPDatabase<FocusDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<FocusDB>(DB_NAME, DB_VERSION, {
        upgrade(db: IDBPDatabase<FocusDB>) {
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
          if (!db.objectStoreNames.contains('tasks')) {
            const store = db.createObjectStore('tasks')
            store.createIndex('by-done', 'done')
          }
        }
      })
    }
    return this.dbPromise!
  }

  /**
   * Save global application settings.
   * @param settings Settings to persist under a fixed key.
   * @returns Object indicating success.
   */
  static async saveSettings({ settings }: { settings: Settings }): Promise<{ ok: true }> {
    const db = await this.open()
    await db.put('settings', settings, SETTINGS_KEY)
    return { ok: true }
  }

  /**
   * Load persisted settings or return provided defaults if none exist.
   * @param defaults Default settings when none are stored.
   * @returns Loaded settings.
   */
  static async loadSettings(defaults: Settings): Promise<{ settings: Settings }> {
    const db = await this.open()
    const stored = await db.get('settings', SETTINGS_KEY)
    return { settings: stored ?? defaults }
  }

  /**
   * Add a new task with generated id.
   * @param title Task title.
   * @returns The created task.
   */
  static async addTask({ title }: { title: string }): Promise<{ task: Task }> {
    const db = await this.open()
    const task: Task = { id: crypto.randomUUID(), title, createdAt: Date.now(), done: false }
    await db.put('tasks', task, task.id)
    return { task }
  }

  /**
   * List all tasks sorted by creation time.
   * @returns Sorted array of tasks.
   */
  static async listTasks(): Promise<{ tasks: readonly Task[] }> {
    const db = await this.open()
    const keys = await db.getAllKeys('tasks')
    const tasks = await Promise.all(keys.map((k: string) => db.get('tasks', k)))
    const sorted = (tasks.filter(Boolean) as Task[]).sort((a, b) => a.createdAt - b.createdAt)
    return { tasks: sorted }
  }

  /**
   * Toggle the `done` flag of a task by id.
   * @param id Task id.
   * @returns Updated task or null if not found.
   */
  static async toggleTask({ id }: { id: string }): Promise<{ task: Task | null }> {
    const db = await this.open()
    const existing = await db.get('tasks', id)
    if (!existing) return { task: null }
    const updated: Task = { ...existing, done: !existing.done }
    await db.put('tasks', updated, id)
    return { task: updated }
  }

  /**
   * Remove a task by id.
   * @param id Task id.
   * @returns Whether a task was removed.
   */
  static async removeTask({ id }: { id: string }): Promise<{ removed: boolean }> {
    const db = await this.open()
    const exists = await db.get('tasks', id)
    if (!exists) return { removed: false }
    await db.delete('tasks', id)
    return { removed: true }
  }
}
