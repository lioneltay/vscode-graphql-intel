import * as vscode from "vscode"
import * as fs from "fs"

import {
  getGraphqlFolder,
  getTypeNames,
  searchInFiles,
  getFieldsOfType,
} from "../utils"

// Function to search for the field in the GQL files
async function searchFieldInGqlFiles(
  typeName: string,
  fieldName: string,
): Promise<{ filePath: string; position: number; endIndex: number } | null> {
  return searchInFiles(
    `${getGraphqlFolder()}/**/*.gql`,
    new RegExp(
      `(type|extend type)\\s+${typeName}\\s*{[\\s\\S]*?\\b${fieldName}\\b\\s*(?:\\(|\\:)`,
      "s",
    ),
  )
}

async function showFieldInEditor(
  result: { filePath: string; position: number; endIndex: number },
  fieldName: string,
) {
  const document = await vscode.workspace.openTextDocument(result.filePath)
  const editor = await vscode.window.showTextDocument(document)
  const position = document.positionAt(result.position)
  editor.selection = new vscode.Selection(position, position)
  editor.revealRange(new vscode.Range(position, position))

  // Search for the field name again within the line range of the previous match for the type object
  const typeStart = document.positionAt(result.position).line
  const typeEnd = document.positionAt(result.endIndex).line
  const newText = document.getText(
    new vscode.Range(
      typeStart,
      0,
      typeEnd,
      document.lineAt(typeEnd).range.end.character,
    ),
  )
  const newRegex = new RegExp(`\\b${fieldName}\\b`, "g")
  const newMatch = newRegex.exec(newText)
  if (newMatch) {
    const newPosition = document.positionAt(result.position + newMatch.index)
    editor.selection = new vscode.Selection(newPosition, newPosition)
    editor.revealRange(new vscode.Range(newPosition, newPosition))
  }
}

// Register the command to find a GraphQL field
export function registerFindGraphQLFieldCommand(
  context: vscode.ExtensionContext,
) {
  const findGraphQLFieldCommand = vscode.commands.registerCommand(
    "graphql-intel.findGraphQLField",
    async () => {
      const allTypes = await getTypeNames()
      const topLevelTypes = ["Query", "Mutation", "Subscription"]
      const typeName = await vscode.window.showQuickPick(
        [
          ...topLevelTypes,
          ...allTypes.filter((t) => !topLevelTypes.includes(t)).sort(),
        ],
        {
          placeHolder: "Select a GraphQL type",
        },
      )

      if (!typeName) {
        return
      }

      const typeFields = await getFieldsOfType(typeName)

      const fieldName = await vscode.window.showQuickPick(typeFields, {
        placeHolder: `Select the field name for type ${typeName}`,
      })

      if (!fieldName) {
        return
      }

      const result = await searchFieldInGqlFiles(typeName, fieldName)
      if (result) {
        await showFieldInEditor(result, fieldName)
      } else {
        vscode.window.showInformationMessage(
          `Field ${fieldName} not found in type ${typeName}.`,
        )
      }
    },
  )

  context.subscriptions.push(findGraphQLFieldCommand)
}
