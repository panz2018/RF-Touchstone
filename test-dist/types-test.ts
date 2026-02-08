// prettier-ignore
import { Frequency, Touchstone, complex } from '../test-pkg-temp/package/dist/index.mjs'

// Test Touchstone class
const ts = new Touchstone()
const content = '# MHz S MA R 50\n100 0.9 -10'
ts.readContent(content, 1)
if (ts.nports !== 1 || !ts.matrix || ts.matrix[0][0].length !== 1) {
  throw new Error('Touchstone data mismatch')
}
console.log('✅ Touchstone type check passed')

// Test Frequency class
const freq = new Frequency()
freq.unit = 'MHz'
freq.f_scaled = [100, 200]
if (freq.f_scaled[0] !== 100) throw new Error('Frequency mismatch')
console.log('✅ Frequency type check passed')

// Test re-exported complex from mathjs
const c = complex(3, 4)
if (c.re !== 3 || c.im !== 4) throw new Error('Complex mismatch')
console.log('✅ Complex (mathjs) type check passed')

console.log('✅ All types integration checks passed')
