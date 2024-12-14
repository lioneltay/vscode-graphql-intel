import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

// Function to find all .gql files in the codebase
export async function findAllGqlFiles(): Promise<vscode.Uri[]> {
  const gqlFolder = getGraphqlFolder()
  const gqlFiles = await vscode.workspace.findFiles(`${gqlFolder}/**/*.gql`)
  return gqlFiles
}

export function getGraphqlFolder(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    throw new Error("No workspace folder is open.")
  }

  return readConfig("graphqlFolder", "src/graphql/resolvers")
}

export function readConfig<T>(field: string, defaultValue: T): T {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    throw new Error("No workspace folder is open.")
  }

  const configPath = path.join(
    workspaceFolders[0].uri.fsPath,
    "graphql-intel.config.json",
  )

  if (!fs.existsSync(configPath)) return defaultValue

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
  return field
    .split(".")
    .reduce(
      (o, i) => (o && typeof o === "object" ? o[i] : defaultValue),
      config,
    )
}

// Extract all fieldNames from a type in the schema
export function extractFieldNamesFromSchema(
  schema: string,
  type: string,
): string[] {
  const regex = new RegExp(`(type|extend type)\\s+${type}\\s*{([^}]*)}`, "g")
  const resolverNames: string[] = []
  let match

  while ((match = regex.exec(schema)) !== null) {
    const block = match[2]
    const blockResolverNames = [...block.matchAll(/^\s*(\w+)\s*[:(]/gm)].map(
      (m) => m[1],
    )
    resolverNames.push(...blockResolverNames)
  }

  return resolverNames
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

  return resolvers
}
