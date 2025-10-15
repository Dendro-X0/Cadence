import type { Task } from '@cadence/core-domain/task'
import { FocusRepository } from '@cadence/storage/focus-repository'

/**
 * TaskManager coordinates task CRUD for the UI.
 */
export class TaskManager {
  /** Create a task. */
  async add({ title }: { title: string }): Promise<{ task: Task }> {
    return FocusRepository.addTask({ title })
  }
  /** Toggle a task done flag. */
  async toggle({ id }: { id: string }): Promise<{ task: Task | null }> {
    return FocusRepository.toggleTask({ id })
  }
  /** Remove a task by id. */
  async remove({ id }: { id: string }): Promise<{ removed: boolean }> {
    return FocusRepository.removeTask({ id })
  }
  /** List all tasks. */
  async list(): Promise<{ tasks: readonly Task[] }> {
    return FocusRepository.listTasks()
  }
}
