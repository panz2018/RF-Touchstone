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
    // Wrong input type
    expect(() => (touchstone.format = 0 as never)).toThrow(
      `Unknown Touchstone format: 0`
    )
    expect(() => (touchstone.format = [] as never)).toThrow(
      `Unknown Touchstone format: `
    )
    expect(() => (touchstone.format = {} as never)).toThrow(
      `Unknown Touchstone format: [object Object]`
    )
    // Wrong input value
    expect(() => (touchstone.format = 'z' as never)).toThrow(
      `Unknown Touchstone format: z`
    )
    // Correct input values
    for (const format of TouchstoneFormats) {
      touchstone.format = format.toLowerCase() as never
      expect(touchstone.format).toBe(format)
    }
    // Undefined input value
    for (const format of [undefined, null]) {
      touchstone.format = format as never
      expect(touchstone.format).toBe(undefined)
    }
  })
  it('Touchstone:parameter', () => {
    const touchstone = new Touchstone()
    expect(touchstone.parameter).toBe(undefined)
    // Wrong input type
    expect(() => (touchstone.parameter = 0 as never)).toThrow(
      `Unknown Touchstone paramter: 0`
    )
    expect(() => (touchstone.parameter = [] as never)).toThrow(
      `Unknown Touchstone paramter: `
    )
    expect(() => (touchstone.parameter = {} as never)).toThrow(
      `Unknown Touchstone paramter: [object Object]`
    )
    // Wrong input value
    expect(() => (touchstone.parameter = 'x' as never)).toThrow(
      `Unknown Touchstone paramter: x`
    )
    // Correct input values
    for (const parameter of TouchstoneParameters) {
      touchstone.parameter = parameter.toLowerCase() as never
      expect(touchstone.parameter).toBe(parameter)
    }
    // Undefined input value
    for (const parameter of [undefined, null]) {
      touchstone.parameter = parameter as never
      expect(touchstone.parameter).toBe(undefined)
    }
  })
  it('Touchstone:impedance', () => {
    const touchstone = new Touchstone()
    expect(touchstone.impedance).toBe(50)
    // Wrong input type
    expect(() => (touchstone.impedance = 'a' as never)).toThrow(
      `Unknown Touchstone impedance: a`
    )
    expect(() => (touchstone.impedance = [50, 'a'] as never)).toThrow(
      `Unknown Touchstone impedance: 50,a`
    )
    expect(() => (touchstone.impedance = [] as never)).toThrow(
      `Unknown Touchstone impedance: `
    )
    expect(() => (touchstone.impedance = {} as never)).toThrow(
      `Unknown Touchstone impedance: [object Object]`
    )
    // Correct input values
    for (const impedance of [0, 10.5, 50, [10], [10, 25], [30, 67.1, 80.9]]) {
      touchstone.impedance = impedance
      expect(touchstone.impedance).toStrictEqual(impedance)
    }
    // Undefined input value
    for (const impedance of [undefined, null]) {
      expect(() => (touchstone.impedance = impedance as never)).toThrow(
        `Unknown Touchstone impedance: ${impedance}`
      )
    }
  })
  it('Touchstone:nports', () => {
    const touchstone = new Touchstone()
    expect(touchstone.nports).toBe(undefined)
    // Wrong input type
    expect(() => (touchstone.nports = 'a' as never)).toThrow(
      `Unknown ports number: a`
    )
    expect(() => (touchstone.nports = [50, 'a'] as never)).toThrow(
      `Unknown ports number: 50,a`
    )
    expect(() => (touchstone.nports = [] as never)).toThrow(
      `Unknown ports number: `
    )
    expect(() => (touchstone.nports = {} as never)).toThrow(
      `Unknown ports number: [object Object]`
    )
    expect(() => (touchstone.nports = 1.3)).toThrow(`Unknown ports number: 1.3`)
    expect(() => (touchstone.nports = 0)).toThrow(`Unknown ports number: 0`)
    expect(() => (touchstone.nports = -5)).toThrow(`Unknown ports number: -5`)
    // Correct input values
    for (const nports of [1, 6, 13, 50]) {
      touchstone.nports = nports
      expect(touchstone.nports).toStrictEqual(nports)
    }
    // Undefined input value
    for (const nports of [undefined, null]) {
      touchstone.nports = nports as never
      expect(touchstone.nports).toBe(undefined)
    }
  })
  it('readFromString error: no option line', () => {
    const string = `
      ! 1-port S-parameter file
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(touchstone.readFromString).toBeTruthy()
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
