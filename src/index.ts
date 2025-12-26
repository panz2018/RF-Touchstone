import {
  abs,
  add,
  arg,
  complex as _complex,
  log10,
  index,
  multiply,
  pi,
  pow,
  range as _range,
  round,
  subset,
} from 'mathjs'

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

export { abs, add, arg, log10, index, multiply, pi, pow, round, subset }

export * from './frequency'
export * from './touchstone'
