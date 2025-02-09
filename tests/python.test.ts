import { describe, it, expect } from 'vitest'
import * as python from './python'

describe('python', () => {
  it('Call Python Script and Interact with Variables', async () => {
    const code = `
print("Hello from python!")
    `
    const result = await python.run(code)
    expect(result).toBe('Hello from python!')
  })
})
