import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  abs,
  arg,
  complex,
  Complex,
  log10,
  pi,
  pow,
  random,
  round,
} from 'mathjs'
import {
  Touchstone,
  TouchstoneFormats,
  TouchstoneParameters,
} from '@/touchstone'
import type { TouchstoneFormat, TouchstoneParameter } from '@/touchstone'
import { Frequency } from '@/frequency'
import { createRandomTouchstoneMatrix } from './python/randomTouchstoneMatrix'
import { pythonReadContent } from './python/pythonReadContent'
import { pythonWriteContent } from './python/pythonWriteContent'

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
      `Unknown Touchstone parameter: 0`
    )
    expect(() => (touchstone.parameter = [] as never)).toThrow(
      `Unknown Touchstone parameter: `
    )
    expect(() => (touchstone.parameter = {} as never)).toThrow(
      `Unknown Touchstone parameter: [object Object]`
    )
    // Wrong input value
    expect(() => (touchstone.parameter = 'x' as never)).toThrow(
      `Unknown Touchstone parameter: x`
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
  it('Touchstone:matrix', () => {
    const touchstone = new Touchstone()
    expect(touchstone.matrix).toBe(undefined)
    touchstone.matrix = null
    expect(touchstone.matrix).toBe(undefined)
    touchstone.matrix = [
      [[complex(1, 0)], [complex(2, 1)]],
      [[complex(3, 2)], [complex(4, 5)]],
    ]
    expect(touchstone.matrix).toStrictEqual([
      [[complex(1, 0)], [complex(2, 1)]],
      [[complex(3, 2)], [complex(4, 5)]],
    ])
    touchstone.matrix = undefined
    expect(touchstone.matrix).toBe(undefined)
  })
  it('readContent error: no option line', () => {
    const string = `
      ! 1-port S-parameter file
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(touchstone.readContent).toBeTruthy()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Unable to find the option line starting with "#"'
    )
  })
  it('readContent error: multiple option lines', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA R 50
      # MHz S MA R 50
      # MHz S MA R 50
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Only one option line starting with "#" is supported, but found 3 lines'
    )
  })
  it('readContent error: invalid format', () => {
    const touchstone = new Touchstone()
    const invalidContent = `
      ! Test invalid format
      # MHz S INVALID R 50
      100 0.99 -4
    `
    expect(() => touchstone.readContent(invalidContent, 1)).toThrow(
      'Unknown Touchstone format: INVALID'
    )
  })
  it('readContent error: wrong impedance token', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  Z  50 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Unknown Touchstone impedance: Z 50'
    )
  })
  it('readContent error: wrong single impedance value', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  r  resistance 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Unknown Touchstone impedance: r resistance'
    )
  })
  it('readContent error: wrong multiple impedance values', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz  S MA  r 50 resistance 
      100 0.99 -4 200 0.80 -22 300 0.707 -45
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Unknown Touchstone impedance: r 50 resistance'
    )
  })
  it('readContent: invalid data number', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA
      100 0.99 
      -4 200 0.80 
      -22 300 
      0.707
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 1)).toThrow(
      'Touchstone invalid data number: 8, which should be multiple of 3'
    )
    expect(touchstone.comments).toStrictEqual(['1-port S-parameter file'])
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(50)
    expect(touchstone.nports).toBe(1)
    expect(touchstone.frequency!.unit).toBe('MHz')
  })
  it('readContent: 1-port S-parameter file, no impedance', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA
      100 0.99
      -4 200 0.80
      -22 300
      0.707 -45
    `
    const touchstone = new Touchstone()
    touchstone.readContent(string, 1)
    expect(touchstone.comments).toStrictEqual(['1-port S-parameter file'])
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(50)
    expect(touchstone.nports).toBe(1)
    // Check frequency
    expect(touchstone.frequency).toBeTruthy()
    expect(touchstone.frequency!.unit).toBe('MHz')
    expect(touchstone.frequency!.f_scaled).toStrictEqual([100, 200, 300])
    // Check matrix
    expect(touchstone.matrix).toBeTruthy()
    expect(touchstone.matrix!.length).toBe(1)
    touchstone.matrix!.forEach((array) => {
      expect(array.length).toBe(1)
      array.forEach((a) => {
        expect(a.length).toBe(3)
      })
    })
    // S11
    expect(touchstone.matrix![0][0].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.99, 0.8, 0.707]
    )
    expect(
      touchstone.matrix![0][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-4, -22, -45])
  })
  it('readContent: single frequency point', () => {
    const string = `
      ! 1-port S-parameter file
      # MHz S MA
      100 0.99 -4
    `
    const touchstone = new Touchstone()
    touchstone.readContent(string, 1)
    expect(touchstone.comments).toStrictEqual(['1-port S-parameter file'])
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(50)
    expect(touchstone.nports).toBe(1)
    // Check frequency
    expect(touchstone.frequency).toBeTruthy()
    expect(touchstone.frequency!.unit).toBe('MHz')
    expect(touchstone.frequency!.f_scaled).toStrictEqual([100])
    // Check matrix
    expect(touchstone.matrix).toBeTruthy()
    expect(touchstone.matrix!.length).toBe(1)
    touchstone.matrix!.forEach((array) => {
      expect(array.length).toBe(1)
      array.forEach((a) => {
        expect(a.length).toBe(1)
      })
    })
    // S11
    expect(touchstone.matrix![0][0].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.99]
    )
    expect(
      touchstone.matrix![0][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-4])
  })
  it('readContent: 3-port S-parameter file, three impedances', () => {
    const string = `
      ! 3-port S-parameter file
      # Hz S MA R 20 35 60
      ! Freq     S11_Mag    S11_Ang     S12_Mag    S12_Ang     S13_Mag    S13_Ang     S21_Mag    S21_Ang     S22_Mag    S22_Ang     S23_Mag    S23_Ang     S31_Mag    S31_Ang     S32_Mag    S32_Ang     S33_Mag    S33_Ang
      ! ---------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------|------------
      1.000E+06  0.80       -20.0       0.05        30.0       0.03       -45.0       0.05       -30.0       0.75       -10.0       0.02        15.0       0.02        45.0       0.03        -10.0       0.70       -5.0
      5.000E+06  0.75       -40.0       0.10        45.0       0.06       -60.0       0.10       -45.0       0.70       -20.0       0.04        25.0       0.04        60.0       0.06        -20.0       0.65       -10.0
      1.000E+07  0.70       -60.0       0.15        60.0       0.09       -75.0       0.15       -60.0       0.65       -30.0       0.06        35.0       0.06       -75.0       0.09        -30.0       0.60       -15.0
      5.000E+07  0.60       -80.0       0.20        75.0       0.12       -90.0       0.20       -75.0       0.55       -40.0       0.08        45.0       0.08       -90.0       0.12        -40.0       0.50       -20.0
      1.000E+08  0.50      -100.0       0.25        90.0       0.15      -105.0       0.25       -90.0       0.45       -50.0       0.10        55.0       0.10      -105.0       0.15        -50.0       0.40       -25.0
    `
    const touchstone = new Touchstone()
    touchstone.readContent(string, 3)
    expect(touchstone.comments.length).toBe(3)
    expect(touchstone.comments[0]).toBe('3-port S-parameter file')
    expect(touchstone.format).toBe('MA')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toStrictEqual([20, 35, 60])
    expect(touchstone.nports).toBe(3)
    expect(touchstone.frequency).toBeTruthy()
    expect(touchstone.frequency!.unit).toBe('Hz')
    expect(touchstone.frequency!.f_scaled).toStrictEqual([
      1e6, 5e6, 1e7, 5e7, 1e8,
    ])
    expect(touchstone.matrix).toBeTruthy()
    expect(touchstone.matrix!.length).toBe(3)
    touchstone.matrix!.forEach((array) => {
      expect(array.length).toBe(3)
      array.forEach((a) => {
        expect(a.length).toBe(5)
      })
    })
    // S11
    expect(touchstone.matrix![0][0].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.8, 0.75, 0.7, 0.6, 0.5]
    )
    expect(
      touchstone.matrix![0][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-20, -40, -60, -80, -100])
    // S12
    expect(touchstone.matrix![0][1].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.05, 0.1, 0.15, 0.2, 0.25]
    )
    expect(
      touchstone.matrix![0][1].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([30, 45, 60, 75, 90])
    // S13
    expect(touchstone.matrix![0][2].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.03, 0.06, 0.09, 0.12, 0.15]
    )
    expect(
      touchstone.matrix![0][2].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-45, -60, -75, -90, -105])
    // S21
    expect(touchstone.matrix![1][0].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.05, 0.1, 0.15, 0.2, 0.25]
    )
    expect(
      touchstone.matrix![1][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-30, -45, -60, -75, -90])
    // S22
    expect(touchstone.matrix![1][1].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.75, 0.7, 0.65, 0.55, 0.45]
    )
    expect(
      touchstone.matrix![1][1].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-10, -20, -30, -40, -50])
    // S23
    expect(touchstone.matrix![1][2].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.02, 0.04, 0.06, 0.08, 0.1]
    )
    expect(
      touchstone.matrix![1][2].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([15, 25, 35, 45, 55])
    // S31
    expect(touchstone.matrix![2][0].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.02, 0.04, 0.06, 0.08, 0.1]
    )
    expect(
      touchstone.matrix![2][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([45, 60, -75, -90, -105])
    // S32
    expect(touchstone.matrix![2][1].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.03, 0.06, 0.09, 0.12, 0.15]
    )
    expect(
      touchstone.matrix![2][1].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-10, -20, -30, -40, -50])
    // S33
    expect(touchstone.matrix![2][2].map((c) => round(abs(c), 5))).toStrictEqual(
      [0.7, 0.65, 0.6, 0.5, 0.4]
    )
    expect(
      touchstone.matrix![2][2].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-5, -10, -15, -20, -25])
  })
  it('readContent: 4-port S-parameter file, one impedance', () => {
    const string = `
      ! 4-port S-parameter data
      ! Data points are at three frequency points (non-aligned)
      ! Format: Frequency, then S-parameters in DB-Angle format, row by row

      # GHz S DB R 32

      ! -----------------------------------------------------------------------
      ! Data block starts - Frequency and S-parameter data in DB-Angle format
      ! -----------------------------------------------------------------------
      ! Frequency unit: GHz (Gigahertz)
      ! S-parameter data representation: Decibel-Angle (DB) format.
      !   Magnitude is converted to dB (Decibel = 20 * log10(Magnitude)).
      !   Angle remains in degrees.
      ! Data is arranged row-wise, for each frequency.

      5.00000     -2.92  170.0     -13.98  -30.0    -26.02  -60.0    -33.98  -90.0    ! ! Row 1 - 5.0 GHz
                  -20.00  -150.0   -2.48  160.0     -30.46  -70.0    -24.44  -80.0    ! ! Row 2 - 5.0 GHz
                  -26.02  -120.0   -30.46  -100.0   -1.94  150.0     -21.94  -50.0    ! ! Row 3 - 5.0 GHz
                  -33.98  -180.0   -24.44  -110.0   -21.94  -40.0    -1.41  140.0    ! ! Row 4 - 5.0 GHz

      6.00000     -4.44  150.37    -13.98  -35.0    -24.44  -65.0    -30.46  -95.0    ! ! Row 1 - 6.0 GHz
                  -20.00  -155.0   -3.01  150.37    -24.44  -75.0    -23.01  -85.0    ! ! Row 2 - 6.0 GHz
                  -24.44  -125.0   -27.96  -105.0   -2.51  150.37    -20.97  -55.0    ! ! Row 3 - 6.0 GHz
                  -30.46  -185.0   -23.01  -115.0   -20.97  -45.0    -1.94  150.37    ! ! Row 4 - 6.0 GHz

      7.00000     -6.02  136.69    -12.92  -40.0    -23.01  -70.0    -27.96  -100.0   ! ! Row 1 - 7.0 GHz
                  -16.44  -160.0   -3.98  136.69    -26.02  -80.0    -21.94  -90.0    ! ! Row 2 - 7.0 GHz
                  -23.01  -130.0   -26.02  -110.0   -3.01  136.69    -20.00  -60.0    ! ! Row 3 - 7.0 GHz
                  -27.96  -190.0   -21.94  -120.0   -20.00  -50.0    -2.51  136.69    ! ! Row 4 - 7.0 GHz
    `
    const touchstone = new Touchstone()
    touchstone.readContent(string, 4)
    expect(touchstone.comments.length).toBe(11)
    expect(touchstone.comments[0]).toBe('4-port S-parameter data')
    expect(touchstone.format).toBe('DB')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toBe(32)
    expect(touchstone.nports).toBe(4)
    expect(touchstone.frequency).toBeTruthy()
    expect(touchstone.frequency!.unit).toBe('GHz')
    expect(touchstone.frequency!.f_scaled).toStrictEqual([5, 6, 7])
    expect(touchstone.matrix).toBeTruthy()
    expect(touchstone.matrix!.length).toBe(4)
    touchstone.matrix!.forEach((array) => {
      expect(array.length).toBe(4)
      array.forEach((a) => {
        expect(a.length).toBe(3)
      })
    })
    // S11
    expect(
      touchstone.matrix![0][0].map((c: Complex) =>
        round(20 * log10(abs(c) as unknown as number), 5)
      )
    ).toStrictEqual([-2.92, -4.44, -6.02])
    expect(
      touchstone.matrix![0][0].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([170, 150.37, 136.69])
    // S12
    expect(
      touchstone.matrix![0][1].map((c) =>
        round(20 * log10(abs(c) as unknown as number), 5)
      )
    ).toStrictEqual([-13.98, -13.98, -12.92])
    expect(
      touchstone.matrix![0][1].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-30, -35, -40])
    // S13
    expect(
      touchstone.matrix![0][2].map((c) =>
        round(20 * log10(abs(c) as unknown as number), 5)
      )
    ).toStrictEqual([-26.02, -24.44, -23.01])
    expect(
      touchstone.matrix![0][2].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-60, -65, -70])
    // S14
    expect(
      touchstone.matrix![0][3].map((c) =>
        round(20 * log10(abs(c) as unknown as number), 5)
      )
    ).toStrictEqual([-33.98, -30.46, -27.96])
    expect(
      touchstone.matrix![0][3].map((c) => round((arg(c) / pi) * 180, 5))
    ).toStrictEqual([-90, -95, -100])
  })
  it('readContent: 2-port S-parameter file, two impedances', () => {
    const string = `
      # Hz S RI R 23 45
      ! Freq       S11_Real    S11_Imag     S21_Real    S21_Imag     S12_Real    S12_Imag     S22_Real    S22_Imag
      ! ---------|------------|------------|------------|------------|------------|------------|------------|------------
      1.000E+06  0.9000      0.0000      0.0100      -0.0200     -0.0200     0.0100      0.9000      0.0000
      2.000E+06  0.8000      0.0000      0.0200      -0.0400     -0.0400     0.0200      0.8000      0.0000
      3.000E+06  0.7000      0.0000      0.0300      -0.0600     -0.0600     0.0300      0.7000      0.0000
      4.000E+06  0.6000      0.0000      0.0400      -0.0800     -0.0800     0.0400      0.6000      0.0000
      5.000E+06  0.5000      0.0000      0.0500      -0.1000     -0.1000     0.0500      0.5000      0.0000
    `
    const touchstone = new Touchstone()
    touchstone.readContent(string, 2)
    expect(touchstone.comments.length).toBe(2)
    expect(touchstone.format).toBe('RI')
    expect(touchstone.parameter).toBe('S')
    expect(touchstone.impedance).toStrictEqual([23, 45])
    expect(touchstone.nports).toBe(2)
    expect(touchstone.frequency).toBeTruthy()
    expect(touchstone.frequency!.unit).toBe('Hz')
    expect(touchstone.frequency!.f_scaled).toStrictEqual([
      1e6, 2e6, 3e6, 4e6, 5e6,
    ])
    expect(touchstone.matrix).toBeTruthy()
    expect(touchstone.matrix!.length).toBe(2)
    touchstone.matrix!.forEach((array) => {
      expect(array.length).toBe(2)
      array.forEach((a) => {
        expect(a.length).toBe(5)
      })
    })
    // S11
    expect(touchstone.matrix![0][0].map((c) => round(c.re, 5))).toStrictEqual([
      0.9, 0.8, 0.7, 0.6, 0.5,
    ])
    expect(touchstone.matrix![0][0].map((c) => round(c.im, 5))).toStrictEqual([
      0, 0, 0, 0, 0,
    ])
    // S12
    expect(touchstone.matrix![0][1].map((c) => round(c.re, 5))).toStrictEqual([
      -0.02, -0.04, -0.06, -0.08, -0.1,
    ])
    expect(touchstone.matrix![0][1].map((c) => round(c.im, 5))).toStrictEqual([
      0.01, 0.02, 0.03, 0.04, 0.05,
    ])
    // S21
    expect(touchstone.matrix![1][0].map((c) => round(c.re, 5))).toStrictEqual([
      0.01, 0.02, 0.03, 0.04, 0.05,
    ])
    expect(touchstone.matrix![1][0].map((c) => round(c.im, 5))).toStrictEqual([
      -0.02, -0.04, -0.06, -0.08, -0.1,
    ])
    // S22
    expect(touchstone.matrix![1][1].map((c) => round(c.re, 5))).toStrictEqual([
      0.9, 0.8, 0.7, 0.6, 0.5,
    ])
    expect(touchstone.matrix![1][1].map((c) => round(c.im, 5))).toStrictEqual([
      0, 0, 0, 0, 0,
    ])
  })
  it('readContent: 2-port S-parameter file, 3 impedances', () => {
    const string = `
      # Hz S RI R 23 45 67
      ! Freq       S11_Real    S11_Imag     S21_Real    S21_Imag     S12_Real    S12_Imag     S22_Real    S22_Imag
      ! ---------|------------|------------|------------|------------|------------|------------|------------|------------
      1.000E+06  0.9000      0.0000      0.0100      -0.0200     -0.0200     0.0100      0.9000      0.0000
      2.000E+06  0.8000      0.0000      0.0200      -0.0400     -0.0400     0.0200      0.8000      0.0000
      3.000E+06  0.7000      0.0000      0.0300      -0.0600     -0.0600     0.0300      0.7000      0.0000
      4.000E+06  0.6000      0.0000      0.0400      -0.0800     -0.0800     0.0400      0.6000      0.0000
      5.000E+06  0.5000      0.0000      0.0500      -0.1000     -0.1000     0.0500      0.5000      0.0000
    `
    const touchstone = new Touchstone()
    expect(() => touchstone.readContent(string, 2)).toThrow(
      '2-ports network, but find 3 impedances: [23,45,67]'
    )
  })
  it('writeContent: 2-port S-parameter file, RI format', () => {
    const touchstone = new Touchstone()
    expect(touchstone.writeContent).toBeTruthy()
    expect(() => touchstone.writeContent()).toThrow(
      'Number of ports (nports) is not defined'
    )
    touchstone.nports = 2
    expect(() => touchstone.writeContent()).toThrow(
      'Frequency object is not defined'
    )
    touchstone.frequency = new Frequency()
    expect(touchstone.frequency.unit).toBe('Hz')
    expect(() => touchstone.writeContent()).toThrow(
      'Frequency points array is empty'
    )
    touchstone.frequency.f_scaled = [1e6, 2e6, 3e6, 4e6, 5e6]
    expect(() => touchstone.writeContent()).toThrow(
      'Network parameter type is not defined'
    )
    touchstone.parameter = 'S'
    expect(() => touchstone.writeContent()).toThrow(
      'Data format (RI/MA/DB) is not defined'
    )
    Object.defineProperty(touchstone, '_format', {
      value: 'a' as never,
      writable: true,
    })
    expect(() => touchstone.writeContent()).toThrow(
      'Network parameter matrix is not defined'
    )
    touchstone.matrix = []
    expect(() => touchstone.writeContent()).toThrow(
      'Touchstone matrix has 0 rows, but expected 2'
    )
    touchstone.matrix = [[], []]
    expect(() => touchstone.writeContent()).toThrow(
      `Touchstone matrix at row index 0 has 0 columns, but expected 2`
    )
    touchstone.matrix = [
      [[], []],
      [[], []],
    ]
    expect(() => touchstone.writeContent()).toThrow(
      `Touchstone matrix at row 0, column 0 has 0 points, but expected 5`
    )
    touchstone.matrix = [
      [
        [
          complex(0.9, 0),
          complex(0.8, 0),
          complex(0.7, 0),
          complex(0.6, 0),
          complex(0.5, 0),
        ],
        [
          complex(-0.02, 0.01),
          complex(-0.04, 0.02),
          complex(-0.06, 0.03),
          complex(-0.08, 0.04),
          complex(-0.1, 0.05),
        ],
      ],
      [
        [
          complex(0.01, -0.02),
          complex(0.02, -0.04),
          complex(0.03, -0.06),
          complex(0.04, -0.08),
          complex(0.05, -0.1),
        ],
        [
          complex(0.9, 0),
          complex(0.8, 0),
          complex(0.7, 0),
          complex(0.6, 0),
          complex(0.5, 0),
        ],
      ],
    ]
    expect(() => touchstone.writeContent()).toThrow(
      'Unknown Touchstone format: a'
    )
    touchstone.format = 'RI'
    // Default impedance, no comments
    expect(touchstone.writeContent()).toBe(`# Hz S RI R 50
1000000 0.9 0 0.01 -0.02 -0.02 0.01 0.9 0
2000000 0.8 0 0.02 -0.04 -0.04 0.02 0.8 0
3000000 0.7 0 0.03 -0.06 -0.06 0.03 0.7 0
4000000 0.6 0 0.04 -0.08 -0.08 0.04 0.6 0
5000000 0.5 0 0.05 -0.1 -0.1 0.05 0.5 0
`)
    // Default impedance, with comments
    touchstone.comments = [
      '2-port S-parameter touchstone',
      'Generated by RF-Touchstone',
    ]
    expect(touchstone.writeContent()).toBe(`! 2-port S-parameter touchstone
! Generated by RF-Touchstone
# Hz S RI R 50
1000000 0.9 0 0.01 -0.02 -0.02 0.01 0.9 0
2000000 0.8 0 0.02 -0.04 -0.04 0.02 0.8 0
3000000 0.7 0 0.03 -0.06 -0.06 0.03 0.7 0
4000000 0.6 0 0.04 -0.08 -0.08 0.04 0.6 0
5000000 0.5 0 0.05 -0.1 -0.1 0.05 0.5 0
`)

    // Two impedances, with comments
    touchstone.impedance = [23, 45]
    expect(touchstone.writeContent()).toBe(`! 2-port S-parameter touchstone
! Generated by RF-Touchstone
# Hz S RI R 23 45
1000000 0.9 0 0.01 -0.02 -0.02 0.01 0.9 0
2000000 0.8 0 0.02 -0.04 -0.04 0.02 0.8 0
3000000 0.7 0 0.03 -0.06 -0.06 0.03 0.7 0
4000000 0.6 0 0.04 -0.08 -0.08 0.04 0.6 0
5000000 0.5 0 0.05 -0.1 -0.1 0.05 0.5 0
`)

    // One impedance, with comments
    touchstone.impedance = 46
    expect(touchstone.writeContent()).toBe(`! 2-port S-parameter touchstone
! Generated by RF-Touchstone
# Hz S RI R 46
1000000 0.9 0 0.01 -0.02 -0.02 0.01 0.9 0
2000000 0.8 0 0.02 -0.04 -0.04 0.02 0.8 0
3000000 0.7 0 0.03 -0.06 -0.06 0.03 0.7 0
4000000 0.6 0 0.04 -0.08 -0.08 0.04 0.6 0
5000000 0.5 0 0.05 -0.1 -0.1 0.05 0.5 0
`)
  })
  it('writeContent: 1-port Z-parameter, MA format', () => {
    const touchstone = new Touchstone()
    touchstone.nports = 1
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'MHz'
    touchstone.frequency.f_scaled = [100, 200, 300]
    touchstone.parameter = 'Z'
    touchstone.format = 'MA'
    touchstone.matrix = [
      [
        [
          complex({ r: 0.99, phi: (-4 / 180) * pi }),
          complex({ r: 0.8, phi: (-22 / 180) * pi }),
          complex({ r: 0.707, phi: (-45 / 180) * pi }),
        ],
      ],
    ]
    expect(touchstone.writeContent()).toBe(`# MHz Z MA R 50
100 0.99 -4
200 0.8 -22
300 0.707 -45
`)
  })
  it('writeContent: 3-port Y-paramter, DB format', () => {
    const touchstone = new Touchstone()
    touchstone.nports = 3
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'MHz'
    touchstone.frequency.f_scaled = [100, 200, 300]
    touchstone.parameter = 'Y'
    touchstone.format = 'DB'
    touchstone.impedance = [20, 35, 60]
    // 创建一个 3x3x3 的矩阵
    touchstone.matrix = [
      [
        [
          complex({ r: pow(10, 0.8 / 20) as number, phi: (-20 / 180) * pi }),
          complex({ r: pow(10, 0.75 / 20) as number, phi: (-40 / 180) * pi }),
          complex({ r: pow(10, 0.7 / 20) as number, phi: (-60 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.05 / 20) as number, phi: (30 / 180) * pi }),
          complex({ r: pow(10, 0.1 / 20) as number, phi: (45 / 180) * pi }),
          complex({ r: pow(10, 0.15 / 20) as number, phi: (60 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.03 / 20) as number, phi: (-45 / 180) * pi }),
          complex({ r: pow(10, 0.06 / 20) as number, phi: (-60 / 180) * pi }),
          complex({ r: pow(10, 0.09 / 20) as number, phi: (-75 / 180) * pi }),
        ],
      ],
      [
        [
          complex({ r: pow(10, 0.05 / 20) as number, phi: (-30 / 180) * pi }),
          complex({ r: pow(10, 0.1 / 20) as number, phi: (-45 / 180) * pi }),
          complex({ r: pow(10, 0.15 / 20) as number, phi: (-60 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.75 / 20) as number, phi: (-10 / 180) * pi }),
          complex({ r: pow(10, 0.7 / 20) as number, phi: (-20 / 180) * pi }),
          complex({ r: pow(10, 0.65 / 20) as number, phi: (-30 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.02 / 20) as number, phi: (15 / 180) * pi }),
          complex({ r: pow(10, 0.04 / 20) as number, phi: (25 / 180) * pi }),
          complex({ r: pow(10, 0.06 / 20) as number, phi: (35 / 180) * pi }),
        ],
      ],
      [
        [
          complex({ r: pow(10, 0.02 / 20) as number, phi: (45 / 180) * pi }),
          complex({ r: pow(10, 0.04 / 20) as number, phi: (60 / 180) * pi }),
          complex({ r: pow(10, 0.06 / 20) as number, phi: (-75 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.03 / 20) as number, phi: (-10 / 180) * pi }),
          complex({ r: pow(10, 0.06 / 20) as number, phi: (-20 / 180) * pi }),
          complex({ r: pow(10, 0.09 / 20) as number, phi: (-30 / 180) * pi }),
        ],
        [
          complex({ r: pow(10, 0.7 / 20) as number, phi: (-5 / 180) * pi }),
          complex({ r: pow(10, 0.65 / 20) as number, phi: (-10 / 180) * pi }),
          complex({ r: pow(10, 0.6 / 20) as number, phi: (-15 / 180) * pi }),
        ],
      ],
    ]
    // 添加一些注释
    touchstone.comments = [
      '3-port Y-parameter data',
      'Generated by RF-Touchstone',
      'Format: DB angle',
    ]
    const expected = `! 3-port Y-parameter data
! Generated by RF-Touchstone
! Format: DB angle
# MHz Y DB R 20 35 60
100 0.8 -20 0.05 30 0.03 -45 0.05 -30 0.75 -10 0.02 15 0.02 45 0.03 -10 0.7 -5
200 0.75 -40 0.1 45 0.06 -60 0.1 -45 0.7 -20 0.04 25 0.04 60 0.06 -20 0.65 -10
300 0.7 -60 0.15 60 0.09 -75 0.15 -60 0.65 -30 0.06 35 0.06 -75 0.09 -30 0.6 -15
`
    expect(touchstone.writeContent()).toBe(expected)
  })

  describe('Static Methods', () => {
    it('getFilename', () => {
      expect(Touchstone.getFilename('sample.s2p')).toBe('sample.s2p')
      expect(Touchstone.getFilename('/path/to/sample.s2p')).toBe('sample.s2p')
      expect(Touchstone.getFilename('C:\\path\\to\\sample.s2p')).toBe(
        'sample.s2p'
      )
      expect(Touchstone.getFilename('https://example.com/data/test.s3p')).toBe(
        'test.s3p'
      )
      expect(
        Touchstone.getFilename('https://example.com/test.s4p?query=1')
      ).toBe('test.s4p')
      expect(Touchstone.getFilename('https://example.com/test?query=1')).toBe(
        'test'
      )
    })

    it('getFilename error', () => {
      expect(() => Touchstone.getFilename('')).toThrow(
        'Could not determine filename from: '
      )
      expect(() => Touchstone.getFilename('/path/to/sample.s2p/')).toThrow(
        'Could not determine filename from: /path/to/sample.s2p/'
      )
    })

    it('parsePorts', () => {
      expect(Touchstone.parsePorts('test.s1p')).toBe(1)
      expect(Touchstone.parsePorts('test.s2p')).toBe(2)
      expect(Touchstone.parsePorts('test.s10p')).toBe(10)
      expect(Touchstone.parsePorts('test.snp')).toBe(null)
      expect(Touchstone.parsePorts('test.txt')).toBe(null)
      expect(Touchstone.parsePorts('test')).toBe(null)
    })

    it('getBasename', () => {
      // Test removing .snp extensions from simple filenames
      expect(Touchstone.getBasename('network.s2p')).toBe('network')
      expect(Touchstone.getBasename('mydata.s4p')).toBe('mydata')
      expect(Touchstone.getBasename('TEST.S1P')).toBe('TEST')
      expect(Touchstone.getBasename('file.S10P')).toBe('file')
      expect(Touchstone.getBasename('my-network-v2.s3p')).toBe('my-network-v2')

      // Test with full paths (Unix-style)
      expect(Touchstone.getBasename('/path/to/sample.s2p')).toBe('sample')
      expect(Touchstone.getBasename('/usr/local/data.s4p')).toBe('data')

      // Test with full paths (Windows-style)
      expect(Touchstone.getBasename('C:\\path\\to\\sample.s2p')).toBe('sample')
      expect(Touchstone.getBasename('D:\\Data\\network.s3p')).toBe('network')

      // Test with URLs
      expect(Touchstone.getBasename('https://example.com/file.s1p')).toBe(
        'file'
      )
      expect(Touchstone.getBasename('http://test.com/data/test.s2p')).toBe(
        'test'
      )

      // Test with non-.snp files (should remove any extension)
      expect(Touchstone.getBasename('data.txt')).toBe('data')
      expect(Touchstone.getBasename('document.pdf')).toBe('document')
      expect(Touchstone.getBasename('/path/to/file.txt')).toBe('file')
      expect(Touchstone.getBasename('archive.tar.gz')).toBe('archive.tar')

      // Files without extension remain unchanged
      expect(Touchstone.getBasename('noextension')).toBe('noextension')
      expect(Touchstone.getBasename('/path/to/noext')).toBe('noext')

      // Hidden files (starting with dot)
      expect(Touchstone.getBasename('.gitignore')).toBe('.gitignore')
    })

    it('fromText', () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const ts = Touchstone.fromText(content, 1)
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.format).toBe('MA')
      expect(ts.parameter).toBe('S')
      expect(ts.impedance).toBe(50)
      expect(ts.nports).toBe(1)
      expect(ts.frequency?.unit).toBe('MHz')
      expect(ts.frequency?.f_scaled).toStrictEqual([100])
      expect(ts.matrix![0][0]).toStrictEqual([
        complex({ r: 0.9, phi: (-10 / 180) * pi }),
      ])
      // Name should be undefined when not provided
      expect(ts.name).toBeUndefined()
    })

    it('fromText with name', () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const ts = Touchstone.fromText(content, 1, 'my_measurement')
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.name).toBe('my_measurement')
    })

    it('fromUrl', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(content),
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      const ts = await Touchstone.fromUrl('https://example.com/sample.s1p')
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.format).toBe('MA')
      expect(ts.parameter).toBe('S')
      expect(ts.impedance).toBe(50)
      expect(ts.nports).toBe(1)
      expect(ts.frequency?.unit).toBe('MHz')
      expect(ts.frequency?.f_scaled).toStrictEqual([100])
      expect(ts.matrix![0][0]).toStrictEqual([
        complex({ r: 0.9, phi: (-10 / 180) * pi }),
      ])
      // Name should be extracted from URL (without extension)
      expect(ts.name).toBe('sample')

      vi.unstubAllGlobals()
    })

    it('fromUrl with wrong nports', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(content),
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      await expect(
        Touchstone.fromUrl('https://example.com/sample.s1p', 2)
      ).rejects.toThrow(
        'Touchstone invalid data number: 3, which should be multiple of 9'
      )

      vi.unstubAllGlobals()
    })

    it('fromUrl with explicit nports', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(content),
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      // URL doesn't have port info, but we provide it explicitly
      const ts = await Touchstone.fromUrl('https://example.com/data.txt', 1)
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.format).toBe('MA')
      expect(ts.parameter).toBe('S')
      expect(ts.impedance).toBe(50)
      expect(ts.nports).toBe(1)
      expect(ts.frequency?.unit).toBe('MHz')
      expect(ts.frequency?.f_scaled).toStrictEqual([100])
      expect(ts.matrix![0][0]).toStrictEqual([
        complex({ r: 0.9, phi: (-10 / 180) * pi }),
      ])
      // Name should be 'data' (basename removes .txt extension too)
      expect(ts.name).toBe('data')

      vi.unstubAllGlobals()
    })

    it('fromUrl error: 404', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      await expect(
        Touchstone.fromUrl('https://example.com/404.s1p')
      ).rejects.toThrow('Failed to fetch file: Not Found')

      vi.unstubAllGlobals()
    })

    it('fromUrl error: invalid ports', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve('# MHz S MA R 50\n100 0.9 -10'),
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      await expect(
        Touchstone.fromUrl('https://example.com/test.txt')
      ).rejects.toThrow('Could not determine number of ports from URL')

      vi.unstubAllGlobals()
    })

    it('fromFile', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const file = new File([content], 'sample.s1p', { type: 'text/plain' })

      const ts = await Touchstone.fromFile(file)
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.format).toBe('MA')
      expect(ts.parameter).toBe('S')
      expect(ts.impedance).toBe(50)
      expect(ts.nports).toBe(1)
      expect(ts.frequency?.unit).toBe('MHz')
      expect(ts.frequency?.f_scaled).toStrictEqual([100])
      expect(ts.matrix![0][0]).toStrictEqual([
        complex({ r: 0.9, phi: (-10 / 180) * pi }),
      ])
      // Name should be extracted from File object (without extension)
      expect(ts.name).toBe('sample')
    })

    it('fromFile with explicit nports', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      // Filename doesn't have port info, but we provide it explicitly
      const file = new File([content], 'data.txt', { type: 'text/plain' })

      const ts = await Touchstone.fromFile(file, 1)
      expect(ts).toBeInstanceOf(Touchstone)
      expect(ts.format).toBe('MA')
      expect(ts.parameter).toBe('S')
      expect(ts.impedance).toBe(50)
      expect(ts.nports).toBe(1)
      expect(ts.frequency?.unit).toBe('MHz')
      expect(ts.frequency?.f_scaled).toStrictEqual([100])
      expect(ts.matrix![0][0]).toStrictEqual([
        complex({ r: 0.9, phi: (-10 / 180) * pi }),
      ])
      // Name should be 'data' (basename removes .txt extension)
      expect(ts.name).toBe('data')
    })

    it('fromFile error: empty content', async () => {
      const file = new File([''], 'sample.s1p', { type: 'text/plain' })
      await expect(Touchstone.fromFile(file)).rejects.toThrow(
        'File content is empty'
      )
    })

    it('fromFile error: invalid ports', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      await expect(Touchstone.fromFile(file)).rejects.toThrow(
        'Could not determine number of ports from file name'
      )
    })

    it('fromFile error: read failure', async () => {
      const file = new File([''], 'sample.s1p', { type: 'text/plain' })

      // Mock FileReader class to trigger onerror
      class MockFileReader {
        onerror?: () => void
        readAsText(_: File) {
          if (this.onerror) {
            this.onerror()
          }
        }
      }
      vi.stubGlobal('FileReader', MockFileReader)

      await expect(Touchstone.fromFile(file)).rejects.toThrow(
        'Failed to read file: sample.s1p'
      )

      vi.unstubAllGlobals()
    })

    it('fromFile with wrong nports', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      // Filename doesn't have port info, but we provide it explicitly
      const file = new File([content], 'data.s1p', { type: 'text/plain' })

      await expect(Touchstone.fromFile(file, 2)).rejects.toThrow(
        'Touchstone invalid data number: 3, which should be multiple of 9'
      )
    })
  })

  describe('Name Property', () => {
    it('should be undefined by default', () => {
      const ts = new Touchstone()
      expect(ts.name).toBeUndefined()
    })

    it('should allow direct assignment', () => {
      const ts = new Touchstone()
      ts.name = 'my_network'
      expect(ts.name).toBe('my_network')
    })

    it('should allow modification', () => {
      const ts = new Touchstone()
      ts.name = 'initial_name'
      expect(ts.name).toBe('initial_name')
      ts.name = 'modified_name'
      expect(ts.name).toBe('modified_name')
    })

    it('should allow setting to undefined', () => {
      const ts = new Touchstone()
      ts.name = 'some_name'
      ts.name = undefined
      expect(ts.name).toBeUndefined()
    })

    it('fromText: should preserve name through readContent', () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const ts = Touchstone.fromText(content, 1, 'preserved_name')
      expect(ts.name).toBe('preserved_name')
      expect(ts.format).toBe('MA')
    })

    it('fromUrl: should extract name from different URL formats', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(content),
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

      // Test various URL formats
      const testCases = [
        {
          url: 'https://example.com/network.s2p',
          expected: 'network',
        },
        {
          url: 'http://example.com/path/to/data.s4p',
          expected: 'data',
        },
        {
          url: 'https://example.com/MyFile.S3P',
          expected: 'MyFile',
        },
        {
          url: 'https://example.com/test.s10p?query=123',
          expected: 'test',
        },
      ]

      for (const { url, expected } of testCases) {
        const ts = await Touchstone.fromUrl(url, 1)
        expect(ts.name).toBe(expected)
      }

      vi.unstubAllGlobals()
    })

    it('fromFile: should extract name from different file formats', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'

      const testCases = [
        { filename: 'network.s2p', expected: 'network' },
        { filename: 'data.s4p', expected: 'data' },
        { filename: 'MyFile.S3P', expected: 'MyFile' },
        { filename: 'test.s10p', expected: 'test' },
        { filename: 'data.txt', expected: 'data' }, // Any extension is removed
      ]

      for (const { filename, expected } of testCases) {
        const file = new File([content], filename, { type: 'text/plain' })
        const ts = await Touchstone.fromFile(file, 1)
        expect(ts.name).toBe(expected)
      }
    })

    it('should handle complex filenames', async () => {
      const content = '# MHz S MA R 50\n100 0.9 -10'

      const testCases = [
        { filename: 'my-network-v2.s2p', expected: 'my-network-v2' },
        { filename: 'test_data_2024.s4p', expected: 'test_data_2024' },
        { filename: 'network (copy).s1p', expected: 'network (copy)' },
        { filename: '123_456.s3p', expected: '123_456' },
      ]

      for (const { filename, expected } of testCases) {
        const file = new File([content], filename, { type: 'text/plain' })
        const ts = await Touchstone.fromFile(file, 1)
        expect(ts.name).toBe(expected)
      }
    })
  })
})

/**
 * Generate random touchstone matrix, and test by python skrf
 * Test suite for validating Touchstone format compatibility with scikit-rf
 * Tests all combinations of:
 * - Network formats (RI/MA/DB)
 * - Number of ports (1,2,3,15)
 */
describe('writeContent and readContent, then compare with python skrf', () => {
  for (const format of TouchstoneFormats) {
    for (const nports of [1, 2, 3, 15]) {
      it(`writeContent: ${nports} ports, ${format} format, s-parameter`, async () => {
        // Initialize a new Touchstone instance with test configuration
        const touchstone = new Touchstone()
        touchstone.format = format as TouchstoneFormat
        touchstone.parameter = 'S' // S-parameters
        touchstone.impedance = round(random(1, 50), 3) // Random impedance between 1-50Ω
        touchstone.nports = nports // 3-port network
        touchstone.frequency = new Frequency()
        touchstone.frequency.unit = 'GHz' // Frequency unit
        touchstone.frequency.f_scaled = [1, 3, 5] // Test frequencies: 1, 3, 5 GHz
        touchstone.matrix = createRandomTouchstoneMatrix(touchstone)
        // Generate Touchstone format string
        const content = touchstone.writeContent()

        // Parse with Python
        const result = await pythonReadContent(
          content,
          touchstone.nports,
          touchstone.parameter
        )
        const python = JSON.parse(result)
        // Validate basic network properties
        expect(python.frequency.unit).toBe(touchstone.frequency.unit)
        expect(python.frequency.f_scaled.length).toBe(
          touchstone.frequency!.f_scaled.length
        )
        python.frequency.f_scaled.forEach((f: number, i: number) => {
          expect(f).toBeCloseTo(touchstone.frequency!.f_scaled[i], 5)
        })
        expect(python.impedance).toBe(touchstone.impedance)
        // Validate matrix structure and values
        expect(python.matrix.length).toBe(touchstone.nports)
        for (let m = 0; m < touchstone.nports; m++) {
          // Verify port dimensions
          expect(python.matrix[m].length).toBe(touchstone.nports)
          for (let n = 0; n < touchstone.nports!; n++) {
            // Verify frequency points dimension
            const points = touchstone.frequency!.f_scaled.length
            expect(python.matrix[m][n].length).toBe(points)
            for (let p = 0; p < points; p++) {
              // Compare complex values with 5 decimal places tolerance
              const expected = touchstone.matrix![m][n][p]
              const actual = python.matrix[m][n][p]
              expect(actual.re).toBeCloseTo(expected.re, 5)
              expect(actual.im).toBeCloseTo(expected.im, 5)
            }
          }
        }

        // Parse with Touchstone.ts
        const ts = new Touchstone()
        ts.readContent(content, touchstone.nports)
        expect(ts.format).toBe(touchstone.format)
        expect(ts.parameter).toBe(touchstone.parameter)
        expect(ts.impedance).toBe(touchstone.impedance)
        expect(ts.nports).toBe(touchstone.nports)
        expect(ts.frequency!.unit).toBe(touchstone.frequency.unit)
        expect(ts.frequency!.f_scaled.length).toBe(
          touchstone.frequency!.f_scaled.length
        )
        ts.frequency!.f_scaled.forEach((f, i) => {
          expect(f).toBeCloseTo(touchstone.frequency!.f_scaled[i], 5)
        })
        // Validate matrix structure and values
        expect(ts.matrix!.length).toBe(touchstone.nports)
        for (let m = 0; m < touchstone.nports; m++) {
          // Verify port dimensions
          expect(ts.matrix![m].length).toBe(touchstone.nports)
          for (let n = 0; n < touchstone.nports!; n++) {
            // Verify frequency points dimension
            const points = touchstone.frequency!.f_scaled.length
            expect(ts.matrix![m][n].length).toBe(points)
            for (let p = 0; p < points; p++) {
              // Compare complex values with 5 decimal places tolerance
              const expected = touchstone.matrix![m][n][p]
              const actual = ts.matrix![m][n][p]
              expect(actual.re).toBeCloseTo(expected.re, 5)
              expect(actual.im).toBeCloseTo(expected.im, 5)
            }
          }
        }
      })
    }
  }
})

/**
 * Generate random touchstone matrix, and test by python skrf
 * Test suite for validating Touchstone format compatibility with scikit-rf
 * Tests all combinations of:
 * - Network formats (RI/MA/DB)
 * - Number of ports (1,2,3,15)
 */
describe('Generate touchstone content by python skrf then compare with readContent', () => {
  for (const format of TouchstoneFormats) {
    for (const nports of [1, 2, 3, 15]) {
      it(`readContent: ${nports} ports, ${format} format, s-parameter`, async () => {
        // Initialize a new Touchstone instance with test configuration
        const touchstone = new Touchstone()
        touchstone.format = format as TouchstoneFormat
        touchstone.parameter = 'S' // S-parameters
        touchstone.impedance = round(random(1, 50), 3) // Random impedance between 1-50Ω
        touchstone.nports = nports // 3-port network
        touchstone.frequency = new Frequency()
        touchstone.frequency.unit = 'GHz' // Frequency unit
        touchstone.frequency.f_scaled = [1, 3, 5] // Test frequencies: 1, 3, 5 GHz
        touchstone.matrix = createRandomTouchstoneMatrix(touchstone)
        // Generate Touchstone format string
        const content = await pythonWriteContent(touchstone)

        // Parse with Touchstone.ts
        const ts = new Touchstone()
        ts.readContent(content, touchstone.nports)
        expect(ts.format).toBe(touchstone.format)
        expect(ts.parameter).toBe(touchstone.parameter)
        expect(ts.impedance).toBe(touchstone.impedance)
        expect(ts.nports).toBe(touchstone.nports)
        expect(ts.frequency!.unit).toBe(touchstone.frequency.unit)
        expect(ts.frequency!.f_scaled.length).toBe(
          touchstone.frequency!.f_scaled.length
        )
        ts.frequency!.f_scaled.forEach((f, i) => {
          expect(f).toBeCloseTo(touchstone.frequency!.f_scaled[i], 5)
        })
        // Validate matrix structure and values
        expect(ts.matrix!.length).toBe(touchstone.nports)
        for (let m = 0; m < touchstone.nports; m++) {
          // Verify port dimensions
          expect(ts.matrix![m].length).toBe(touchstone.nports)
          for (let n = 0; n < touchstone.nports!; n++) {
            // Verify frequency points dimension
            const points = touchstone.frequency!.f_scaled.length
            expect(ts.matrix![m][n].length).toBe(points)
            for (let p = 0; p < points; p++) {
              // Compare complex values with 5 decimal places tolerance
              const expected = touchstone.matrix![m][n][p]
              const actual = ts.matrix![m][n][p]
              expect(actual.re).toBeCloseTo(expected.re, 5)
              expect(actual.im).toBeCloseTo(expected.im, 5)
            }
          }
        }
      })
    }
  }
})

/**
 * Test suite for validating local Touchstone samples against scikit-rf
 * This test iterates through all .sNp files in the ./samples directory,
 * parses them using RF-Touchstone, and compares the results with scikit-rf.
 */
describe('Compare touchstone files locally and python skrf', () => {
  const samplesDir = path.resolve(__dirname, './samples')
  const files = fs
    .readdirSync(samplesDir)
    .filter((file) => file.match(/\.s\d+p$/i))
    .map((filename) => ({
      name: filename,
      path: path.join(samplesDir, filename),
    }))

  // Add sample from React example
  files.push({
    name: 'sample.s2p',
    path: path.resolve(__dirname, '../examples/react/public/sample.s2p'),
  })

  for (const { name, path: filePath } of files) {
    it(`Touchstone file: ${name}`, async () => {
      // 1. Prepare data
      const buffer = fs.readFileSync(filePath)
      const content = buffer.toString('utf-8')
      const file = new File([buffer], path.basename(filePath))

      // 2. Parse with Touchstone.ts (fromFile)
      const ts = await Touchstone.fromFile(file)
      const nports = ts.nports as number
      expect(nports).not.toBeNull()
      expect(nports).toBeTypeOf('number')
      const parameter = ts.parameter as TouchstoneParameter
      expect(parameter).not.toBeNull()
      expect(TouchstoneParameters).toContain(parameter)

      // 3. Parse with Python scikit-rf
      const result = await pythonReadContent(content, nports, parameter)
      const python = JSON.parse(result)

      // 4. Validate all parameters
      expect(python.frequency.unit).toBe(ts.frequency!.unit)
      expect(python.frequency.f_scaled.length).toBe(
        ts.frequency!.f_scaled.length
      )
      python.frequency.f_scaled.forEach((f: number, i: number) => {
        expect(f).toBeCloseTo(ts.frequency!.f_scaled[i], 5)
      })
      // Compare impedance
      if (Array.isArray(python.impedance)) {
        expect(python.impedance).toStrictEqual(ts.impedance)
      } else {
        expect(python.impedance).toBe(ts.impedance)
      }
      // Validate matrix structure and values
      expect(python.matrix.length).toBe(nports)
      for (let m = 0; m < nports; m++) {
        // Verify port dimensions
        expect(python.matrix[m].length).toBe(nports)
        for (let n = 0; n < nports; n++) {
          // Verify frequency points dimension
          const points = ts.frequency!.f_scaled.length
          expect(python.matrix[m][n].length).toBe(points)
          for (let p = 0; p < points; p++) {
            const expected = ts.matrix![m][n][p]
            const actual = python.matrix[m][n][p]
            expect(actual.re).toBeCloseTo(expected.re, 5)
            expect(actual.im).toBeCloseTo(expected.im, 5)
          }
        }
      }
    })
  }
})
