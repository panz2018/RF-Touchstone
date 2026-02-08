/* global console, __dirname, process */
const { JSDOM } = require('jsdom')
const path = require('path')
const fs = require('fs')

// Forcing the path to the extracted temporary package directory.
const pkgDir = path.resolve(__dirname, '../test-pkg-temp/package')
const umdPath = path.join(pkgDir, 'dist/index.umd.js')

console.log('Testing UMD Global from extracted package in JSDOM...')

const code = fs.readFileSync(umdPath, 'utf8')
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'dangerously',
  resources: 'usable',
})

// Load logic into JSDOM
try {
  dom.window.eval(code)
  const { Touchstone, Frequency, complex } = dom.window.Touchstone

  // 1. Test Touchstone
  const ts = new Touchstone()
  const content = '# MHz S MA R 50\n100 0.9 -10'
  ts.readContent(content, 1)
  if (ts.nports !== 1 || !ts.matrix || ts.matrix[0][0].length !== 1) {
    throw new Error('Touchstone check failed')
  }
  console.log('✅ Touchstone UMD check passed')

  // 2. Test Frequency
  const freq = new Frequency()
  freq.unit = 'MHz'
  freq.f_scaled = [100, 200]
  if (freq.f_scaled[0] !== 100) throw new Error('Frequency UMD check failed')
  console.log('✅ Frequency UMD check passed')

  // 3. Test complex (mathjs re-export)
  const c = complex(3, 4)
  if (c.re !== 3 || c.im !== 4) throw new Error('Complex UMD check failed')
  console.log('✅ Complex (mathjs) UMD check passed')

  console.log('✅ All UMD environment checks passed')
} catch (err) {
  console.error('❌ UMD environment checks failed:', err)
  process.exit(1)
}
