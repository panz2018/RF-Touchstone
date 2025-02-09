import { spawn } from 'child_process'
import path from 'path'

// Calculate python path
const isWindows = process.platform === 'win32'
const venvDir = path.resolve(process.cwd(), './.venv')
const pythonBin = isWindows ? 'Scripts/python' : 'bin/python'
const pythonPath = path.join(venvDir, pythonBin)

export async function run(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonPath, ['-c', code], {
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    })

    // Record outputs from python
    let output = ''
    pythonProcess.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })

    // Record errors from python
    pythonProcess.stderr.on('data', (error) => {
      reject(new Error(error.toString()))
    })

    // Return outputs and erros when python exits
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Return printed message from python, with the end\r\n
          resolve(output.replace(/[\r\n]+$/, ''))
        } catch (err) {
          reject(new Error(`Failed to parse Python output. Error: ${err}`))
        }
      } else {
        reject(new Error(`Python process exited with code ${code}`))
      }
    })
  })
}
