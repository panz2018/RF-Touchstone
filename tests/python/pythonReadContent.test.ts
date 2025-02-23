import { describe, it, expect } from 'vitest'
import { random, round } from 'mathjs'
import { Touchstone } from '@/touchstone'
import { Frequency } from '@/frequency'
import { createRandomTouchstoneMatrix } from './randomTouchstoneMatrix'
import { pythonReadContent } from './pythonReadContent'

describe('pythonReadContent.ts', () => {
  it('Compare with Python scikit-rf', async () => {
    // 创建一个带随机数据的 Touchstone 实例
    const touchstone = new Touchstone()
    touchstone.format = 'RI'
    touchstone.parameter = 'S'
    touchstone.impedance = round(random(1, 50), 3)
    touchstone.nports = 2
    touchstone.frequency = new Frequency()
    touchstone.frequency.unit = 'GHz'
    touchstone.frequency.value = [1, 3, 5]
    touchstone.matrix = createRandomTouchstoneMatrix(touchstone)

    // 使用 writeContent 生成 Touchstone 格式字符串
    const content = touchstone.writeContent()

    // 使用 Python scikit-rf 读取并解析该字符串
    const result = await pythonReadContent(
      content,
      touchstone.nports,
      touchstone.parameter
    )
    const data = JSON.parse(result)
    console.log(content)
    // console.log(result)
    console.log(JSON.stringify(data, null, 2))

    // 验证解析结果
    // expect(data.frequency.unit).toBe(touchstone.frequency.unit)
    // expect(data.frequency.points).toEqual(touchstone.frequency.value)
    // expect(data.parameter).toBe(touchstone.parameter)
    // expect(data.format).toBe(touchstone.format)
    // expect(data.impedance).toBe(touchstone.impedance)

    // 验证矩阵数据
    // expect(data.matrix.length).toBe(touchstone.frequency.value.length)
    // for (let p = 0; p < data.matrix.length; p++) {
    //   expect(data.matrix[p].length).toBe(touchstone.nports)
    //   for (let i = 0; i < touchstone.nports; i++) {
    //     expect(data.matrix[p][i].length).toBe(touchstone.nports)
    //     for (let j = 0; j < touchstone.nports; j++) {
    //       // 比较实部和虚部，考虑到浮点数精度，使用接近而不是完全相等
    //       const expected = touchstone.matrix[i][j][p]
    //       const actual = data.matrix[p][i][j]
    //       expect(actual.real).toBeCloseTo(expected.re, 5)
    //       expect(actual.imag).toBeCloseTo(expected.im, 5)
    //     }
    //   }
    // }
  })
})
