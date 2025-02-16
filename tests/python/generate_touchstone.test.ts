import { describe, it, expect } from 'vitest'
import { generate_touchstone } from './generate_touchstone'

describe('generate_touchstone.ts', () => {
  it('Run python', async () => {
    console.log(
      await generate_touchstone({
        format: 'RI',
        parameter: 'S',
        impedance: 'one',
        nports: 3,
        unit: 'GHz',
      })
    )
  })
})
