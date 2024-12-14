import * as vscode from "vscode"
import * as fs from "fs"

import {
  getTypeNames,
  initializeGetTypeNamesWatcher,
  findFileWithType,
} from "../utils"

// Register the command to open a GraphQL type
export function registerOpenGraphQLTypeCommand(
  context: vscode.ExtensionContext,
) {
  const openGraphQLTypeCommand = vscode.commands.registerCommand(
    "graphql-lens.findGraphQLType",
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
      const filePath = await findFileWithType(typeName)

      if (!filePath) {
        vscode.window.showInformationMessage(`Type ${typeName} not found.`)
        return
      }

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
    },
  )

  context.subscriptions.push(openGraphQLTypeCommand)
  context.subscriptions.push(initializeGetTypeNamesWatcher())
}
