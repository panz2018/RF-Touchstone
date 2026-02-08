/* eslint-disable no-undef */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Forcing the path to the extracted temporary package directory.
const pkgDir = path.resolve(__dirname, '../test-pkg-temp/package')

const pkgJson = JSON.parse(
  fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
)
const entry = path.join(
  pkgDir,
  pkgJson.module || pkgJson.exports['.'].import.default
)

console.log('Testing ESM import from extracted package...')

import(pathToFileURL(entry).href)
  .then(({ Touchstone, Frequency, complex }) => {
    // 1. Test Touchstone
    const ts = new Touchstone()
    const content = '# MHz S MA R 50\n100 0.9 -10'
    ts.readContent(content, 1)
    if (ts.nports !== 1 || !ts.matrix || ts.matrix[0][0].length !== 1) {
      throw new Error('Touchstone check failed')
    }
    console.log('✅ Touchstone check passed')

    // 2. Test Frequency
    const freq = new Frequency()
    freq.unit = 'MHz'
    freq.f_scaled = [100, 200]
    if (freq.f_scaled[0] !== 100) throw new Error('Frequency check failed')
    console.log('✅ Frequency check passed')

    // 3. Test complex (mathjs re-export)
    const c = complex(3, 4)
    if (c.re !== 3 || c.im !== 4) throw new Error('Complex check failed')
    console.log('✅ Complex (mathjs) check passed')

    console.log('✅ All ESM environment checks passed')
  })
  .catch((err) => {
    console.error('❌ ESM environment checks failed:', err)
    process.exit(1)
  })
