import * as vscode from "vscode"
import * as fs from "fs"

import { getGraphqlFolder, getTabSize } from "../utils"

// Cache to store GraphQL type names by file path
let typeCache: { [filePath: string]: Set<string> } = {}
let fieldsCache: { [filePath: string]: { [typeName: string]: Set<string> } } =
  {}
let cacheInitialized = false

parseAndCacheContent(
  "/Users/lioneltay/persuit/http-server/src/server/graphql/schemas/schema/mutation.gql",
)
  .then((res) =>
    console.log(
      "wee",
      res,
      fieldsCache[
        "/Users/lioneltay/persuit/http-server/src/server/graphql/schemas/schema/mutation.gql"
      ],
    ),
  )
  .catch(console.error)

// Function to parse content and update caches
async function parseAndCacheContent(filePath: string) {
  const content = await fs.promises.readFile(filePath, "utf8")
  const typeRegex = /type\s+(\w+)\s*{/g
  let match
  typeCache[filePath] = new Set<string>()
  while ((match = typeRegex.exec(content)) !== null) {
    typeCache[filePath].add(match[1])
  }

  const fieldRegex = /(type|extend type)\s+(\w+)\s*{([^}]*)}/g
  fieldsCache[filePath] = {}
  while ((match = fieldRegex.exec(content)) !== null) {
    const typeName = match[2]
    const fields = match[3]
    if (!fieldsCache[filePath][typeName]) {
      fieldsCache[filePath][typeName] = new Set<string>()
    }
    const tabSize = getTabSize()
    const fieldNamesRegex = new RegExp(
      `^( {${tabSize}}|\\t)?(\\w+)\\s*[:(]`,
      "gm",
    )
    const fieldNames = fields.match(fieldNamesRegex) || []
    fieldNames.forEach((field) =>
      fieldsCache[filePath][typeName].add(field.trim().split(/\s*[:(]/)[0]),
    )
  }
}

// Function to initialize the cache by reading all .gql files in the workspace
export async function initializeCache() {
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

// Function to get all fields of a specific type from the cache
export async function getFieldsOfType(typeName: string): Promise<string[]> {
  if (!cacheInitialized) {
    await initializeCache()
  }

  const fields = new Set<string>()
  for (const [filePath, types] of Object.entries(typeCache)) {
    if (types.has(typeName)) {
      if (fieldsCache[filePath] && fieldsCache[filePath][typeName]) {
        fieldsCache[filePath][typeName].forEach((field) => fields.add(field))
      }
    }
  }
  return Array.from(fields).sort()
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
