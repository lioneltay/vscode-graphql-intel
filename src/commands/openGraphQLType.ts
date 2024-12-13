import * as vscode from "vscode"
import * as fs from "fs"

// Cache to store GraphQL type names by file path
let typeCache: { [key: string]: Set<string> } = {}
let cacheInitialized = false

// Function to initialize the cache by reading all .gql files in the workspace
async function initializeCache() {
  const files = await vscode.workspace.findFiles("**/*.gql")
  const promises = files.map(async (file) => {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const regex = /type\s+(\w+)\s+{/g
    let match
    while ((match = regex.exec(content)) !== null) {
      if (!typeCache[file.fsPath]) {
        typeCache[file.fsPath] = new Set<string>()
      }
      typeCache[file.fsPath].add(match[1])
    }
  })
  await Promise.all(promises)
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
async function getTypeNames(): Promise<string[]> {
  if (!cacheInitialized) {
    await initializeCache()
  }
  const typeNames = new Set<string>()
  for (const types of Object.values(typeCache)) {
    types.forEach((type) => typeNames.add(type))
  }
  return Array.from(typeNames)
}

// Register the command to open a GraphQL type
export function registerOpenGraphQLTypeCommand(
  context: vscode.ExtensionContext,
) {
  const openGraphQLTypeCommand = vscode.commands.registerCommand(
    "graphql-lens.openGraphQLType",
    async () => {
      // Get all type names for the quick pick dropdown
      const typeNames = await getTypeNames()
      const typeName = await vscode.window.showQuickPick(typeNames, {
        placeHolder: "Enter the GraphQL type name",
      })

      if (!typeName) {
        return
      }

      // Search for the selected type name in the cache and open the file
      for (const [filePath, types] of Object.entries(typeCache)) {
        if (types.has(typeName)) {
          const content = await fs.promises.readFile(filePath, "utf8")
          const regex = new RegExp(`type\\s+${typeName}\\s+{`, "g")
          const match = regex.exec(content)
          if (match) {
            const document = await vscode.workspace.openTextDocument(filePath)
            const editor = await vscode.window.showTextDocument(document)
            const position = document.positionAt(match.index)
            editor.selection = new vscode.Selection(position, position)
            editor.revealRange(new vscode.Range(position, position))
            return
          }
        }
      }

      vscode.window.showInformationMessage(`Type ${typeName} not found.`)
    },
  )

  context.subscriptions.push(openGraphQLTypeCommand)

  // Watch for file changes to update the cache
  const watcher = vscode.workspace.createFileSystemWatcher("**/*.gql")
  watcher.onDidChange((uri) => updateCache(uri.fsPath))
  watcher.onDidCreate((uri) => updateCache(uri.fsPath))
  watcher.onDidDelete((uri) => delete typeCache[uri.fsPath])
  context.subscriptions.push(watcher)
}
