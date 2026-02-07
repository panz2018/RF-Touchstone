import {
  abs,
  add,
  arg,
  complex,
  Complex,
  index,
  log10,
  multiply,
  pi,
  pow,
  range,
  round,
  subset,
} from 'mathjs'
import type { FrequencyUnit } from './frequency'
import { Frequency } from './frequency'

/**
 * Supported Touchstone data formats.
 * - RI: Real and Imaginary, i.e., $A + j \cdot B$
 * - MA: Magnitude and Angle (degrees), i.e., $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
 * - DB: Decibel (20*log10) and Angle (degrees), i.e., $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
 */
export const TouchstoneFormats = ['RI', 'MA', 'DB'] as const

/**
 * Type representing the Touchstone data format.
 * - RI: Real and Imaginary, i.e., $A + j \cdot B$
 * - MA: Magnitude and Angle (degrees), i.e., $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
 * - DB: Decibel (20*log10) and Angle (degrees), i.e., $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
 */
export type TouchstoneFormat = (typeof TouchstoneFormats)[number]

/**
 * Supported network parameter types in Touchstone files.
 * - S: Scattering parameters
 * - Y: Admittance parameters
 * - Z: Impedance parameters
 * - H: Hybrid-h parameters
 * - G: Hybrid-g parameters
 */
export const TouchstoneParameters = ['S', 'Y', 'Z', 'G', 'H']

/**
 * Type representing the network parameter type.
 * - S: Scattering
 * - Y: Admittance
 * - Z: Impedance
 * - H: Hybrid-h
 * - G: Hybrid-g
 */
export type TouchstoneParameter = (typeof TouchstoneParameters)[number]

/**
 * The reference resistance(s) for the network parameters.
 * The token "R" (case-insensitive) followed by one or more reference resistance values.
 * Default: 50Ω
 *
 * For Touchstone 1.0, this is a single value for all ports.
 * For Touchstone 1.1, this can be an array of values (one per port)
 */
export type TouchstoneImpedance = number | number[]

/**
 * Network parameter matrix stored as complex numbers.
 *
 * @remarks
 * The matrix is a 3D array with the following dimensions:
 * - First dimension [i]: Output port index (0 to nports-1) - where the signal exits
 * - Second dimension [j]: Input port index (0 to nports-1) - where the signal enters
 * - Third dimension [k]: Frequency point index
 *
 * For example:
 * - `matrix[i][j][k]` represents the parameter from port j+1 to port i+1 at frequency k
 * - For S-parameters: `matrix[1][0][5]` is S₂₁ at the 6th frequency point
 *   (signal enters at port 1, exits at port 2)
 *
 * @example
 * ```typescript
 * // Access S21 (port 1 → port 2) at first frequency
 * const s21 = touchstone.matrix[1][0][0]
 *
 * // Access S11 (port 1 → port 1, reflection) at first frequency
 * const s11 = touchstone.matrix[0][0][0]
 * ```
 */
export type TouchstoneMatrix = Complex[][][]

/**
 * Represents a Touchstone file parser and generator.
 * Supports reading, manipulating, and writing Touchstone (.snp) files
 * following version 1.0 and 1.1 specifications.
 *
 * @remarks
 * #### Overview
 *
 * The **Touchstone file format** (typically with `.snp` extensions) is an industry-standard ASCII format
 * for representing n-port network parameters. It is widely used in Electronic Design Automation (EDA)
 * and by measurement equipment (like VNAs) to describe the performance of RF and microwave components.
 *
 * ##### Key Features:
 * - **File Extensions**: `.s1p`, `.s2p`, ... `.sNp` indicate a network with N ports.
 * - **Case Insensitivity**: Keywords and identifiers are case-insensitive.
 * - **Versions**: Full support for version 1.0 and 1.1. Version 2.0 is not currently supported.
 *
 * ---
 *
 * #### Touchstone File Structure
 *
 * A file consists of a header (comments and option line) followed by network data.
 *
 * ##### 1. Header Section
 *
 * - **Comment Lines**: Lines starting with `!` are stored in the `comments` array.
 * - **Option Line**: The line starting with `#` sets the global context.
 *   Example: `# GHz S MA R 50`
 *   - `GHz`: Frequency unit (`Hz`, `kHz`, `MHz`, or `GHz`).
 *   - `S`: Parameter type (`S`, `Y`, `Z`, `H`, or `G`).
 *   - `MA`: Data format (`MA` for magnitude-angle, `DB` for decibel-angle, or `RI` for real-imaginary).
 *     - RI: $A + j \cdot B$
 *     - MA: $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
 *     - DB: $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
 *   - `R 50`: Reference resistance in ohms (default is 50 ohms if omitted).
 *
 * ##### 2. Network Data Section
 *
 * Data is listed frequency by frequency. For a 2-port network, the format is:
 * `<frequency> <N11> <N21> <N12> <N22>` (where each NXx is a pair of values based on the format).
 *
 * ---
 *
 * #### References:
 * - {@link https://github.com/scikit-rf/scikit-rf scikit-rf: Open Source RF Engineering}
 * - {@link https://github.com/Nubis-Communications/SignalIntegrity SignalIntegrity: Signal and Power Integrity Tools}
 * - {@link https://books.google.com/books/about/S_Parameters_for_Signal_Integrity.html?id=_dLKDwAAQBAJ S-Parameters for Signal Integrity}
 * - {@link https://ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf Touchstone(R) File Format Specification (Version 2.1)}
 *
 * @example
 * #### Parsing a local file string
 * ```typescript
 * import { Touchstone } from 'rf-touchstone';
 *
 * const content = `
 * ! Simple 1-port S-parameter data
 * # MHz S RI R 50
 * 100 0.9 -0.1
 * 200 0.8 -0.2
 * `;
 * const ts = Touchstone.fromText(content, 1);
 * console.log(ts.parameter); // 'S'
 * console.log(ts.frequency.unit); // 'MHz'
 * ```
 */
export class Touchstone {
  /**
   * Utility to extract a filename from a URL or a file path string.
   *
   * @param pathOrUrl - The URL or string representation of a path.
   * @returns The filename part of the string.
   * @throws Error if the filename cannot be determined.
   */
  public static getFilename(pathOrUrl: string): string {
    let filename: string | undefined
    try {
      // Attempt to parse as a URL
      const url = new URL(pathOrUrl)
      filename = url.pathname.split(/[/\\]/).pop()
    } catch {
      // Fallback to simple string path logic
      filename = pathOrUrl.split(/[/\\]/).pop()
    }

    if (!filename) {
      throw new Error(`Could not determine filename from: ${pathOrUrl}`)
    }
    return filename
  }

  /**
   * Extracts the basename from a filename or path by removing the file extension.
   *
   * @remarks
   * This method intelligently handles both simple filenames and full paths.
   * If a path separator is detected (/ or \), it first extracts the filename,
   * then removes any file extension.
   *
   * @param filenameOrPath - The filename or full path to process.
   * @returns The basename without extension.
   *
   * @example
   * ```typescript
   * // Works with simple filenames
   * Touchstone.getBasename('myfile.s2p') // 'myfile'
   * Touchstone.getBasename('data.txt') // 'data'
   * Touchstone.getBasename('document.pdf') // 'document'
   *
   * // Also works with full paths
   * Touchstone.getBasename('/path/to/network.s2p') // 'network'
   * Touchstone.getBasename('C:\\data\\test.s3p') // 'test'
   * Touchstone.getBasename('https://example.com/file.txt') // 'file'
   *
   * // Files without extension remain unchanged
   * Touchstone.getBasename('noextension') // 'noextension'
   * ```
   */
  public static getBasename(filenameOrPath: string): string {
    // If the input contains path separators, extract filename first
    let filename = filenameOrPath
    if (filenameOrPath.includes('/') || filenameOrPath.includes('\\')) {
      filename = this.getFilename(filenameOrPath)
    }
    // Remove any file extension (everything after the last dot)
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      // No extension or hidden file (starts with dot)
      return filename
    }
    return filename.substring(0, lastDotIndex)
  }

  /**
   * Determines the number of ports based on the file extension (e.g., .s2p -> 2).
   *
   * @param filename - The filename or URL to inspect.
   * @returns The number of ports, or null if it cannot be determined.
   */
  public static parsePorts(filename: string): number | null {
    const match = filename.match(/\.s(\d+)p$/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    return null
  }

  /**
   * Creates a Touchstone instance from a raw text string.
   *
   * @param content - The raw text content of the Touchstone file
   * @param nports - The number of ports
   * @param name - Optional name for this Touchstone object (used for plotting legends and default save filename)
   * @returns A new Touchstone instance
   */
  public static fromText(
    content: string,
    nports: number,
    name?: string
  ): Touchstone {
    const ts = new Touchstone()
    ts.readContent(content, nports)
    ts.name = name
    return ts
  }

  /**
   * Async helper to fetch, parse, and return a Touchstone instance from a URL.
   *
   * @param url - The URL of the Touchstone file.
   * @param nports - The expected number of ports. If null, it attempts to parse from the URL.
   * @returns A promise resolving to a Touchstone instance.
   * @throws Error if the fetch fails, or the number of ports cannot be determined.
   */
  public static async fromUrl(
    url: string,
    nports?: number | null
  ): Promise<Touchstone> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }
    const textContent = await response.text()

    // Extract filename once for efficiency
    const filename = this.getFilename(url)

    let determinedNports: number | null = nports ?? null
    if (determinedNports === null) {
      determinedNports = this.parsePorts(filename)
    }

    if (determinedNports === null) {
      throw new Error(
        `Could not determine number of ports from URL: ${url}. Please provide nports manually.`
      )
    }

    // Pass filename to getBasename to avoid re-extracting it
    const name = this.getBasename(filename)
    return this.fromText(textContent, determinedNports, name)
  }

  /**
   * Reads a File object (typical in browser environments), parses it, and returns a Touchstone instance.
   *
   * @param file - The HTML5 File object to read.
   * @param nports - The expected number of ports. If null, it attempts to parse from the filename.
   * @returns A promise resolving to a Touchstone instance.
   * @throws Error if reading fails or the number of ports cannot be determined.
   */
  public static fromFile(
    file: File,
    nports?: number | null
  ): Promise<Touchstone> {
    return new Promise((resolve, reject) => {
      let determinedNports: number | null = nports ?? null
      if (determinedNports === null) {
        determinedNports = this.parsePorts(file.name)
      }
      if (determinedNports === null) {
        return reject(
          new Error(
            `Could not determine number of ports from file name: ${file.name}`
          )
        )
      }

      const name = this.getBasename(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const textContent = e.target?.result as string
          if (!textContent) {
            reject(new Error('File content is empty'))
            return
          }
          resolve(this.fromText(textContent, determinedNports, name))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`))
      }
      reader.readAsText(file)
    })
  }

  /**
   * Name of the Touchstone file (without extension).
   * Used as default filename when saving and as legend label in plots.
   * Automatically set when using `fromUrl()` or `fromFile()`,
   * can be manually provided in `fromText()` or set directly.
   *
   * @example
   * ```typescript
   * const ts = await Touchstone.fromUrl('http://example.com/network.s2p')
   * console.log(ts.name) // 'network'
   * ```
   */
  public name: string | undefined

  /**
   * Array of comment strings extracted from the Touchstone file header (lines starting with `!`).
   */
  public comments: string[] = []

  /**
   * Touchstone format: MA, DB, and RI
   */
  private _format: TouchstoneFormat | undefined

  /**
   * Sets the Touchstone data format.
   * - RI: Real and Imaginary, i.e., $A + j \cdot B$
   * - MA: Magnitude and Angle (degrees), i.e., $A \cdot e^{j \cdot {\pi \over 180} \cdot B }$
   * - DB: Decibel and Angle (degrees), i.e., $10^{A \over 20} \cdot e^{j \cdot {\pi \over 180} \cdot B}$
   *
   * @param format - The target format (RI, MA, or DB).
   * @throws Error if the format is invalid.
   */
  set format(format: TouchstoneFormat | undefined | null) {
    if (format === undefined || format === null) {
      this._format = undefined
      return
    }
    if (typeof format !== 'string') {
      throw new Error(`Unknown Touchstone format: ${format}`)
    }
    switch (format.toLowerCase()) {
      case 'ma':
        this._format = 'MA'
        break
      case 'db':
        this._format = 'DB'
        break
      case 'ri':
        this._format = 'RI'
        break
      default:
        throw new Error(`Unknown Touchstone format: ${format}`)
    }
  }

  /**
   * Get the Touchstone format
   * @returns
   */
  get format(): TouchstoneFormat | undefined {
    return this._format
  }

  /**
   * Type of network parameter: 'S' | 'Y' | 'Z' | 'G' | 'H'
   */
  private _parameter: TouchstoneParameter | undefined

  /**
   * Sets the type of network parameters.
   * - S: Scattering parameters
   * - Y: Admittance parameters
   * - Z: Impedance parameters
   * - H: Hybrid-h parameters
   * - G: Hybrid-g parameters
   *
   * @param parameter - The target parameter type (S, Y, Z, G, or H).
   * @throws Error if the parameter type is invalid.
   */
  set parameter(parameter: TouchstoneParameter | undefined | null) {
    if (parameter === undefined || parameter === null) {
      this._parameter = undefined
      return
    }
    if (typeof parameter !== 'string') {
      throw new Error(`Unknown Touchstone parameter: ${parameter}`)
    }
    switch (parameter.toLowerCase()) {
      case 's':
        this._parameter = 'S'
        break
      case 'y':
        this._parameter = 'Y'
        break
      case 'z':
        this._parameter = 'Z'
        break
      case 'g':
        this._parameter = 'G'
        break
      case 'h':
        this._parameter = 'H'
        break
      default:
        throw new Error(`Unknown Touchstone parameter: ${parameter}`)
    }
  }

  /**
   * Get the type of network parameter
   */
  get parameter() {
    return this._parameter
  }

  /**
   * Reference impedance(s) for the network parameters
   * Default: 50Ω
   */
  private _impedance: TouchstoneImpedance = 50

  /**
   * Sets the reference impedance (resistance) in Ohms.
   * Default: 50Ω
   *
   * @param impedance - A single number for all ports, or an array of numbers (one per port).
   * @throws Error if the impedance value is invalid.
   */
  set impedance(impedance: TouchstoneImpedance) {
    if (typeof impedance === 'number') {
      this._impedance = impedance
      return
    }
    if (!Array.isArray(impedance) || impedance.length === 0) {
      throw new Error(`Unknown Touchstone impedance: ${impedance}`)
    }
    for (const element of impedance) {
      if (typeof element !== 'number') {
        throw new Error(`Unknown Touchstone impedance: ${impedance}`)
      }
    }
    this._impedance = impedance
  }

  /**
   * Get the Touchstone impedance.
   * Default: 50Ω
   * @returns
   */
  get impedance(): TouchstoneImpedance {
    return this._impedance
  }

  /**
   * The number of ports in the network
   */
  private _nports: number | undefined

  /**
   * Sets the number of ports for the network.
   *
   * @param nports - The integer number of ports (must be >= 1).
   * @throws Error if the value is not a positive integer.
   */
  set nports(nports: number | undefined | null) {
    if (nports === undefined || nports === null) {
      this._nports = undefined
      return
    }
    if (typeof nports !== 'number') {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    if (!Number.isInteger(nports)) {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    if (nports < 1) {
      throw new Error(`Unknown ports number: ${nports}`)
    }
    this._nports = nports
  }

  /**
   * The number of ports in the network.
   */
  get nports() {
    return this._nports
  }

  /**
   * Frequency metadata and point array.
   */
  public frequency: Frequency | undefined

  /**
   * 3D array to store the network parameter data
   * - First dimension [i]: Output port index (0 to nports-1) - where signal exits
   * - Second dimension [j]: Input port index (0 to nports-1) - where signal enters
   * - Third dimension [k]: Frequency index
   *
   * For example: matrix[i][j][k] is the parameter from port j+1 to port i+1 at frequency k
   */
  private _matrix: TouchstoneMatrix | undefined

  /**
   * Directly sets the network parameter matrix.
   *
   * @param matrix - The 3D complex matrix to assign.
   */
  set matrix(matrix: TouchstoneMatrix | undefined | null) {
    if (matrix === undefined || matrix === null) {
      this._matrix = undefined
      return
    }
    this._matrix = matrix
  }

  /**
   * Gets the current network parameter matrix (3D array).
   * Represents the S/Y/Z/G/H-parameters of the network.
   *
   * @remarks
   * Matrix Structure:
   * - First dimension [i]: Output port index (0 to nports-1) - where the signal exits
   * - Second dimension [j]: Input port index (0 to nports-1) - where the signal enters
   * - Third dimension [k]: Frequency point index
   *
   * @example
   * ```typescript
   * // For any N-port network (2-port, 4-port, etc.):
   * const s11 = touchstone.matrix[0][0][freqIdx] // S11: port 1 → port 1
   * const s21 = touchstone.matrix[1][0][freqIdx] // S21: port 1 → port 2
   * const s12 = touchstone.matrix[0][1][freqIdx] // S12: port 2 → port 1
   * const s22 = touchstone.matrix[1][1][freqIdx] // S22: port 2 → port 2
   *
   * // General pattern: Sij = matrix[i-1][j-1][freqIdx]
   * // where i is the output port number, j is the input port number
   * ```
   *
   * @returns The current network parameter matrix, or undefined if not set
   */
  get matrix() {
    return this._matrix
  }

  /**
   * Reads and parses a Touchstone format string into the internal data structure.
   *
   * @param string - The Touchstone format string to parse
   * @param nports - Number of ports in the network
   *
   * @throws {Error} If the option line is missing or invalid
   * @throws {Error} If multiple option lines are found
   * @throws {Error} If the impedance specification is invalid
   * @throws {Error} If the data format is invalid or incomplete
   *
   * @remarks
   * The method performs the following steps:
   * 1. Parses comments and option line
   * 2. Extracts frequency points
   * 3. Converts raw data into complex numbers based on format
   * 4. Stores the results in the matrix property
   *
   * @example
   * ```typescript
   * import { Touchstone } from 'rf-touchstone';
   *
   * const s1pString = `
   * ! This is a 1-port S-parameter file
   * # MHz S MA R 50
   * 100 0.99 -4
   * 200 0.80 -22
   * 300 0.707 -45
   * `;
   *
   * const touchstone = Touchstone.fromText(s1pString, 1);
   *
   * console.log(touchstone.comments); // Outputs: [ 'This is a 1-port S-parameter file' ]
   * console.log(touchstone.format); // Outputs: 'MA'
   * console.log(touchstone.parameter); // Outputs: 'S'
   * console.log(touchstone.impedance); // Outputs: 50
   * console.log(touchstone.nports); // Outputs: 1
   * console.log(touchstone.frequency?.f_scaled); // Outputs: [ 100, 200, 300 ]
   * console.log(touchstone.matrix); // Outputs: the parsed matrix data
   * ```
   */
  public readContent(string: string, nports: number): void {
    // Assign the number of ports
    this.nports = nports
    // Parse lines from the string
    const lines = string
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
    // Parse comments
    this.comments = lines
      .filter((line) => line.startsWith('!'))
      .map((line) => line.slice(1).trim())
    // Initialize frequency
    this.frequency = new Frequency()

    // Parse options
    const options = lines.filter((line) => line.startsWith('#'))
    if (options.length === 0) {
      throw new Error('Unable to find the option line starting with "#"')
    } else if (options.length > 1) {
      throw new Error(
        `Only one option line starting with "#" is supported, but found ${options.length} lines`
      )
    }
    const tokens = options[0].slice(1).trim().split(/\s+/)
    // Frequency unit
    this.frequency.unit = tokens[0] as FrequencyUnit
    // Touchstone parameter
    this.parameter = tokens[1] as TouchstoneParameter
    // Touchstone format
    this.format = tokens[2] as TouchstoneFormat
    // Touchstone impedance
    if (tokens.length >= 4) {
      if (tokens[3].toLowerCase() !== 'r') {
        throw new Error(
          `Unknown Touchstone impedance: ${tokens.slice(3).join(' ')}`
        )
      }
      const array = tokens.slice(4).map((d) => parseFloat(d))
      if (array.length === 0 || array.some(Number.isNaN)) {
        throw new Error(
          `Unknown Touchstone impedance: ${tokens.slice(3).join(' ')}`
        )
      }
      if (array.length === 1) {
        this.impedance = array[0]
      } else if (array.length === this.nports) {
        this.impedance = array
      } else {
        throw new Error(
          `${this.nports}-ports network, but find ${array.length} impedances: [${array}]`
        )
      }
    }

    // Parse frequency data
    const dataString = lines
      .filter((line) => !line.startsWith('!') && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('!')
        if (index !== -1) {
          // Remove inline comments
          return line.substring(0, index).trim()
        } else {
          return line.trim()
        }
      })
      .join(' ')

    // Split valid data tokens and parse as numbers
    const data = dataString.split(/\s+/).map((d) => parseFloat(d))
    // countColumn(Columns count): 1 + 2 * nports^2

    // The expected number of values in each frequency data row
    const countColumn = 2 * Math.pow(this.nports, 2) + 1
    if (data.length % countColumn !== 0) {
      throw new Error(
        `Touchstone invalid data number: ${data.length}, which should be multiple of ${countColumn}`
      )
    }
    const points = data.length / countColumn
    // f[n] = TokenList[n * countColumn]

    // Extract the scaled frequency values (f[n] = TokenList[n * countColumn])
    const rawScaled = subset(
      data,
      index(multiply(range(0, points), countColumn))
    )
    /* v8 ignore start */
    if (Array.isArray(rawScaled)) {
      this.frequency.f_scaled = rawScaled
    } else if (typeof rawScaled === 'number') {
      this.frequency.f_scaled = [rawScaled]
    } else {
      throw new Error(
        `Unexpected frequency f_scaled type: ${typeof rawScaled}, and its value: ${rawScaled}`
      )
    }
    /* v8 ignore stop */

    // Initialize matrix with the correct dimensions:
    // - First dimension: output ports (nports)
    // - Second dimension: input ports (nports)
    // - Third dimension: frequency points (points)
    this.matrix = Array.from<Complex[][]>({ length: nports })
    for (let outPort = 0; outPort < nports; outPort++) {
      this.matrix[outPort] = Array.from<Complex[]>({ length: nports })
      for (let inPort = 0; inPort < nports; inPort++) {
        this.matrix[outPort][inPort] = Array.from<Complex>({ length: points })
      }
    }

    // Parse matrix data: Convert raw data into complex numbers based on format
    for (let outPort = 0; outPort < nports; outPort++) {
      for (let inPort = 0; inPort < nports; inPort++) {
        // A[outPort][inPort][n] = TokenList[countColumn * n + (outPort * nports + inPort) * 2 + 1]
        const A = subset(
          data,
          index(
            add(
              multiply(range(0, points), countColumn),
              (outPort * nports + inPort) * 2 + 1
            )
          )
        )
        // B[outPort][inPort][n] = TokenList[countColumn * n + (outPort * nports + inPort) * 2 + 2]
        const B = subset(
          data,
          index(
            add(
              multiply(range(0, points), countColumn),
              (outPort * nports + inPort) * 2 + 2
            )
          )
        )

        // Convert data pairs into complex numbers based on format
        /* v8 ignore start */
        for (let n = 0; n < points; n++) {
          let value: Complex
          switch (this.format) {
            case 'RI':
              // Real-Imaginary format: A + jB
              value = complex(A[n], B[n])
              break
            case 'MA':
              // Magnitude-Angle format: A∠B°
              value = complex({
                r: A[n],
                phi: (B[n] / 180) * pi,
              })
              break
            case 'DB':
              // Decibel-Angle format: 20log₁₀(|A|)∠B°
              value = complex({
                r: pow(10, A[n] / 20) as number,
                phi: (B[n] / 180) * pi,
              })
              break
            default:
              throw new Error(`Unknown Touchstone format: ${this.format}`)
          }
          /* v8 ignore stop */

          // Store the value in the matrix
          // Special case for 2-port networks: swap indices
          if (nports === 2) {
            this.matrix[inPort][outPort][n] = value
          } else {
            this.matrix[outPort][inPort][n] = value
          }
        }
      }
    }
  }

  /**
   * Validates the internal state of the Touchstone instance.
   * Performs comprehensive checks on all required data and matrix dimensions.
   *
   * @throws {Error} If any of the following conditions are met:
   * - Number of ports is undefined
   * - Frequency object is not initialized
   * - Frequency points array is empty
   * - Network parameter type is undefined
   * - Data format is undefined
   * - Network parameter matrix is undefined
   * - Matrix dimensions don't match with nports or frequency points
   *
   * @remarks
   * This method performs two main validation steps:
   * 1. Essential Data Validation:
   *    - Checks existence of all required properties
   *    - Ensures frequency points are available
   *
   * 2. Matrix Dimension Validation:
   *    - Verifies matrix row count matches port number
   *    - Ensures each row has correct number of columns
   *    - Validates frequency points count in each matrix element
   */
  public validate(): void {
    // Check if all required data exists
    if (!this.nports) {
      throw new Error('Number of ports (nports) is not defined')
    }
    if (!this.frequency) {
      throw new Error('Frequency object is not defined')
    }
    if (this.frequency.f_scaled.length === 0) {
      throw new Error('Frequency points array is empty')
    }
    if (!this.parameter) {
      throw new Error('Network parameter type is not defined')
    }
    if (!this.format) {
      throw new Error('Data format (RI/MA/DB) is not defined')
    }
    if (!this.matrix) {
      throw new Error('Network parameter matrix is not defined')
    }

    // Get the number of frequency points
    const points = this.frequency.f_scaled.length

    // Validate matrix dimensions against nports and frequency points
    if (this.matrix.length !== this.nports) {
      throw new Error(
        `Touchstone matrix has ${this.matrix.length} rows, but expected ${this.nports}`
      )
    }
    for (let outPort = 0; outPort < this.nports; outPort++) {
      if (this.matrix[outPort].length !== this.nports) {
        throw new Error(
          `Touchstone matrix at row index ${outPort} has ${this.matrix[outPort].length} columns, but expected ${this.nports}`
        )
      }
      for (let inPort = 0; inPort < this.nports; inPort++) {
        if (this.matrix[outPort][inPort].length !== points) {
          throw new Error(
            `Touchstone matrix at row ${outPort}, column ${inPort} has ${this.matrix[outPort][inPort].length} points, but expected ${points}`
          )
        }
      }
    }
  }

  /**
   * Generates a Touchstone format string from the internal data structure.
   *
   * @returns The generated Touchstone format string
   *
   * @throws {Error} If any required data is missing
   * @throws {Error} If the matrix dimensions are invalid
   *
   * @remarks
   * The generated string includes:
   * 1. Comments (if any)
   * 2. Option line with format, parameter type, and impedance
   * 3. Network parameter data in the specified format
   *
   * @example
   * ```typescript
   * import { Touchstone, Frequency } from 'rf-touchstone';
   * import { complex } from 'mathjs';
   *
   * const touchstone = new Touchstone();
   *
   * // Set properties and matrix data
   * touchstone.comments = ['Generated by rf-touchstone'];
   * touchstone.nports = 1;
   * touchstone.frequency = new Frequency();
   * touchstone.frequency.unit = 'GHz';
   * touchstone.frequency.f_scaled = [1.0, 2.0];
   * touchstone.parameter = 'S';
   * touchstone.format = 'MA';
   * touchstone.impedance = 50;
   * touchstone.matrix = [
   *   [ // Output port 1
   *     [complex(0.5, 0.1), complex(0.4, 0.2)] // S11 at each frequency
   *   ]
   * ];
   *
   * const s1pString = touchstone.writeContent();
   * console.log(s1pString);
   * // Expected output (approximately, due to floating point precision):
   * // ! Generated by rf-touchstone
   * // # GHz S MA R 50
   * // 1 0.5099 11.3099
   * // 2 0.4472 26.5651
   * ```
   */
  public writeContent(): string {
    this.validate()

    // Calculate points number in the network
    const points = this.frequency!.f_scaled.length

    // Generate Touchstone content lines
    const lines: string[] = []

    // 1. Add comment lines
    if (this.comments.length > 0) {
      lines.push(...this.comments.map((comment) => `! ${comment}`))
    }

    // 2. Add the option line (# ...)
    let optionLine = `# ${this.frequency!.unit} ${this.parameter} ${this.format}`
    if (Array.isArray(this.impedance)) {
      optionLine += ` R ${this.impedance.join(' ')}`
    } else {
      optionLine += ` R ${this.impedance}`
    }
    lines.push(optionLine)

    // 3. Add network parameter data
    for (let n = 0; n < points; n++) {
      const dataLine: string[] = [this.frequency!.f_scaled[n].toString()]

      // Add matrix data for this frequency point
      for (let outPort = 0; outPort < this.nports!; outPort++) {
        for (let inPort = 0; inPort < this.nports!; inPort++) {
          // Special indexing for 2-port networks to match S11 S21 S12 S22 order
          const value =
            this.nports === 2
              ? this.matrix![inPort][outPort][n]
              : this.matrix![outPort][inPort][n]

          let A: number, B: number
          switch (this.format) {
            case 'RI':
              A = value.re
              B = value.im
              break
            case 'MA':
              A = abs(value) as unknown as number
              B = (arg(value) / pi) * 180
              break
            case 'DB':
              A = 20 * log10(abs(value) as unknown as number)
              B = (arg(value) / pi) * 180
              break
            default:
              throw new Error(`Unknown Touchstone format: ${this.format}`)
          }
          // Limit precision and avoid scientific notation for better parser compatibility
          dataLine.push(round(A, 12).toString(), round(B, 12).toString())
        }
      }
      lines.push(dataLine.join(' '))
    }

    lines.push('')
    return lines.join('\n')
  }
}
