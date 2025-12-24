import { describe, it, expect, vi, afterEach } from 'vitest'
import { dedent, run } from './python'

describe('pythonBin Branch Coverage', () => {
  const originalPlatform = process.platform

  afterEach(() => {
    // Restore the original platform and clear module cache
    Object.defineProperty(process, 'platform', { value: originalPlatform })
    vi.resetModules()
  })

  it('should use Scripts/python on Windows', async () => {
    // Simulate Windows environment
    Object.defineProperty(process, 'platform', { value: 'win32' })

    // Re-import the module to re-evaluate the top-level constant
    const { pythonBin } = await import('./python')
    expect(pythonBin).toBe('Scripts/python')
  })

  it('should use bin/python on non-Windows platforms', async () => {
    // Simulate Linux environment
    Object.defineProperty(process, 'platform', { value: 'linux' })

    const { pythonBin } = await import('./python')
    expect(pythonBin).toBe('bin/python')
  })
})

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
    expect(dedent(``)).toBe('')
    expect(dedent(`\n`)).toBe('\n')
    // should trigger continue when indentMatch is null
    const matchSpy = vi
      .spyOn(String.prototype, 'match')
      .mockReturnValue(null as RegExpMatchArray | null)
    const result = dedent('some text')
    expect(matchSpy).toHaveBeenCalled()
    matchSpy.mockRestore()
    expect(result).toBe('some text')
  })
  it('Call Python Script and read return', async () => {
    // Success case
    const code = `
      print("Hello from python!")
    `
    const result = await run(code)
    expect(result).toBe('Hello from python!')

    // Failed case
    const failedCode = `
      print("Hello from python!")
      raise ValueError("Test ValueError")
    `
    await expect(run(failedCode)).rejects.toThrow('Test ValueError')
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
})
