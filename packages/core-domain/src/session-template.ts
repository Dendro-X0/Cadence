export interface SessionBlock {
  readonly label: string
  readonly durationMinutes: number
  readonly type: 'focus' | 'break' | 'meditation' | 'workout' | 'rest' | 'custom'
}

export interface SessionTemplate {
  readonly id: string
  readonly name: string
  readonly blocks: readonly SessionBlock[]
  readonly repeat?: number
}
