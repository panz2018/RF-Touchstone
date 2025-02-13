import { describe, it, expect } from 'vitest'
import { Touchstone } from '@/touchstone'

describe('touchstone.ts', () => {
  it('Valid class', () => {
    expect(Touchstone).toBeTruthy()
  })
  it('Initialize', () => {
    const touchstone = new Touchstone()
    expect(touchstone).toBeTruthy()
    expect(touchstone.comments).toStrictEqual([])
    expect(touchstone.readFromString).toBeTruthy()
  })
  it('readFromString error: no option line', () => {
    const string = `
      ! 1-port S-parameter file
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Unable to find the option line starting with "#"'
    )
  })
  it('readFromString error: multiple option lines', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA R 50
      # MHz S MA R 50
      # MHz S MA R 50
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Only one option line starting with "#" is supported, but found 3 lines'
    )
  })
  it('readFromString: test', () => {
    const string = `
! 1-port S-parameter file
# MHz S MA R 50
100 0.99 -4 200 0.80 -22 300 0.707 -45
`
    const touchstone = new Touchstone()
    touchstone.readFromString(string, 1)
  })
})
