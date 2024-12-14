import * as vscode from "vscode"
import * as fs from "fs"

import { getGraphqlFolder } from "../utils"

// Cache to store GraphQL type names by file path
let typeCache: { [filePath: string]: Set<string> } = {}
let cacheInitialized = false

// Function to initialize the cache by reading all .gql files in the workspace
async function initializeCache() {
  const files = await vscode.workspace.findFiles(
    `${getGraphqlFolder()}/**/*.gql`,
  )

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file.fsPath, "utf8")
      const regex = /type\s+(\w+)\s+{/g
      let match
      while ((match = regex.exec(content)) !== null) {
        if (!typeCache[file.fsPath]) {
          typeCache[file.fsPath] = new Set<string>()
        }
        typeCache[file.fsPath].add(match[1])
      }
    }),
  )

  cacheInitialized = true
}

// Function to update the cache for a specific file
async function updateCache(filePath: string) {
  const content = await fs.promises.readFile(filePath, "utf8")
  const regex = /type\s+(\w+)\s+{/g
  let match
  typeCache[filePath] = new Set<string>()
  while ((match = regex.exec(content)) !== null) {
    typeCache[filePath].add(match[1])
  }
}

// Function to get all unique type names from the cache
export async function getTypeNames(): Promise<string[]> {
  if (!cacheInitialized) {
    await initializeCache()
  }
  const typeNames = new Set<string>()
  for (const types of Object.values(typeCache)) {
    types.forEach((type) => typeNames.add(type))
  }
  return Array.from(typeNames)
}

export async function findFileWithType(
  typeName: string,
): Promise<string | null> {
  for (const [filePath, types] of Object.entries(typeCache)) {
    if (types.has(typeName)) {
      return filePath
    }
  }
  return null
}

export function initializeGetTypeNamesWatcher() {
  const watcher = vscode.workspace.createFileSystemWatcher("**/*.gql")
  watcher.onDidChange((uri) => updateCache(uri.fsPath))
  watcher.onDidCreate((uri) => updateCache(uri.fsPath))
  watcher.onDidDelete((uri) => delete typeCache[uri.fsPath])
  return watcher
}
