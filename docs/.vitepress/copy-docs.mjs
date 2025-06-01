// Node.js script to prepare documentation files

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url) // Convert URL to path
const __dirname = path.dirname(__filename) // Get directory name
const rootDir = path.resolve(__dirname, '..', '..') // Adjusted to go up two levels from .vitepress
const docsDir = path.join(rootDir, 'docs')

async function prepareDocs() {
  try {
    // Ensure docs directory exists
    await fs.mkdir(docsDir, { recursive: true })
    console.log(`Successfully ensured 'docs' directory exists at ${docsDir}`)

    // Copy readme.md to docs/guide.md
    const readmeSource = path.join(rootDir, 'readme.md')
    const readmeDest = path.join(docsDir, 'readme.md')
    try {
      await fs.copyFile(readmeSource, readmeDest)
      console.log(`Successfully copied '${readmeSource}' to '${readmeDest}'`)
    } catch (copyError) {
      console.error(
        `Error copying '${readmeSource}' to '${readmeDest}':`,
        copyError
      )
    }

    // Copy development.md to docs/development.md
    const devMdSource = path.join(rootDir, 'development.md')
    const devMdDest = path.join(docsDir, 'development.md')
    try {
      await fs.copyFile(devMdSource, devMdDest)
      console.log(`Successfully copied '${devMdSource}' to '${devMdDest}'`)
    } catch (copyError) {
      console.error(
        `Error copying '${devMdSource}' to '${devMdDest}':`,
        copyError
      )
    }
  } catch (error) {
    console.error('Error preparing documents:', error)
  }
}

prepareDocs()
