import * as vscode from "vscode"
import * as fs from "fs"

import { getGraphqlFolder, getTabSize } from "./config"

// Cache to store resolver search results
export let resolverCache: {
  [key: string]: { filePath: string; position: number; endIndex: number } | null
} = {}

// Function to find all .gql files in the codebase
export async function findAllGqlFiles(): Promise<vscode.Uri[]> {
  const gqlFolder = getGraphqlFolder()
  const gqlFiles = await vscode.workspace.findFiles(`${gqlFolder}/**/*.gql`)
  return gqlFiles
}

// Function to find all .ts and .js files in the codebase
export async function findAllTsJsFiles(): Promise<vscode.Uri[]> {
  const gqlFolder = getGraphqlFolder()
  const tsJsFiles = await vscode.workspace.findFiles(
    `${gqlFolder}/**/*.{ts,js}`,
  )
  return tsJsFiles
}

// Function to parse content and update resolver cache
async function parseAndCacheResolvers(filePath: string) {
  const content = await fs.promises.readFile(filePath, "utf8")
  const resolverRegex =
    /(\w+)\s*:\s*{[\s\S]*?\b(?:async\s+)?(\w+)\b\s*(?:\(|\:|,)/g
  let match
  while ((match = resolverRegex.exec(content)) !== null) {
    const baseType = match[1]
    const fieldName = match[2]
    const cacheKey = `${baseType}:${fieldName}`
    resolverCache[cacheKey] = {
      filePath,
      position: match.index,
      endIndex: match.index + match[0].length,
    }
  }
}

// Function to initialize the resolver cache by reading all .ts and .js files in the workspace
export async function initializeResolverCache() {
  const files = await findAllTsJsFiles()

  await Promise.all(
    files.map(async (file) => {
      await parseAndCacheResolvers(file.fsPath)
    }),
  )
}

// Function to update the resolver cache for a specific file
export async function updateResolverCache(filePath: string) {
  await parseAndCacheResolvers(filePath)
}

// Function to initialize the resolver cache watcher
export function initializeResolverCacheWatcher() {
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] ?? "",
      `${getGraphqlFolder()}/**/*.{ts,js}`,
    ),
  )
  watcher.onDidChange((uri) => updateResolverCache(uri.fsPath))
  watcher.onDidCreate((uri) => updateResolverCache(uri.fsPath))
  watcher.onDidDelete((uri) => {
    for (const key in resolverCache) {
      if (resolverCache[key]?.filePath === uri.fsPath) {
        delete resolverCache[key]
      }
    }
  })
  return watcher
}

// Search all files for a certain regex pattern and returns the first match
export async function searchInFiles(
  fileGlob: string,
  regex: RegExp,
): Promise<{ filePath: string; position: number; endIndex: number } | null> {
  const files = await vscode.workspace.findFiles(fileGlob)
  for (const file of files) {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const match = regex.exec(content)
    if (match) {
      return {
        filePath: file.fsPath,
        position: match.index,
        endIndex: match.index + match[0].length,
      }
    }
  }
  return null
}

// Extract all fieldNames from a type in the schema
function extractFieldNamesFromSchema(schema: string, type: string): string[] {
  const tabSize = getTabSize()
  const regex = new RegExp(`(type|extend type)\\s+${type}\\s*{([^}]*)}`, "g")
  const resolverNames: string[] = []
  let match

  while ((match = regex.exec(schema)) !== null) {
    const block = match[2]
    const blockResolverNames = [
      ...block.matchAll(
        new RegExp(`^( {${tabSize}}|\\t)?(\\w+)\\s*[:(]`, "gm"),
      ),
    ].map((m) => m[2])
    resolverNames.push(...blockResolverNames)
  }

  return resolverNames.sort()
}

// Get all fields of a type in the schema
async function getAllFieldsOfType(type: string): Promise<string[]> {
  const gqlFiles = await findAllGqlFiles()
  const resolvers: string[] = []

  for (const file of gqlFiles) {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const resolverNames = extractFieldNamesFromSchema(content, type)
    resolvers.push(...resolverNames)
  }

  return resolvers.sort()
}
