import { spawn } from 'child_process'
import path from 'path'

// Calculate python path
export function getPythonBin(platform: string = process.platform) {
  const isWindows = platform === 'win32'
  return isWindows ? 'Scripts/python' : 'bin/python'
}
const venvDir = path.resolve(process.cwd(), './.venv')
const pythonPath = path.join(venvDir, getPythonBin())

export async function run(program: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonPath, ['-c', dedent(program)], {
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    })

    // Record outputs from python
    let output = ''
    pythonProcess.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })

    // Record errors from python
    let errorOutput = ''
    pythonProcess.stderr.on('data', (error) => {
      errorOutput += error.toString()
    })

    // Return outputs and erros when python exits
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Return printed message from python, with the end\r\n
          resolve(output.replace(/[\r\n]+$/, ''))
        } catch (err) {
          /* v8 ignore start */
          reject(new Error(`Failed to parse Python output. Error: ${err}`))
          /* v8 ignore stop */
        }
      } else {
        const detailedErrorMessage = `Python process exited with code ${code}. \n**Python Traceback (Error Details):**\n${errorOutput}`
        reject(new Error(detailedErrorMessage))
      }
    })
  })
}

/**
 * Removes shared leading whitespace from the python code string.
 * This function processes a template string to remove the common leading whitespace
 * from all non-empty lines. This is useful for embedding Python code in
 * TypeScript templates where you want to visually indent the code in TypeScript
 * for readability but ensure the actual Python code is top-aligned (no extra indent).
 */
export function dedent(code: string): string {
  const lines = code.split('\n').map((line) => line.trimEnd())
  // Find the indent (number of leading whitespace characters)
  let indent: number | undefined = undefined
  for (const line of lines) {
    if (line.trim() === '') {
      // Ignore empty lines
      continue
    }
    const indentMatch = line.match(/^[\s]*/) // Match leading whitespace at the beginning of the line
    if (!indentMatch) {
      // Ignore if not finding leading whitespace
      continue
    }
    indent = indentMatch[0].length
    break
  }
  // If all lines are empty or no non-empty lines, no processing needed
  if (!indent) {
    return lines.join('\n')
  }
  // Remove the shared leading whitespace from each line
  const dedentedLines = lines.map((line) => {
    const initialSubstring = line.substring(0, indent)
    if (initialSubstring.trim() === '') {
      return line.substring(indent)
    } else {
      return line
    }
  })
  return dedentedLines.join('\n')
}
