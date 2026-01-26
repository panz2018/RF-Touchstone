# RF-Touchstone AI Usage Guide

> **For AI Coding Assistants**: This guide helps you understand how to integrate and use the `rf-touchstone` library in user projects.

## Quick Start

### Installation

**Via NPM/Yarn:**

```bash
npm install rf-touchstone
# or
yarn add rf-touchstone
```

**Via CDN:**

```html
<script src="https://unpkg.com/rf-touchstone"></script>
<script>
  const { Touchstone, abs, arg, pi } = window.Touchstone
</script>
```

### Basic Import Pattern

```typescript
import { Touchstone } from 'rf-touchstone'
// Optional math helpers from mathjs
import { abs, arg, pi, complex } from 'rf-touchstone'
```

## Touchstone Class

The `Touchstone` class is the primary interface for working with .snp files.

### Creating Touchstone Objects

**From URL (Browser or Node.js with fetch):**

```typescript
// Auto-detect nports from filename (.s2p → 2-port)
const ts = await Touchstone.fromUrl('https://example.com/device.s2p')

// Explicit nports if filename doesn't indicate
const ts = await Touchstone.fromUrl('https://example.com/data.txt', 2)
```

**From File Object (Browser file input):**

```typescript
// In any framework with file input
const handleFileUpload = async (file: File) => {
  const touchstone = await Touchstone.fromFile(file)
  // Use touchstone object
}
```

**From Text Content (Universal - works in any environment):**

```typescript
import { Touchstone } from 'rf-touchstone'

// Example S2P file content (could come from any source: upload, API, database, etc.)
const s2pContent = `! 2-port S-parameter data
# GHz S MA R 50
1.0 0.50 -45 0.95 10 0.05 85 0.60 -30
2.0 0.45 -60 0.90 15 0.10 80 0.55 -45
3.0 0.40 -75 0.85 20 0.15 75 0.50 -60`

// Parse the text content
const touchstone = Touchstone.fromText(s2pContent, 2) // 2 = 2-port network

// Now you can use the parsed data
console.log(touchstone.frequency.f_scaled) // [1.0, 2.0, 3.0]
console.log(touchstone.format) // 'MA'
console.log(touchstone.parameter) // 'S'
```

### Accessing Touchstone Data

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Frequency data
const frequencies = ts.frequency.f_scaled // Array of numbers in specified unit
const unit = ts.frequency.unit // 'Hz' | 'kHz' | 'MHz' | 'GHz'

// Options line data
const format = ts.format // 'RI' | 'MA' | 'DB'
const parameter = ts.parameter // 'S' | 'Y' | 'Z' | 'G' | 'H'
const impedance = ts.impedance // typically 50
const nports = ts.nports // Number of ports (1, 2, 3, 4, etc.)

// Network parameter matrix
// IMPORTANT: matrix is 3D array [outPort][inPort][frequencyIndex]
const matrix = ts.matrix // Complex number matrix
```

### Understanding Matrix Indexing ⚠️ CRITICAL

**Matrix Structure:**

```typescript
// matrix[i][j][k]
// - i: Output port index (0 to nports-1) - where the signal exits
// - j: Input port index (0 to nports-1) - where the signal enters
// - k: Frequency point index (0 to numFrequencies-1)
//
// Sij = matrix[i-1][j-1][k] means: signal enters at port j, exits at port i
```

**Accessing S-parameters (consistent for ALL port counts):**

```typescript
// For 2-port network:
const s11 = ts.matrix[0][0][freqIdx] // S11
const s12 = ts.matrix[0][1][freqIdx] // S12
const s21 = ts.matrix[1][0][freqIdx] // S21
const s22 = ts.matrix[1][1][freqIdx] // S22

// For 4-port network (same pattern):
const s11 = ts.matrix[0][0][freqIdx] // S11
const s21 = ts.matrix[1][0][freqIdx] // S21
const s31 = ts.matrix[2][0][freqIdx] // S31
const s41 = ts.matrix[3][0][freqIdx] // S41
const s12 = ts.matrix[0][1][freqIdx] // S12
// ... and so on

// General pattern: Sij = ts.matrix[i-1][j-1][freqIdx]
```

### Format Conversion

To convert between formats (RI, MA, DB):

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Method 1: Change format and regenerate content
ts.format = 'DB' // Change to Decibel/Angle
const dbContent = ts.writeContent() // Generate new file content
// Now you can save dbContent or parse it as a new Touchstone object

// Method 2: Create new instance with different format
const dbTs = Touchstone.fromText(dbContent, ts.nports)
```

### Writing Touchstone Content

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Generate Touchstone file content in current format
const content = ts.writeContent()

// In Browser - Download as file
const blob = new Blob([content], { type: 'text/plain' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'modified-device.s2p'
a.click()

// In Node.js - Save to file
import fs from 'fs/promises'
await fs.writeFile('modified-device.s2p', content)
```

### Working with Complex Numbers

The library uses mathjs Complex type `{ re: number, im: number }`:

```typescript
import { abs, arg, pi } from 'rf-touchstone'

// Get S11 at first frequency for 2-port
const s11 = ts.matrix[0][0][0] // Complex { re: ..., im: ... }

// Calculate magnitude
const magnitude = abs(s11) // |S11|

// Calculate phase (in radians)
const phase = arg(s11) // ∠S11

// Convert to dB
const magnitudeDB = 20 * Math.log10(magnitude)

// Convert phase to degrees
const phaseDegrees = (phase * 180) / pi
```

## Frequency Class

The `Frequency` class provides powerful utilities for unit conversion and wavelength calculations. While it's typically accessed through `touchstone.frequency`, you can also work with it directly.

### Accessing Frequency Data

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Access frequency points in the file's original unit
const frequencies = ts.frequency.f_scaled // e.g., [1.0, 2.0, 3.0]
const unit = ts.frequency.unit // e.g., 'GHz'

// Get frequency points in different units
const freqsInHz = ts.frequency.f_Hz // [1e9, 2e9, 3e9]
const freqsInMHz = ts.frequency.f_MHz // [1000, 2000, 3000]
const freqsInGHz = ts.frequency.f_GHz // [1.0, 2.0, 3.0]
```

### Converting Frequency Units

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Get current unit
console.log(ts.frequency.unit) // 'GHz'
console.log(ts.frequency.f_scaled) // [1.0, 2.0, 3.0]

// Change unit - automatically rescales f_scaled
ts.frequency.unit = 'MHz'
console.log(ts.frequency.f_scaled) // [1000, 2000, 3000]

// Access in any unit without changing internal representation
const inHz = ts.frequency.f_Hz // [1e9, 2e9, 3e9]
const inTHz = ts.frequency.f_THz // [0.001, 0.002, 0.003]
```

> [!IMPORTANT]
> **THz Support**: While THz can be accessed programmatically via `f_THz` getter/setter, it is **not** an official unit in Touchstone v1.x/v2.x file formats. Do not set `frequency.unit = 'THz'` as it will throw an error. THz is only available through the `f_THz` property for conversion purposes.

### Working with Wavelength

The `Frequency` class can convert between frequency and wavelength using the relationship $\lambda = c/f$ where $c$ is the speed of light (299,792,458 m/s).

```typescript
const ts = await Touchstone.fromUrl('device.s2p')

// Get wavelengths in different units
const wavelengthsInM = ts.frequency.wavelength_m // meters
const wavelengthsInCm = ts.frequency.wavelength_cm // centimeters
const wavelengthsInMm = ts.frequency.wavelength_mm // millimeters
const wavelengthsInUm = ts.frequency.wavelength_um // micrometers
const wavelengthsInNm = ts.frequency.wavelength_nm // nanometers

// Example: 1 GHz → λ ≈ 0.3 m = 30 cm = 300 mm
```

### Setting Frequency from Wavelength

You can also set frequency points by specifying wavelengths. This is bidirectional - setting wavelength updates the underlying frequency data:

```typescript
import { Frequency } from 'rf-touchstone'

const freq = new Frequency()
freq.unit = 'GHz'

// Set frequencies using wavelength in millimeters
// For λ = 300 mm → f ≈ 1 GHz
// For λ = 150 mm → f ≈ 2 GHz
freq.wavelength_mm = [300, 150, 100]

console.log(freq.f_GHz) // [~1.0, ~2.0, ~3.0]
console.log(freq.f_scaled) // [~1.0, ~2.0, ~3.0]
```

### Practical Example: Frequency Range Analysis

```typescript
async function analyzeFrequencyRange(file: File) {
  const ts = await Touchstone.fromFile(file)

  const freqs = ts.frequency.f_GHz
  const wavelengths = ts.frequency.wavelength_mm

  return {
    numPoints: freqs.length,
    range: {
      frequency: {
        min: freqs[0],
        max: freqs[freqs.length - 1],
        unit: 'GHz',
      },
      wavelength: {
        min: wavelengths[wavelengths.length - 1], // shortest
        max: wavelengths[0], // longest
        unit: 'mm',
      },
    },
    // Calculate frequency spacing
    spacing:
      freqs.length > 1
        ? ((freqs[freqs.length - 1] - freqs[0]) / (freqs.length - 1)).toFixed(3)
        : 'N/A',
  }
}
```

## Common Use Cases

### Example 1: File Upload in Browser (Vanilla JavaScript)

```typescript
import { Touchstone, abs, arg, pi } from 'rf-touchstone'

// HTML: <input type="file" id="fileInput" accept=".s*p">
const fileInput = document.getElementById('fileInput') as HTMLInputElement

fileInput.addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files?![0]
  if (!file) return

  try {
    const ts = await Touchstone.fromFile(file)

    console.log(`${ts.nports}-Port Network`)
    console.log(`Frequencies: ${ts.frequency.f_scaled.length}`)
    console.log(`Unit: ${ts.frequency.unit}`)
    console.log(`Format: ${ts.format}`)

    // Access S11 at first frequency (works for any port count)
    const s11 = ts.matrix[0][0][0]
    console.log(`S11 Magnitude: ${abs(s11)}`)
    console.log(`S11 Phase (deg): ${(arg(s11) * 180 / pi).toFixed(2)}`)

  } catch (error) {
    console.error('Error loading Touchstone file:', error)
  }
})
```

### Example 2: Format Converter (Node.js)

```typescript
import { Touchstone } from 'rf-touchstone'
import fs from 'fs/promises'

async function convertTouchstone(
  inputPath: string,
  outputPath: string,
  targetFormat: 'RI' | 'MA' | 'DB'
) {
  // Read input file
  const content = await fs.readFile(inputPath, 'utf-8')

  // Determine nports from filename
  const nports = Touchstone.parsePorts(inputPath)
  if (nports === null) {
    throw new Error(
      `Cannot determine number of ports from filename: ${inputPath}`
    )
  }

  // Parse the file
  const ts = Touchstone.fromText(content, nports)

  console.log(`Original format: ${ts.format}`)

  // Convert format
  ts.format = targetFormat
  const convertedContent = ts.writeContent()

  // Write output
  await fs.writeFile(outputPath, convertedContent)

  console.log(`Converted to ${targetFormat}`)
}

// Usage
await convertTouchstone('input.s2p', 'output.s2p', 'DB')
```

### Example 3: S-Parameter Plotting (Any Framework)

```typescript
import { Touchstone, abs } from 'rf-touchstone'

async function getPlotData(url: string) {
  const ts = await Touchstone.fromUrl(url)

  const numFreqs = ts.frequency.f_scaled.length
  const frequencies = ts.frequency.f_scaled

  // Extract S21 magnitude in dB for all frequencies (2-port network)
  const s21_dB: number[] = []
  for (let freqIdx = 0; freqIdx < numFreqs; freqIdx++) {
    const s21 = ts.matrix[1][0][freqIdx] // S21 for 2-port
    const magnitude = abs(s21)
    s21_dB.push(20 * Math.log10(magnitude))
  }

  return {
    frequencies,
    s21_dB,
    unit: ts.frequency.unit,
  }
}

// Use with any chart library (Chart.js, D3, Plotly, etc.)
const data = await getPlotData('https://example.com/device.s2p')
console.log(data)
// { frequencies: [...], s21_dB: [...], unit: 'GHZ' }
```

### Example 4: Data Analysis

```typescript
import { Touchstone, abs } from 'rf-touchstone'

async function analyzeTouchstone(file: File) {
  const ts = await Touchstone.fromFile(file)

  if (ts.nports !== 2) {
    throw new Error('This example is for 2-port networks only')
  }

  const numFreqs = ts.frequency.f_scaled.length

  // Calculate insertion loss (S21)
  let maxS21 = 0
  for (let i = 0; i < numFreqs; i++) {
    const mag = abs(ts.matrix[1][0][i]) // S21
    if (mag > maxS21) maxS21 = mag
  }
  const insertionLoss_dB = -20 * Math.log10(maxS21)

  // Calculate return loss (S11)
  let maxS11 = 0
  for (let i = 0; i < numFreqs; i++) {
    const mag = abs(ts.matrix[0][0][i]) // S11
    if (mag > maxS11) maxS11 = mag
  }
  const returnLoss_dB = -20 * Math.log10(maxS11)

  return {
    nports: ts.nports,
    numFrequencies: numFreqs,
    frequencyRange: {
      min: ts.frequency.f_scaled[0],
      max: ts.frequency.f_scaled[numFreqs - 1],
      unit: ts.frequency.unit,
    },
    insertionLoss_dB: insertionLoss_dB.toFixed(2),
    returnLoss_dB: returnLoss_dB.toFixed(2),
    format: ts.format,
  }
}
```

### Example 5: Vue Component

```vue
<template>
  <div>
    <input type="file" @change="handleFileUpload" accept=".s*p" />
    <div v-if="touchstone">
      <h2>{{ touchstone.nports }}-Port Network</h2>
      <p>Frequencies: {{ touchstone.frequency.f_scaled.length }}</p>
      <p>Unit: {{ touchstone.frequency.unit }}</p>
      <p>Format: {{ touchstone.format }}</p>
      <button @click="convertToDb">Convert to dB</button>
      <button @click="downloadFile">Download</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Touchstone } from 'rf-touchstone'

const touchstone = ref<Touchstone | null>(null)

async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    touchstone.value = await Touchstone.fromFile(file)
  }
}

function convertToDb() {
  if (touchstone.value) {
    touchstone.value.format = 'DB'
    // Re-parse to get converted matrix
    const content = touchstone.value.writeContent()
    touchstone.value = Touchstone.fromText(content, touchstone.value.nports!)
  }
}

function downloadFile() {
  if (touchstone.value) {
    const content = touchstone.value.writeContent()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.s${touchstone.value.nports}p`
    a.click()
  }
}
</script>
```

## TypeScript Types

### Key Interfaces and Types

```typescript
// Touchstone class
class Touchstone {
  // Properties
  nports?: number
  frequency?: Frequency
  format?: 'RI' | 'MA' | 'DB'
  parameter?: 'S' | 'Y' | 'Z' | 'G' | 'H'
  impedance: number | number[] // default: 50
  matrix?: Complex[][][] // [outPort][inPort][freqIdx]
  comments: string[]

  // Static methods
  static fromText(content: string, nports: number): Touchstone
  static fromUrl(url: string, nports?: number): Promise<Touchstone>
  static fromFile(file: File, nports?: number): Promise<Touchstone>
  static getFilename(pathOrUrl: string): string
  static parsePorts(filename: string): number | null

  // Instance methods
  readContent(content: string, nports: number): void
  writeContent(): string
  validate(): void
}

// Complex number (from mathjs)
interface Complex {
  re: number // Real part
  im: number // Imaginary part
}

// Frequency class
class Frequency {
  unit: 'Hz' | 'kHz' | 'MHz' | 'GHz'
  f_scaled: number[] // Frequency values in current unit

  // Getters/setters for different units
  f_Hz: number[]
  f_kHz: number[]
  f_MHz: number[]
  f_GHz: number[]
  f_THz: number[]

  // Wavelength getters/setters
  wavelength_m: number[]
  wavelength_cm: number[]
  wavelength_mm: number[]
  wavelength_um: number[]
  wavelength_nm: number[]
}

// Helper Functions (from mathjs)
// These can be imported: import { abs, arg, pi } from 'rf-touchstone'
function abs(x: Complex | number): number
function arg(x: Complex): number // Returns phase in radians
function complex(re: number, im: number): Complex
function complex(obj: { r: number; phi: number }): Complex // Polar form
const pi: number

// Other available helpers:
// add, multiply, pow, log10, round, range, index, subset
```

## Important Notes

### Module Formats Support

This library supports **multiple module formats** for maximum compatibility:

- **UMD (Universal Module Definition)**: `dist/Touchstone.umd.js` - For direct browser `<script>` tags
- **ESM (ES Modules)**: `dist/Touchstone.es.js` - For modern bundlers and `import` statements
- **CJS (CommonJS)**: `dist/Touchstone.cjs.js` - For older Node.js projects using `require()`

**Using in Browser (UMD):**

Via CDN:

```html
<!-- Using unpkg -->
<script src="https://unpkg.com/rf-touchstone"></script>

<!-- Or using jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/rf-touchstone"></script>

<script>
  const { Touchstone, abs, arg } = window.Touchstone
</script>
```

**Using in Modern Projects (ESM):**

```typescript
import { Touchstone } from 'rf-touchstone'
```

**Using in Legacy Node.js (CommonJS):**

```javascript
const { Touchstone } = require('rf-touchstone')
```

### Browser vs Node.js

- `Touchstone.fromUrl()` works in both environments (uses `fetch`)
- `Touchstone.fromFile()` is browser-only (uses `File` API)
- For Node.js file reading, use `fs` and `Touchstone.fromText()`

### Port Indexing

**Matrix indexing is consistent for ALL port counts:**

```typescript
// General pattern: Sij = matrix[i-1][j-1][freqIdx]

// For any N-port network:
const s11 = matrix[0][0][freqIdx] // S11
const s21 = matrix[1][0][freqIdx] // S21
const s12 = matrix[0][1][freqIdx] // S12
const s22 = matrix[1][1][freqIdx] // S22
// etc.
```

### Memory Considerations

Large .snp files (many ports/frequencies) create large matrices:

- Processing in chunks
- Not storing multiple copies simultaneously

## Error Handling

```typescript
try {
  const ts = await Touchstone.fromUrl('device.s2p')
} catch (error) {
  if (error instanceof Error) {
    // Common errors:
    // - Network errors (URL fetch failed)
    // - Parse errors (invalid Touchstone format)
    // - File not found
    // - Could not determine nports
    console.error('Failed to load Touchstone:', error.message)
  }
}
```

## Resources

- **API Documentation**: https://panz2018.github.io/RF-Touchstone/api/modules
- **GitHub**: https://github.com/panz2018/RF-Touchstone
- **NPM**: https://www.npmjs.com/package/rf-touchstone

## Common Patterns Summary

```typescript
// ✅ DO: Load from URL
const ts = await Touchstone.fromUrl('file.s2p')

// ✅ DO: Access matrix correctly (same for all port counts)
const s21 = ts.matrix[1][0][freqIdx] // S21

// ✅ DO: Convert format properly
ts.format = 'DB'
const dbContent = ts.writeContent()

// ✅ DO: Iterate frequencies correctly
for (let freqIdx = 0; freqIdx < ts.frequency.f_scaled.length; freqIdx++) {
  const s11 = ts.matrix[0][0][freqIdx]
  // process s11...
}

// ❌ DON'T: Use non-existent convertFormat method
// const tsDB = ts.convertFormat('DB')  // This doesn't exist!

// ❌ DON'T: Use wrong matrix indexing
// const s11 = ts.matrix[freqIdx][0][0]  // WRONG!
```

---

**Last Updated**: 2026-01-25
**Library Version**: 0.0.5+
