import { describe, it, expect } from 'vitest'
import { run } from './python'

describe('python', () => {
  it('Call Python Script and read return', async () => {
    const code = `
print("Hello from python!")
    `
    const result = await run(code)
    expect(result).toBe('Hello from python!')
  })
})
