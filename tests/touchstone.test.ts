import { describe, it, expect } from 'vitest'
import { Touchstone } from '@/touchstone'

describe('touchstone.ts', () => {
  it('Valid class', () => {
    expect(Touchstone).toBeTruthy()
  })
  it('Initialize', () => {
    const touchstone = new Touchstone()
    expect(touchstone).toBeTruthy()
    expect(touchstone.comments).toBe('')
    expect(touchstone.read_text).toBeTruthy()
  })
  it('read_text: empty', () => {
    const touchstone = new Touchstone()
    touchstone.read_text('')
  })
})
