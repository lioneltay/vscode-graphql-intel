import * as vscode from "vscode"

import {
  getGraphqlFolder,
  getTypeNames,
  searchInFiles,
  getFieldsOfType,
  resolverCache,
  initializeResolverCache,
} from "../utils"

// Function to search for the resolver in the resolvers folder
async function searchResolverInFolder(
  baseType: string,
  fieldName: string,
): Promise<{ filePath: string; position: number; endIndex: number } | null> {
  // const cacheKey = `${baseType}:${fieldName}`
  // if (resolverCache[cacheKey]) {
  //   return resolverCache[cacheKey]
  // }

  const result = await searchInFiles(
    `${getGraphqlFolder()}/**/*.{ts,js}`,
    new RegExp(
      `${baseType}\\s*:\\s*{[\\s\\S]*?\\b(?:async\\s+)?${fieldName}\\b\\s*(?:\\(|\\:|,)`,
      "s",
    ),
  )

  // resolverCache[cacheKey] = result
  return result
}

async function showResolverInEditor(
  result: { filePath: string; position: number; endIndex: number },
  resolverName: string,
) {
  const document = await vscode.workspace.openTextDocument(result.filePath)
  const editor = await vscode.window.showTextDocument(document)
  const position = document.positionAt(result.position)
  editor.selection = new vscode.Selection(position, position)
  editor.revealRange(new vscode.Range(position, position))

  // Search for the resolver name again within the line range of the previous match for the Query object
  const queryStart = document.positionAt(result.position).line
  const queryEnd = document.positionAt(result.endIndex).line
  const newText = document.getText(
    new vscode.Range(
      queryStart,
      0,
      queryEnd,
      document.lineAt(queryEnd).range.end.character,
    ),
  )
  const newRegex = new RegExp(`\\b${resolverName}\\b`, "g")
  const newMatch = newRegex.exec(newText)
  if (newMatch) {
    const newPosition = document.positionAt(result.position + newMatch.index)
    editor.selection = new vscode.Selection(newPosition, newPosition)
    editor.revealRange(new vscode.Range(newPosition, newPosition))
  }
}

// Register the command to find a GraphQL resolver
export function registerFindGraphQLResolverCommand(
  context: vscode.ExtensionContext,
) {
  const findGraphQLResolverCommand = vscode.commands.registerCommand(
    "graphql-intel.findGraphQLResolver",
    async () => {
      const resolverType = await vscode.window.showQuickPick(
        ["Query", "Mutation", "Type"],
        {
          placeHolder: "Select the GraphQL resolver type",
        },
      )

      if (!resolverType) {
        return
      }

      const finalType =
        resolverType === "Type"
          ? await vscode.window.showQuickPick(await getTypeNames(), {
              placeHolder: "Select a GraphQL type",
            })
          : resolverType

      if (!finalType) {
        return
      }

      const typeFields = await getFieldsOfType(finalType)

      const resolverName = await vscode.window.showQuickPick(typeFields, {
        placeHolder: `Select the GraphQL ${finalType} name`,
      })

      if (!resolverName) {
        return
      }

      const result = await searchResolverInFolder(finalType, resolverName)
      if (result) {
        await showResolverInEditor(result, resolverName)
      } else {
        vscode.window.showInformationMessage(
          `Resolver ${resolverName} not found.`,
        )
      }
    },
  )

  context.subscriptions.push(findGraphQLResolverCommand)
}
