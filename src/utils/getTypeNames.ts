import * as vscode from "vscode"
import * as fs from "fs"

import { getGraphqlFolder } from "../utils"

// Cache to store GraphQL type names by file path
let typeCache: { [filePath: string]: Set<string> } = {}
let fieldsCache: { [filePath: string]: { [typeName: string]: Set<string> } } =
  {}
let cacheInitialized = false

// Function to parse content and update caches
async function parseAndCacheContent(filePath: string) {
  const content = await fs.promises.readFile(filePath, "utf8")
  const typeRegex = /type\s+(\w+)\s*{/g
  let match
  typeCache[filePath] = new Set<string>()
  while ((match = typeRegex.exec(content)) !== null) {
    typeCache[filePath].add(match[1])
  }

  const fieldRegex = /type\s+(\w+)\s*{([^}]*)}/g
  fieldsCache[filePath] = {}
  while ((match = fieldRegex.exec(content)) !== null) {
    const typeName = match[1]
    const fields = match[2]
    fieldsCache[filePath][typeName] = new Set<string>()
    const fieldNames = fields.match(/\b(\w+)\b\s*(?:\(|:)/g) || []
    fieldNames.forEach((field) =>
      fieldsCache[filePath][typeName].add(field.trim()),
    )
  }
}

// Function to initialize the cache by reading all .gql files in the workspace
async function initializeCache() {
  const files = await vscode.workspace.findFiles(
    `${getGraphqlFolder()}/**/*.gql`,
  )

  await Promise.all(
    files.map(async (file) => {
      await parseAndCacheContent(file.fsPath)
    }),
  )

  cacheInitialized = true
}

// Function to update the cache for a specific file
async function updateCache(filePath: string) {
  await parseAndCacheContent(filePath)
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
  return Array.from(typeNames).sort()
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
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] ?? "",
      `${getGraphqlFolder()}/**/*.gql`,
    ),
  )
  watcher.onDidChange((uri) => updateCache(uri.fsPath))
  watcher.onDidCreate((uri) => updateCache(uri.fsPath))
  watcher.onDidDelete((uri) => {
    delete typeCache[uri.fsPath]
    delete fieldsCache[uri.fsPath]
  })
  return watcher
}
