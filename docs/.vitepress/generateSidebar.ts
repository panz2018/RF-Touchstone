import fs from 'fs'
import path from 'path'
import type { DefaultTheme } from 'vitepress'

/**
 * 生成 VitePress 的侧边栏配置。
 * @param basePath - 基础路径（如 'api'）。
 * @returns VitePress 的侧边栏配置对象。
 */
export function generateSidebar(basePath: string): DefaultTheme.Sidebar {
  const sidebar: DefaultTheme.Sidebar = {}
  const apiPath = path.join(process.cwd(), 'docs', basePath)

  /**
   * 遍历目录并生成侧边栏项。
   * @param dir - 当前目录路径。
   * @param prefix - 当前路径前缀。
   * @returns 侧边栏项数组。
   */
  function traverse(dir: string, prefix = ''): DefaultTheme.SidebarItem[] {
    const items: DefaultTheme.SidebarItem[] = []
    const files = fs.readdirSync(dir)

    // 如果存在 README.md，则添加 Overview 链接
    if (files.includes('README.md')) {
      const link = `${prefix}README`
      items.push({ text: 'Overview', link })
      const fullPath = path.join(dir, 'README.md')
      updateMarkdownFile(fullPath, false, false)
    }

    // Read markdown files frist
    files.forEach((file) => {
      if (file === 'README.md') {
        return // 跳过 README.md，因为它已经被处理
      }
      // Get full path
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        // If directory, skip
        return
      }
      if (file.endsWith('.md')) {
        // 如果是 Markdown 文件，添加到侧边栏
        const link = `${prefix}${file.replace(/\.md$/, '')}`
        items.push({ text: file.replace(/\.md$/, ''), link })
      }
      updateMarkdownFile(fullPath, false, false)
    })
    // Read subfolder next
    files.forEach((file) => {
      if (file === 'README.md') {
        return // 跳过 README.md，因为它已经被处理
      }
      // Get full path
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      // If not directory, skip
      if (!stat.isDirectory()) {
        return
      }
      // 如果是目录，递归处理子目录
      items.push({
        text: file,
        collapsed: false,
        items: traverse(fullPath, `${prefix}${file}/`),
      })
    })

    return items
  }

  // 生成侧边栏配置
  sidebar[`/${basePath}/`] = traverse(apiPath, `${basePath}/`)
  return sidebar
}

/**
 * 更新 Markdown 文件的 Frontmatter。
 * @param filePath - Markdown 文件的路径。
 * @param prev - 上一页的链接。
 * @param next - 下一页的链接。
 */
function updateMarkdownFile(
  filePath: string,
  prev: string | false,
  next: string | false
): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  let content = fs.readFileSync(filePath, 'utf8')

  // 构造 Frontmatter
  const frontmatter = `---
prev: ${prev ? `'${prev}'` : false}
next: ${next ? `'${next}'` : false}
---\n\n`

  if (content.startsWith('---')) {
    // 如果文件已经有 Frontmatter，则只更新 prev 和 next
    const endOfFrontmatter = content.indexOf('\n---') + 4
    const existingFrontmatter = content.slice(0, endOfFrontmatter)
    const restContent = content.slice(endOfFrontmatter)

    const updatedFrontmatter = existingFrontmatter
      .replace(/prev:.*$/, `prev: ${prev ? `'${prev}'` : false}`)
      .replace(/next:.*$/, `next: ${next ? `'${next}'` : false}`)

    content = updatedFrontmatter + restContent
  } else {
    // 如果没有 Frontmatter，则添加新的
    content = frontmatter + content
  }

  // 写回文件
  fs.writeFileSync(filePath, content, 'utf8')
}
