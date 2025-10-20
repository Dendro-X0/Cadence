import { FocusRepository } from '@cadence/storage/focus-repository';
/**
 * TaskManager coordinates task CRUD for the UI.
 */
export class TaskManager {
    /** Create a task. */
    async add({ title }) {
        return FocusRepository.addTask({ title });
    }
    /** Toggle a task done flag. */
    async toggle({ id }) {
        return FocusRepository.toggleTask({ id });
    }
    /** Remove a task by id. */
    async remove({ id }) {
        return FocusRepository.removeTask({ id });
    }
    /** List all tasks. */
    async list() {
        return FocusRepository.listTasks();
    }
}
