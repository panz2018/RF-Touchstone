import { run } from './python'
import { random } from 'mathjs'
import { TouchstoneFormat, TouchstoneParameter } from '@/touchstone'
import { FrequencyUnit } from '@/frequency'

export const generate_touchstone = async ({
  format,
  parameter,
  impedance,
  nports,
  unit,
}: {
  format: TouchstoneFormat
  parameter: TouchstoneParameter
  impedance: undefined | 'one' | 'multiple'
  nports: number
  unit: FrequencyUnit
}) => {
  console.log(format, parameter, impedance, nports, unit)

  console.log(random(5))

  const code = `
print("Hello from python!")
  `
  return await run(code)
}
