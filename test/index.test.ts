import { describe, it, expect } from 'vitest'
import {
  abs,
  add,
  arg,
  complex,
  log10,
  index,
  multiply,
  pi,
  pow,
  range,
  round,
  subset,
  Frequency,
  Touchstone,
} from '@/index'

describe('index.ts', () => {
  it('should export Math.js functions', () => {
    expect(abs).toBeDefined()
    expect(add).toBeDefined()
    expect(arg).toBeDefined()
    expect(complex).toBeDefined()
    expect(log10).toBeDefined()
    expect(index).toBeDefined()
    expect(multiply).toBeDefined()
    expect(pi).toBeDefined()
    expect(pow).toBeDefined()
    expect(range).toBeDefined()
    expect(round).toBeDefined()
    expect(subset).toBeDefined()
  })

  it('should export Frequency class', () => {
    expect(Frequency).toBeDefined()
    const freq = new Frequency()
    expect(freq).toBeInstanceOf(Frequency)
  })

  it('should export Touchstone class', () => {
    expect(Touchstone).toBeDefined()
    const touchstone = new Touchstone()
    expect(touchstone).toBeInstanceOf(Touchstone)
  })
})
