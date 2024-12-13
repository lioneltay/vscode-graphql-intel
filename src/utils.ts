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
    "graphql-lens.config.json",
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
