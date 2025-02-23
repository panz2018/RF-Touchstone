import { describe, it, expect } from 'vitest'
import { dedent, run } from './python'

describe('python', () => {
  it('dedent', () => {
    const code = `
      line1
line2
      line3
    `
    expect(dedent(code)).toBe(`
line1
line2
line3
`)
  })
  it('Call Python Script and read return', async () => {
    const code = `
      print("Hello from python!")
    `
    const result = await run(code)
    expect(result).toBe('Hello from python!')
  })
  it('skrf', async () => {
    const code = `
      import skrf as rf
      print(rf.__version__)
    `
    const result = await run(code)
    const version = result.split('.')
    expect(version.length).toBe(3)
    for (const substring of version) {
      expect(substring.length).toBeGreaterThanOrEqual(1)
    }
  })
  it('numpy', async () => {
    const code = `
      import numpy as np
      print(np.__version__)
    `
    const result = await run(code)
    const version = result.split('.')
    expect(version.length).toBe(3)
    for (const substring of version) {
      expect(substring.length).toBeGreaterThanOrEqual(1)
    }
  })
  it('scipy', async () => {
    const code = `
      import scipy
      print(scipy.__version__)
    `
    const result = await run(code)
    const version = result.split('.')
    expect(version.length).toBe(3)
    for (const substring of version) {
      expect(substring.length).toBeGreaterThanOrEqual(1)
    }
  })
  it('pandas', async () => {
    const code = `
      import pandas as pd
      print(pd.__version__)
    `
    const result = await run(code)
    const version = result.split('.')
    expect(version.length).toBe(3)
    for (const substring of version) {
      expect(substring.length).toBeGreaterThanOrEqual(1)
    }
  })
  it('matplotlib', async () => {
    const code = `
      import matplotlib
      print(matplotlib.__version__)
    `
    const result = await run(code)
    const version = result.split('.')
    expect(version.length).toBe(3)
    for (const substring of version) {
      expect(substring.length).toBeGreaterThanOrEqual(1)
    }
  })
})
