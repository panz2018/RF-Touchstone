export type Input = number
export const PI = 3.14159

export const sum = (numbers: Input[]) => {
  return numbers.reduce((sum, num) => sum + num, 0)
}

// export const test = (x: number, y: number) => {
//   return x + y;
// };
