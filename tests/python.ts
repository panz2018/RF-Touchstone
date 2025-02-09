import { spawn } from 'child_process'
import path from 'path'

/**
 * 动态获取虚拟环境中的 Python 路径
 */
function getPythonPath(): string {
  const isWindows = process.platform === 'win32'
  const venvDir = path.resolve(process.cwd(), './python/.venv')
  const pythonBin = isWindows ? 'Scripts/python' : 'bin/python'
  return path.join(venvDir, pythonBin)
}

export interface PythonResponse {
  message: string
}

export async function callPython(data: {
  name: string
}): Promise<PythonResponse> {
  return new Promise((resolve, reject) => {
    // 获取虚拟环境中的 Python 路径
    const pythonPath = getPythonPath()
    const PYTHON_SCRIPT = path.resolve(process.cwd(), './python/script.py')

    const pythonProcess = spawn(pythonPath, [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    })

    let output = ''

    // 将数据发送到 Python 脚本
    pythonProcess.stdin.write(JSON.stringify(data))
    pythonProcess.stdin.end()

    // 监听 Python 输出
    pythonProcess.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })

    // 监听错误输出
    pythonProcess.stderr.on('data', (error) => {
      reject(new Error(error.toString()))
    })

    // 监听子进程退出事件
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output)) // 解析 Python 返回的 JSON 数据
        } catch (err) {
          reject(new Error(`Failed to parse Python output. Error: ${err}`))
        }
      } else {
        reject(new Error(`Python process exited with code ${code}`))
      }
    })
  })
}
