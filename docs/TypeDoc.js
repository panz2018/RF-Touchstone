import fs from 'fs'
import path from 'path'

// 定义生成的文档目录
const docsDir = path.join(process.cwd(), 'docs/api')

/**
 * 递归获取目录中的所有 HTML 文件
 * @param {string} dir - 要扫描的目录路径
 * @returns {string[]} - 所有 HTML 文件的路径列表
 */
function getAllHtmlFiles(dir) {
  let htmlFiles = []

  // 读取目录内容
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      // 如果是子目录，递归调用
      htmlFiles = htmlFiles.concat(getAllHtmlFiles(fullPath))
    } else if (item.isFile() && item.name.endsWith('.html')) {
      // 如果是 HTML 文件，添加到列表
      htmlFiles.push(fullPath)
    }
  }

  return htmlFiles
}

/**
 * 修改 HTML 文件，注入 MathJax CDN 并处理外部链接
 */
function processHtmlFiles() {
  // 获取所有 HTML 文件（包括子文件夹中的文件）
  const htmlFiles = getAllHtmlFiles(docsDir)

  htmlFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf8')

    // 注入 MathJax CDN
    const mathJaxScript = `
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            svg: {
              fontCache: 'global'
            }
          };
        </script>
        <script type="text/javascript" async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
        </script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (window.MathJax) {
              MathJax.typesetPromise();
            }
          });
        </script>
      `
    content = content.replace('</head>', `${mathJaxScript}</head>`)

    // 修改所有外部链接，使其在新标签页中打开
    content = content.replace(
      /<a\s+(href="https?:\/\/[^"]+")/g,
      '<a $1 target="_blank" rel="noopener noreferrer"'
    )

    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8')
  })

  console.log(
    '🚀 MathJax CDN injected and external links updated successfully!'
  )
}

// 执行处理
processHtmlFiles()
