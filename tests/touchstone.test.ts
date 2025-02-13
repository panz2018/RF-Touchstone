import { describe, it, expect } from 'vitest'
import {
  Touchstone,
  TouchstoneFormats,
  TouchstoneParameters,
} from '@/touchstone'

describe('touchstone.ts', () => {
  it('Valid class', () => {
    expect(Touchstone).toBeTruthy()
  })
  it('Touchstone:format', () => {
    const touchstone = new Touchstone()
    expect(touchstone.format).toBe(undefined)
    // Wrong format type
    expect(() => (touchstone.format = 0 as never)).toThrow(
      `Unknown Touchstone format: 0`
    )
    expect(() => (touchstone.format = [] as never)).toThrow(
      `Unknown Touchstone format: `
    )
    expect(() => (touchstone.format = {} as never)).toThrow(
      `Unknown Touchstone format: [object Object]`
    )
    // Wrong unit string
    expect(() => (touchstone.format = 'z' as never)).toThrow(
      `Unknown Touchstone format: z`
    )
    // Correct units
    for (const format of TouchstoneFormats) {
      touchstone.format = format.toLowerCase() as never
      expect(touchstone.format).toBe(format)
    }
    // Undefined format
    for (const format of [undefined, null]) {
      touchstone.format = format as never
      expect(touchstone.format).toBe(undefined)
    }
  })
  it('Touchstone:parameter', () => {
    const touchstone = new Touchstone()
    expect(touchstone.parameter).toBe(undefined)
    // Wrong parameter type
    expect(() => (touchstone.parameter = 0 as never)).toThrow(
      `Unknown type of network paramter: 0`
    )
    expect(() => (touchstone.parameter = [] as never)).toThrow(
      `Unknown type of network paramter: `
    )
    expect(() => (touchstone.parameter = {} as never)).toThrow(
      `Unknown type of network paramter: [object Object]`
    )
    // Wrong unit string
    expect(() => (touchstone.parameter = 'x' as never)).toThrow(
      `Unknown type of network paramter: x`
    )
    // Correct units
    for (const parameter of TouchstoneParameters) {
      touchstone.parameter = parameter.toLowerCase() as never
      expect(touchstone.parameter).toBe(parameter)
    }
    // Undefined format
    for (const parameter of [undefined, null]) {
      touchstone.parameter = parameter as never
      expect(touchstone.parameter).toBe(undefined)
    }
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
  // it('readFromString error: multiple option lines', () => {
  //   const string = `
  //     ! 1-port S-parameter file
  //     # MHz S MA R 50
  //     # MHz S MA R 50
  //     # MHz S MA R 50
  //     100 0.99 -4 200 0.80 -22 300 0.707 -45
  //   `
  //   const touchstone = new Touchstone()
  //   expect(() => touchstone.readFromString(string, 1)).toThrow(
  //     'Only one option line starting with "#" is supported, but found 3 lines'
  //   )
  // })
  //   it('readFromString: test', () => {
  //     const string = `
  // ! 1-port S-parameter file
  // # MHz S MA R 50
  // 100 0.99 -4 200 0.80 -22 300 0.707 -45
  // `
  //     const touchstone = new Touchstone()
  //     touchstone.readFromString(string, 1)
  //   })
})
