import { writable, type Writable } from 'svelte/store'

export type Page = 'timer'|'templates'|'getapp'|'settings'

export const route: Writable<Page> = writable('timer')

function parseTabParam(url: URL): Page | null {
  const tab = url.searchParams.get('tab')
  if (tab === 'timer' || tab === 'templates' || tab === 'getapp' || tab === 'settings') return tab
  return null
}

export function initRouterFromUrl(): void {
  const current = parseTabParam(new URL(window.location.href))
  if (current) route.set(current)
  window.addEventListener('popstate', () => {
    const p = parseTabParam(new URL(window.location.href))
    if (p) route.set(p)
  })
}

export function switchTo(page: Page): void {
  const url = new URL(window.location.href)
  url.searchParams.set('tab', page)
  window.history.pushState(null, '', url)
  route.set(page)
}
