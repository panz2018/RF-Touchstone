import fs from 'fs'
import path from 'path'
import type { DefaultTheme } from 'vitepress'

/**
 * Generates the sidebar configuration for VitePress documentation.
 * Automatically creates a hierarchical sidebar structure based on the directory contents.
 *
 * @param basePath - Base directory path (e.g., 'api') relative to the docs folder
 * @returns VitePress sidebar configuration object
 */
export function generateApiSidebar(
  basePath: string
): DefaultTheme.SidebarItem[] {
  const apiPath = path.join(process.cwd(), 'docs', basePath)

  /**
   * Recursively traverses directories to generate sidebar items.
   * Processes README.md files first, then other markdown files, and finally subdirectories.
   *
   * @param dir - Current directory path to process
   * @param prefix - URL prefix for the current path level
   * @returns Array of sidebar items for the current directory
   */
  function traverse(dir: string, prefix = ''): DefaultTheme.SidebarItem[] {
    const items: DefaultTheme.SidebarItem[] = []
    const files = fs.readdirSync(dir)

    // Add Overview link if README.md exists
    if (files.includes('README.md')) {
      const link = `${prefix}README`
      items.push({ text: 'Overview', link })
      const fullPath = path.join(dir, 'README.md')
      updateMarkdownFile(fullPath, false, false)
    }

    // Process markdown files first (excluding README.md)
    files.forEach((file) => {
      if (file === 'README.md') {
        return // Skip README.md as it's already processed
      }
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        return // Skip directories in this pass
      }
      if (file.endsWith('.md')) {
        // Add markdown file to sidebar
        const link = `${prefix}${file.replace(/\.md$/, '')}`
        items.push({ text: file.replace(/\.md$/, ''), link })
      }
      updateMarkdownFile(fullPath, false, false)
    })

    // Process subdirectories
    files.forEach((file) => {
      if (file === 'README.md') {
        return // Skip README.md
      }
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (!stat.isDirectory()) {
        return // Skip non-directory items
      }
      // Recursively process subdirectory
      items.push({
        text: file,
        collapsed: false,
        items: traverse(fullPath, `${prefix}${file}/`),
      })
    })

    return items
  }

  // Generate the sidebar configuration
  return traverse(apiPath, `${basePath}/`)
}

/**
 * Updates or creates frontmatter in markdown files.
 * Handles navigation links between pages.
 *
 * @param filePath - Path to the markdown file
 * @param prev - Previous page link or false if none
 * @param next - Next page link or false if none
 * @throws {Error} If the specified file does not exist
 *
 * @example
 * Generated frontmatter format:
 * ```md
 * ---
 * prev: 'previous-page'
 * next: 'next-page'
 * ---
 * ```
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

  // Construct frontmatter content
  const frontmatter = `---
prev: ${prev ? `'${prev}'` : false}
next: ${next ? `'${next}'` : false}
---\n\n`

  if (content.startsWith('---')) {
    // Update existing frontmatter's prev and next fields
    const endOfFrontmatter = content.indexOf('\n---') + 4
    const existingFrontmatter = content.slice(0, endOfFrontmatter)
    const restContent = content.slice(endOfFrontmatter)

    const updatedFrontmatter = existingFrontmatter
      .replace(/prev:.*$/, `prev: ${prev ? `'${prev}'` : false}`)
      .replace(/next:.*$/, `next: ${next ? `'${next}'` : false}`)

    content = updatedFrontmatter + restContent
  } else {
    // Add new frontmatter to the file
    content = frontmatter + content
  }

  // Write updated content back to file
  fs.writeFileSync(filePath, content, 'utf8')
}
