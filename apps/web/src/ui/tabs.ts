import type { Settings } from '@cadence/core-domain/settings'

export type Page = 'timer'|'templates'|'settings'

export type TabsApi = {
  switchTo: (page: Page) => void
  applyTabsPlacement: () => void
}

export function setupTabs(container: HTMLDivElement, args: {
  panel: HTMLDivElement
  current: () => Settings
  save: (next: Settings) => Promise<void>
}): TabsApi {
  const tabsTopEl = container.querySelector<HTMLDivElement>('#tabs-top')!
  const tabsBottomEl = container.querySelector<HTMLDivElement>('#tabs-bottom')!
  const tabButtons: HTMLButtonElement[] = [
    ...Array.from(tabsTopEl.querySelectorAll<HTMLButtonElement>('.tab')),
    ...Array.from(tabsBottomEl.querySelectorAll<HTMLButtonElement>('.tab'))
  ]
  const viewTimer = container.querySelector<HTMLDivElement>('#view-timer')!
  const viewTemplates = container.querySelector<HTMLDivElement>('#view-templates')!
  const viewSettings = container.querySelector<HTMLDivElement>('#view-settings')!

  const animateBars = (): void => {
    tabsTopEl.classList.add('tabs-switch')
    tabsBottomEl.classList.add('tabs-switch')
    window.setTimeout(() => { tabsTopEl.classList.remove('tabs-switch'); tabsBottomEl.classList.remove('tabs-switch') }, 240)
  }

  const switchTo = (page: Page): void => {
    viewTimer.style.display = page==='timer' ? '' : 'none'
    viewTemplates.style.display = page==='templates' ? '' : 'none'
    viewSettings.style.display = page==='settings' ? '' : 'none'
    tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.page === page))
    args.panel.classList.toggle('view', page === 'settings')
    if (page !== 'settings') args.panel.classList.remove('show')
    const view = page==='timer'?viewTimer:page==='templates'?viewTemplates:viewSettings
    view.classList.add('fade-in'); window.setTimeout(() => view.classList.remove('fade-in'), 300)
    const next = { ...args.current(), activeTab: page }
    void args.save(next)
    animateBars()
  }
  tabButtons.forEach((b) => { b.onclick = () => switchTo((b.dataset.page as Page) ?? 'timer') })

  const selTabsPlacement = container.querySelector<HTMLSelectElement>('#tabs-placement')!
  const applyTabsPlacement = (): void => {
    const preferBottom = (args.current().tabsPlacement ?? 'top') === 'bottom'
    const autoSmall = window.innerWidth < 540
    const useBottom = preferBottom || autoSmall
    tabsTopEl.style.display = useBottom ? 'none' : ''
    tabsBottomEl.style.display = useBottom ? '' : 'none'
  }

  selTabsPlacement.onchange = async () => {
    const next = { ...args.current(), tabsPlacement: selTabsPlacement.value as ('top'|'bottom') }
    await args.save(next)
    applyTabsPlacement()
  }

  return { switchTo, applyTabsPlacement }
}
