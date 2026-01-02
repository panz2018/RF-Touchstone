import { Touchstone } from 'rf-touchstone'

/**
 * Extracts a filename from a URL or a file path string.
 * This is the same logic as Touchstone.getFilename in the library.
 *
 * @param pathOrUrl - The URL or path string
 * @returns The filename part of the string
 */
export const getFilenameFromUrl = (pathOrUrl: string): string => {
  try {
    const url = new URL(pathOrUrl)
    return url.pathname.split('/').pop() || pathOrUrl
  } catch {
    return pathOrUrl.split(/[/\\]/).pop() || pathOrUrl
  }
}

/**
 * Heuristic to determine the number of ports from a filename extension (e.g., .s2p -> 2).
 * This is the same logic as Touchstone.parsePorts in the library.
 *
 * @param filename - The filename to check
 * @returns The number of ports, or null if not determinable from the extension
 */
export const getNumberOfPorts = (filename: string): number | null => {
  const match = filename.match(/\.s(\d+)p$/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

/**
 * Parses raw text content as Touchstone data given the number of ports.
 * This is the same logic as Touchstone.fromText in the library.
 *
 * @param content - The raw text content
 * @param nports - The number of ports
 * @returns A Touchstone object
 */
export const readText = (content: string, nports: number): Touchstone => {
  const ts = new Touchstone()
  ts.readContent(content, nports)
  return ts
}

/**
 * Reads a Touchstone file from a given URL, parses it, and returns a Touchstone object.
 * This is the same logic as Touchstone.fromUrl in the library.
 *
 * @param url - The URL to load
 * @returns A Promise that resolves to a Touchstone object
 */
export const readUrl = async (url: string): Promise<Touchstone> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  const textContent = await response.text()
  const filename = getFilenameFromUrl(url)
  const nports = getNumberOfPorts(filename)

  if (nports === null) {
    throw new Error(
      `Could not determine number of ports from URL: ${url}. Please provide nports manually.`
    )
  }
  return readText(textContent, nports)
}

/**
 * Reads a File object, parses its content, and returns a Touchstone object.
 * This is the same logic as Touchstone.fromFile in the library.
 *
 * @param file - The File object to read
 * @returns A Promise that resolves to a Touchstone object
 */
export const readFile = (file: File): Promise<Touchstone> => {
  return new Promise((resolve, reject) => {
    const nports = getNumberOfPorts(file.name)
    if (nports === null) {
      return reject(
        new Error(
          `Could not determine number of ports from file name: ${file.name}`
        )
      )
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const textContent = e.target?.result as string
        if (!textContent) {
          reject(new Error('File content is empty'))
          return
        }
        resolve(readText(textContent, nports))
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
