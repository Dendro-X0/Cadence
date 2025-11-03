import '@cadence/ui/tokens.css'
import App from './App.svelte'
import { setupPwa } from './pwa'
import { mount } from 'svelte'

function getTarget(): HTMLDivElement {
  const el = document.getElementById('app')
  if (!el) throw new Error('Missing #app root element')
  return el as HTMLDivElement
}

function renderError(target: HTMLElement, err: unknown): void {
  const message = (err instanceof Error ? err.message : String(err))
  target.innerHTML = `<pre style="white-space:pre-wrap;color:#fda4af;background:#1f2937;padding:12px;border-radius:8px">Boot error: ${message}</pre>`
}

let app: unknown
try {
  const target = getTarget()
  app = mount(App, { target })
  setupPwa()
  // expose for quick manual debugging
  ;(window as unknown as { __cadence?: App }).__cadence = app
} catch (err) {
  try { renderError(getTarget(), err) } catch {}
  // eslint-disable-next-line no-console
  console.error('Cadence boot error', err)
}

export default app!
