import { describe, it, expect } from 'vitest'
import { random, round } from 'mathjs'
import { Touchstone } from '@/touchstone'
import { Frequency } from '@/frequency'
import {
  createRandomTouchstoneMatrix,
  pythonGenerateTouchstoneString,
} from './generateTouchstoneString'

describe('generate_touchstone.ts', () => {
  it('createRandomTouchstoneMatrix', () => {
    // Create a new touchstone instance
    const touchstone = new Touchstone()
    touchstone.format = 'RI'
    touchstone.parameter = 'S'
    touchstone.impedance = round(random(1, 50), 3)
    touchstone.nports = 2
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz'
    touchstone.frequency.value = [1, 3, 5]
    // Create the matrix
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)
    expect(touchstone.matrix.length).toBe(2)
    for (let outPort = 0; outPort < touchstone.nports; outPort++) {
      expect(touchstone.matrix[outPort].length).toBe(2)
      for (let inPort = 0; inPort < touchstone.nports; inPort++) {
        expect(touchstone.matrix[outPort][inPort].length).toBe(3)
        for (let p = 0; p < touchstone.frequency.value.length; p++) {
          expect(touchstone.matrix[outPort][inPort][p].constructor.name).toBe(
            'Complex'
          )
        }
      }
    }
  })
  it('Run python', async () => {
    // Create a new touchstone instance
    const touchstone = new Touchstone()
    touchstone.format = 'RI'
    touchstone.parameter = 'Y'
    touchstone.impedance = round(random(1, 50), 2)
    touchstone.nports = 2
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'MHz'
    touchstone.frequency.value = [1, 3]
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)

    // Generate touchstone string from python
    console.log(await pythonGenerateTouchstoneString(touchstone))
  })
})
