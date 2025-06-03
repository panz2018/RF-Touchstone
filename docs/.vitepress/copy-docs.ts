import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

// Define a type for the file objects
interface FileToCopy {
  source: string;
  destination: string;
}

// Helper function to copy a file
async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.copyFile(source, destination)
    console.log(`Successfully copied '${source}' to '${destination}'`)
  } catch (copyError: any) {
    console.error(`Error copying '${source}' to '${destination}':`, copyError)
  }
}

async function prepareDocuments(): Promise<void> {
  const __filename: string = fileURLToPath(import.meta.url)
  const __dirname: string = path.dirname(__filename)
  const rootDir: string = path.resolve(__dirname, '..', '..') // Adjust if your script is nested deeper
  const docsDir: string = path.join(rootDir, 'docs')

  // Ensure the docs directory exists
  try {
    await fs.ensureDir(docsDir)
    console.log(`Ensured directory exists: '${docsDir}'`)
  } catch (dirError: any) {
    console.error(`Error ensuring directory '${docsDir}':`, dirError)
    return // Stop if we can't create the docs directory
  }

  // Define files to copy
  const filesToCopy: FileToCopy[] = [
    {
      source: 'readme.md',
      destination: 'introduction.md',
    },
    {
      source: 'development.md',
      destination: 'development.md',
    },
    {
      source: 'LICENSE',
      destination: 'LICENSE.md',
    },
    {
      source: path.join('coverage', 'coverage-badge.svg'), // Source relative to rootDir
      destination: path.join('coverage', 'coverage-badge.svg'), // Destination relative to docsDir
    },
  ]

  // Create necessary subdirectories in docsDir before copying
  // For example, for the coverage badge
  const coverageDocsDir: string = path.join(docsDir, 'coverage')
  try {
    await fs.ensureDir(coverageDocsDir)
    console.log(`Ensured directory exists: '${coverageDocsDir}'`)
  } catch (dirError: any) {
    console.error(`Error ensuring directory '${coverageDocsDir}':`, dirError)
    // Decide if you want to return or continue if a subdirectory can't be created
  }

  // Loop through the files and copy them
  for (const file of filesToCopy) {
    const sourcePath: string = path.join(rootDir, file.source)
    const destinationPath: string = path.join(docsDir, file.destination)
    await copyFile(sourcePath, destinationPath)
  }
}

prepareDocuments().catch((error: Error) => { // More specific type for the final catch
  console.error('Unhandled error in prepareDocuments:', error)
})
