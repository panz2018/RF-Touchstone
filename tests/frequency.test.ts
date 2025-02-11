import { describe, it, expect } from 'vitest'
import { Frequency } from '@/frequency'

describe('frequency.ts', () => {
  const frequency = new Frequency()

  it('Frequency', () => {
    expect(Frequency).toBeTruthy()
    expect(frequency.unit).toBe('Hz')
  })
})
