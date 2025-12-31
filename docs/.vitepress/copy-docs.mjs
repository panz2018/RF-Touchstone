import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

// Define files to copy
const filesToCopy = [
  {
    source: 'readme.md',
    destination: 'introduction.md',
  },
  {
    source: 'development.md',
    destination: 'development.md',
  },
  {
    source: 'LICENSE.md',
    destination: 'LICENSE.md',
  },
  {
    source: path.join('coverage', 'coverage-badge.svg'),
    destination: path.join('coverage', 'coverage-badge.svg'),
  },
  {
    source: path.join('examples', 'react', 'dist'),
    destination: path.join('public', 'examples', 'react'),
  },
]

// Helper function to copy a file or directory
async function copyItem(source, destination) {
  try {
    await fs.copy(source, destination)
    console.log(`Successfully copied '${source}' to '${destination}'`)
  } catch (copyError) {
    console.error(`Error copying '${source}' to '${destination}':`, copyError)
  }
}

async function prepareDocuments() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const rootDir = path.resolve(__dirname, '..', '..') // Adjust if your script is nested deeper
  const docsDir = path.join(rootDir, 'docs')

  // Ensure the docs directory exists
  try {
    await fs.ensureDir(docsDir)
    console.log(`Ensured directory exists: '${docsDir}'`)
  } catch (dirError) {
    console.error(`Error ensuring directory '${docsDir}':`, dirError)
    return // Stop if we can't create the docs directory
  }

  // Create necessary subdirectories in docsDir before copying
  // For example, for the coverage badge
  const coverageDocsDir = path.join(docsDir, 'coverage')
  try {
    await fs.ensureDir(coverageDocsDir)
    console.log(`Ensured directory exists: '${coverageDocsDir}'`)
  } catch (dirError) {
    console.error(`Error ensuring directory '${coverageDocsDir}':`, dirError)
    // Decide if you want to return or continue if a subdirectory can't be created
  }

  // Loop through the files and copy them
  for (const file of filesToCopy) {
    const sourcePath = path.join(rootDir, file.source)
    const destinationPath = path.join(docsDir, file.destination)
    await copyItem(sourcePath, destinationPath)
  }
}

prepareDocuments().catch((error) => {
  // More specific type for the final catch
  console.error('Unhandled error in prepareDocuments:', error)
})
