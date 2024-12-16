import * as vscode from "vscode"
import * as fs from "fs"

import { getGraphqlFolder, getTabSize } from "./config"

// Function to find all .gql files in the codebase
export async function findAllGqlFiles(): Promise<vscode.Uri[]> {
  const gqlFolder = getGraphqlFolder()
  const gqlFiles = await vscode.workspace.findFiles(`${gqlFolder}/**/*.gql`)
  return gqlFiles
}

// Extract all fieldNames from a type in the schema
export function extractFieldNamesFromSchema(
  schema: string,
  type: string,
): string[] {
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
export async function getAllFieldsOfType(type: string): Promise<string[]> {
  const gqlFiles = await findAllGqlFiles()
  const resolvers: string[] = []

  for (const file of gqlFiles) {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const resolverNames = extractFieldNamesFromSchema(content, type)
    resolvers.push(...resolverNames)
  }

  return resolvers.sort()
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
