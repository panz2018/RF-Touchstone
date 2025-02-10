import type { SParameterFormat } from './touchstone'
export type Input = number
export const PI = 3.14159

let format: SParameterFormat

export const sum = (numbers: Input[]) => {
  format = 'MA'
  console.log(format)
  return numbers.reduce((sum, num) => sum + num, 0)
}

// export const test = (x: number, y: number) => {
//   return x + y;
// };
