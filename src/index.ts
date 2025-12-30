import { complex as _complex, range as _range } from 'mathjs'

/**
 * Creates a complex value or converts a value to a complex value.
 *
 * @see {@link https://mathjs.org/docs/reference/functions/complex.html | Math.js documentation for complex}
 */
export const complex = _complex

/**
 * Create an array or matrix with a range of numbers.
 *
 * @see {@link https://mathjs.org/docs/reference/functions/range.html | Math.js documentation for range}
 */
export const range = _range

export {
  abs,
  add,
  arg,
  log10,
  index,
  multiply,
  pi,
  pow,
  round,
  subset,
} from 'mathjs'
export type { Complex } from 'mathjs'

export * from './frequency'
export * from './touchstone'
