import { describe, it, expect } from 'vitest'
import { Touchstone } from '@/touchstone'

describe('touchstone.ts', () => {
  const touchstone = new Touchstone()

  it('should initialize with default values', () => {
    // 检查默认值是否正确
    expect(touchstone.comments).toBe('') // 默认为空字符串 <button class="citation-flag" data-index="1">
    expect(touchstone.format).toBeUndefined() // 格式未定义
    expect(touchstone.parameter).toBeUndefined() // 参数类型未定义
    expect(touchstone.resistance).toBeUndefined() // 参考阻抗未定义
  })
})
