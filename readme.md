# RF-Touchstone

A Javascript/TypeScript library for reading, manipulating, and writing Touchstone files (.snp files) used in radio frequency (RF) and microwave engineering.

<a href="https://deepwiki.com/panz2018/RF-Touchstone" target="_blank"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" align="right"></a>

[![Coverage](coverage/coverage-badge.svg)](coverage/coverage-badge.svg)

## Test Status

| **Node.js** |                                                                                                            v20                                                                                                            |                                                                                                            v22                                                                                                            |                                                                                                            v24                                                                                                            |
| :---------- | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| **Linux**   |    [![Linux - Node.js 20](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node20.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node20.yml)    |    [![Linux - Node.js 22](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node22.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node22.yml)    |    [![Linux - Node.js 24](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node24.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-linux-node24.yml)    |
| **Windows** | [![Windows - Node.js 20](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node20.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node20.yml) | [![Windows - Node.js 22](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node22.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node22.yml) | [![Windows - Node.js 24](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node24.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-windows-node24.yml) |
| **macOS**   |    [![macOS - Node.js 20](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node20.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node20.yml)    |    [![macOS - Node.js 22](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node22.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node22.yml)    |    [![macOS - Node.js 24](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node24.yml/badge.svg?branch=main)](https://github.com/panz2018/RF-Touchstone/actions/workflows/test-macos-node24.yml)    |

## Overview

RF-Touchstone provides a complete solution for working with S-parameters and other network parameters in JavaScript/TypeScript environments. This library allows you to:

- Read and parse Touchstone files (.s1p, .s2p, .s3p, etc.)
- Manipulate network parameter data
- Write data back to Touchstone format
- Convert between different parameter representations (RI, MA, DB)

## What is a Touchstone File?

Touchstone files are an industry-standard ASCII text format for representing network parameters of electrical circuits. Each file contains:

- Comments (lines starting with !)
- Option line (starts with #) specifying frequency units, parameter type, and data format
- Network parameter data organized by frequency points

RF-Touchstone currently supports versions 1.0 and 1.1 of the Touchstone specification.

## Key Features

- Full support for Touchstone file format (v1.0 and v1.1)
- Parameter type support: S, Y, Z, G, H
- Format conversions: RI (Real/Imaginary), MA (Magnitude/Angle), DB (Decibel/Angle)
- TypeScript implementation with strong typing
- Comprehensive test suite
- Published on NPM: [rf-touchstone](https://www.npmjs.com/package/rf-touchstone)

## Installation

### Via NPM/Yarn

```bash
npm install rf-touchstone
# or
yarn add rf-touchstone
```

### Via CDN (Browser)

```html
<!-- Using unpkg -->
<script src="https://unpkg.com/rf-touchstone"></script>

<!-- Or using jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/rf-touchstone"></script>

<script>
  // Access via global variable
  const { Touchstone } = window.Touchstone
</script>
```

## Quick Start

```typescript
import { Touchstone } from 'rf-touchstone'

// Read from a URL (nports automatically determined from .s2p)
const touchstone = await Touchstone.fromUrl('https://example.com/device.s2p')
console.log(touchstone.name) // 'device' - automatically extracted from filename

// Or from a File object (e.g., from a file input)
const touchstoneFromFile = await Touchstone.fromFile(file)
console.log(touchstoneFromFile.name) // Filename without extension

// Or from a raw text string with optional name
const touchstoneFromText = Touchstone.fromText(fileContent, 2, 'my_measurement')

// Access data
console.log(touchstone.frequency.f_scaled)
console.log(touchstone.matrix)

// The name property is useful for plot legends and default filenames
touchstone.name = 'modified_network' // Can be modified

// Write back to Touchstone format
const newContent = touchstone.writeContent()
```

## Online Demo

Experience the library in action with our [Touchstone Converter (React)](https://panz2018.github.io/RF-Touchstone/examples/react/index.html). It allows you to:

- Load local or remote `.snp` files
- Inspect metadata and network data
- Convert formats and units on the fly
- Download modified Touchstone files

## Examples

This repository includes examples to demonstrate the usage of `rf-touchstone` in different contexts.

- **[React Example](https://github.com/panz2018/RF-Touchstone/tree/main/examples/react)**: A complete web application (using Vite and TypeScript) that showcases how to build a Touchstone file viewer/converter. You can try the **[Live Demo](https://panz2018.github.io/RF-Touchstone/examples/react/index.html)**.

## Documentation

For detailed documentation, please visit:

- [Project Website](https://panz2018.github.io/RF-Touchstone/)
- [AI Usage Guide](https://github.com/panz2018/RF-Touchstone/blob/main/.github/AI_USAGE_GUIDE.md) - Comprehensive guide for AI coding assistants and developers integrating this library
- [DeepWiki Documentation](https://deepwiki.com/panz2018/RF-Touchstone) - Interactive AI documentation that allows you to converse and ask questions about this repository
- [Changelog](https://github.com/panz2018/RF-Touchstone/releases)

## Development

For information on setting up a development environment and contributing to the project, see [development.md](development.md).

## Credits and Acknowledgments

This project uses test data files (e.g., `.sNp` files) sourced from or generated by [scikit-rf](https://github.com/scikit-rf/scikit-rf).

- **scikit-rf License**: The test files are used under the terms of the [BSD 3-Clause License](https://github.com/scikit-rf/scikit-rf/blob/master/LICENSE.txt).
- The original copyright and "Created with skrf (http://scikit-rf.org)" headers in these files have been preserved as required by the license.

We thank the `scikit-rf` contributors for their excellent work in providing these resources to the RF community. Additionally, we use `scikit-rf` as a reference to validate our library's parsing and manipulation results, ensuring cross-platform consistency and accuracy.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
