import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

import { findAllGqlFiles, getGraphqlFolder } from "../utils"

// Function to extract all resolver names from a GraphQL schema
const extractResolverNames = (
  schema: string,
  type: "Query" | "Mutation",
): string[] => {
  const regex = new RegExp(`(type|extend type)\\s+${type}\\s*{([^}]*)}`, "g")
  const resolverNames: string[] = []
  let match

  while ((match = regex.exec(schema)) !== null) {
    const block = match[2]
    const blockResolverNames = [...block.matchAll(/^\s*(\w+)\s*\(/gm)].map(
      (m) => m[1],
    )
    resolverNames.push(...blockResolverNames)
  }

  return resolverNames
}

// Function to find all queries and mutations in .gql files
async function findAllResolvers(): Promise<{
  [filePath: string]: { queries: string[]; mutations: string[] }
}> {
  const gqlFiles = await findAllGqlFiles()
  const resolvers: {
    [filePath: string]: { queries: string[]; mutations: string[] }
  } = {}

  for (const file of gqlFiles) {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const queryNames = extractResolverNames(content, "Query")
    const mutationNames = extractResolverNames(content, "Mutation")
    if (queryNames.length > 0 || mutationNames.length > 0) {
      resolvers[file.fsPath] = { queries: queryNames, mutations: mutationNames }
    }
  }

  return resolvers
}

// Function to search for the resolver in the resolvers folder
async function searchResolverInFolder(
  baseType: string, // "Query" | "Mutation"
  resolverName: string,
): Promise<{ filePath: string; position: number; endIndex: number } | null> {
  const folderPath = getGraphqlFolder()
  const files = await vscode.workspace.findFiles(`${folderPath}/**/*.{ts,js}`)
  for (const file of files) {
    const content = await fs.promises.readFile(file.fsPath, "utf8")
    const regex = new RegExp(
      `${baseType}\\s*:\\s*{[\\s\\S]*?\\b${resolverName}\\b[\\s\\S]*?}`,
      "s",
    )
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
    "graphql-lens.findGraphQLResolver",
    async () => {
      const allResolvers = await findAllResolvers()
      const queryNames = Object.values(allResolvers).flatMap(
        (resolver) => resolver.queries,
      )
      const mutationNames = Object.values(allResolvers).flatMap(
        (resolver) => resolver.mutations,
      )

      const resolverType = await vscode.window.showQuickPick(
        ["Query", "Mutation"],
        {
          placeHolder: "Select the GraphQL resolver type",
        },
      )

      if (!resolverType) {
        return
      }

      const resolverNames =
        resolverType === "Query" ? queryNames : mutationNames

      const resolverName = await vscode.window.showQuickPick(resolverNames, {
        placeHolder: `Select the GraphQL ${resolverType.toLowerCase()} name`,
      })

      if (!resolverName) {
        return
      }

      const result = await searchResolverInFolder(resolverType, resolverName)
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
