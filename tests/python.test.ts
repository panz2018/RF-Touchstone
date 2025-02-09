import { describe, it, expect } from 'vitest'
import { callPython } from './python'

describe('python', () => {
  it('Call Python Script and Interact with Variables', async () => {
    const inputData = { name: 'Alice' }
    const result = await callPython(inputData)

    // 验证 Python 返回的结果
    expect(result.message).toBe('Hello, Alice!')
  })
})
