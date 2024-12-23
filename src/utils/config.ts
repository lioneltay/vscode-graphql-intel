import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

const DEFAULT_CONFIG = {
  graphqlFolder: "src",
  tabSize: 2,
}

function readConfig(field: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    throw new Error("No workspace folder is open.")
  }

  const configPath = path.join(
    workspaceFolders[0].uri.fsPath,
    "graphql-intel.config.json",
  )

  const configFromFile = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf8"))
    : undefined

  const config = {
    ...DEFAULT_CONFIG,
    ...configFromFile,
  }

  return field
    .split(".")
    .reduce((o, i) => (o && typeof o === "object" ? o[i] : undefined), config)
}

export const getGraphqlFolder = (): string => {
  const folder = readConfig("graphqlFolder")
  return folder.endsWith("/") ? folder.slice(0, -1) : folder
}

export const getTabSize = (): number => readConfig("tabSize")
