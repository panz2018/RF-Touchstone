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
    }

    files.forEach((file) => {
      if (file === 'README.md') {
        return // 跳过 README.md，因为它已经被处理
      }

      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // 如果是目录，递归处理子目录
        items.push({
          text: file,
          collapsed: false,
          items: traverse(fullPath, `${prefix}${file}/`),
        })
      } else if (file.endsWith('.md')) {
        // 如果是 Markdown 文件，添加到侧边栏
        const link = `${prefix}${file.replace(/\.md$/, '')}`
        items.push({ text: file.replace(/\.md$/, ''), link })
      }
    })

    return items
  }

  // 生成侧边栏配置
  sidebar[`/${basePath}/`] = traverse(apiPath, `${basePath}/`)
  return sidebar
}

// Test for generated sidebar
// console.log(JSON.stringify(generateSidebar('api'), null, 2))
