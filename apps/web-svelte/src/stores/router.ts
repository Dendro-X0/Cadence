import { writable, type Writable } from 'svelte/store'

export type Page = 'timer'|'templates'|'settings'

export const route: Writable<Page> = writable('timer')

export function switchTo(page: Page): void { route.set(page) }
