import { describe, it, expect } from 'vitest'
import { complex, random, round } from 'mathjs'
import { Touchstone } from '@/touchstone'
import { Frequency } from '@/frequency'
import { pythonGenerateTouchstoneString } from './generateTouchstoneString'

describe('generate_touchstone.ts', () => {
  it('Run python', async () => {
    // Create a new touchstone instance
    const touchstone = new Touchstone()
    touchstone.format = 'RI'
    touchstone.parameter = 'S'
    touchstone.impedance = round(random(1, 50), 3)
    touchstone.nports = 1
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz'
    touchstone.frequency.value = [1, 3, 5]
    touchstone.matrix = [
      [
        [
          complex(round(random(-1, 1), 3), round(random(-1, 1), 3)),
          complex(round(random(-1, 1), 3), round(random(-1, 1), 3)),
          complex(round(random(-1, 1), 3), round(random(-1, 1), 3)),
        ],
      ],
    ]
    // Generate touchstone string from python
    // console.log(await pythonGenerateTouchstoneString(touchstone))
  })
}, 1e4) // Increase timeout to 10 seconds (1e4 ms)
