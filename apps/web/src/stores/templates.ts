import { writable, type Writable } from 'svelte/store'
import type { SessionTemplate } from '@cadence/core-domain/session-template'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { builtInTemplates } from '@cadence/templates/defaults'

export const savedTemplates: Writable<readonly SessionTemplate[]> = writable([])

export async function loadAllTemplates(): Promise<{ builtIn: readonly SessionTemplate[]; saved: readonly SessionTemplate[] }> {
  const { templates } = await FocusRepository.listTemplates()
  savedTemplates.set(templates)
  return { builtIn: builtInTemplates, saved: templates }
}

export async function saveTemplate(tpl: SessionTemplate): Promise<void> {
  await FocusRepository.saveTemplate({ tpl })
  const { templates } = await FocusRepository.listTemplates()
  savedTemplates.set(templates)
}

export async function removeTemplate(id: string): Promise<void> {
  await FocusRepository.removeTemplate({ id })
  const { templates } = await FocusRepository.listTemplates()
  savedTemplates.set(templates)
}
