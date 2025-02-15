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
  it('readFromString error: wrong impedance token', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  Z  50 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Uknown Touchstone impedance: Z 50'
    )
  })
  it('readFromString error: wrong single impedance value', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  r  resistance 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Uknown Touchstone impedance: r resistance'
    )
  })
  it('readFromString error: wrong multiple impedance values', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  r 50 resistance 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Uknown Touchstone impedance: r 50 resistance'
    )
  })
  it('readFromString: invalid data number', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA
      100 0.99 
      -4 200 0.80 
      -22 300 
      0.707
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readFromString(string, 1)).toThrow(
      'Touchstone invalid data number: 8, which should be multiple of 3'
    )
    expect(touchstone.comments).toStrictEqual(['! 1-port S-parameter file'])
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(50)
    expect(touchstone.nports).toBe(1)
    expect(touchstone.frequency!.unit).toBe('MHz')
  })
  // it('readFromString: no impedance', () => {
  //   const string = `
  //     ! 1-port S-parameter file
  //     # MHz S MA
  //     100 0.99
  //     -4 200 0.80
  //     -22 300
  //     0.707 -45
  //   `
  //   const touchstone = new Touchstone()
  //   touchstone.readFromString(string, 1)
  //   expect(touchstone.comments).toStrictEqual(['! 1-port S-parameter file'])
  //   expect(touchstone.format).toBe('MA')
  //   expect(touchstone.parameter).toBe('S')
  //   expect(touchstone.impedance).toBe(50)
  //   expect(touchstone.nports).toBe(1)
  //   expect(touchstone.frequency!.unit).toBe('MHz')
  //   expect(touchstone.frequency!.value).toStrictEqual([100, 200, 300])

  //   console.log(touchstone)
  // })
  it('readFromString: no impedance', () => {
    const string = `
      ! 3-port S-parameter file
      # Hz S MA
      ! Freq     S11_Mag    S11_Ang     S12_Mag    S12_Ang     S13_Mag    S13_Ang     S21_Mag    S21_Ang     S22_Mag    S22_Ang     S23_Mag    S23_Ang     S31_Mag    S31_Ang     S32_Mag    S32_Ang     S33_Mag    S33_Ang
      ! ---------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------
      1.000E+06  0.80       -20.0       0.05        30.0       0.03       -45.0       0.05       -30.0       0.75       -10.0       0.02        15.0       0.02        45.0       0.03        -10.0       0.70       -5.0
      5.000E+06  0.75       -40.0       0.10        45.0       0.06       -60.0       0.10       -45.0       0.70       -20.0       0.04        25.0       0.04        60.0       0.06        -20.0       0.65       -10.0
      1.000E+07  0.70       -60.0       0.15        60.0       0.09       -75.0       0.15       -60.0       0.65       -30.0       0.06        35.0       0.06       -75.0       0.09        -30.0       0.60       -15.0
      5.000E+07  0.60       -80.0       0.20        75.0       0.12       -90.0       0.20       -75.0       0.55       -40.0       0.08        45.0       0.08       -90.0       0.12        -40.0       0.50       -20.0
      1.000E+08  0.50      -100.0       0.25        90.0       0.15      -105.0       0.25       -90.0       0.45       -50.0       0.10        55.0       0.10      -105.0       0.15        -50.0       0.40       -25.0
    `
    const touchstone = new Touchstone()
    touchstone.readFromString(string, 3)
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(50)
    expect(touchstone.nports).toBe(3)
    expect(touchstone.frequency!.unit).toBe('Hz')
    expect(touchstone.frequency!.value).toStrictEqual([1e6, 5e6, 1e7, 5e7, 1e8])

    console.log(touchstone)
  })
})
