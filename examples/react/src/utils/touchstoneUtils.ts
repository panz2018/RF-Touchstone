import { Touchstone } from 'rf-touchstone'

/**
 * Parses raw text content as Touchstone data given the number of ports.
 * @param content The raw text content of the Touchstone file.
 * @param nports The number of ports.
 * @returns A Touchstone object.
 */
export const readText = (content: string, nports: number): Touchstone => {
  const ts = new Touchstone()
  ts.readContent(content, nports)
  return ts
}

/**
 * Extracts a filename from a URL string.
 * @param url The URL string.
 * @returns The filename part of the URL.
 */
export const getFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.substring(pathname.lastIndexOf('/') + 1)
  } catch (_e) {
    // If it's not a valid URL, just return the original string or some fallback
    return url.substring(url.lastIndexOf('/') + 1) || 'file.s2p'
  }
}

/**
 * Heuristic to determine the number of ports from a S2P/S1P etc. filename extension.
 * @param filename The filename to check.
 * @returns The number of ports, or null if not determinable from the extension.
 */
export const getNumberOfPorts = (filename: string): number | null => {
  const match = filename.match(/\.s(\d+)p$/i)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

/**
 * Reads a Touchstone file from a given URL, parses it, and returns a Touchstone object.
 * @param url The URL of the Touchstone file to load.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if fetching or parsing fails.
 */
export const readUrl = async (url: string): Promise<Touchstone> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  const textContent = await response.text()
  const filenameForPortCheck = getFilenameFromUrl(url)
  const nports = getNumberOfPorts(filenameForPortCheck)
  if (nports === null) {
    throw new Error(
      `Could not determine number of ports from file name: ${filenameForPortCheck} (derived from URL: ${url})`
    )
  }
  return readText(textContent, nports)
}

/**
 * Reads a File object, parses its content as Touchstone data, and returns a Touchstone object.
 * @param file The File object to read.
 * @returns A Promise that resolves to a Touchstone object.
 * @throws An error if reading or parsing fails.
 */
export const readFile = (file: File): Promise<Touchstone> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const textContent = e.target?.result as string
        if (!textContent) {
          reject(new Error('File content is empty.'))
          return
        }
        const nports = getNumberOfPorts(file.name)
        if (nports === null) {
          reject(
            new Error(
              `Could not determine number of ports from file name: ${file.name}`
            )
          )
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
