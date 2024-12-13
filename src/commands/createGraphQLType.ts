import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

// Function to get the GraphQL schema folder from the config file
function getSchemaFolder(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    throw new Error("No workspace folder is open.")
  }

  const configPath = path.join(workspaceFolders[0].uri.fsPath, "graphql-lens.config.json")
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    return `${config.schemaFolder}/types` || "src/graphql/schema/types"

  }

  return "src/graphql/schema/types"
}

// Register the command to create a new GraphQL type
export function registerCreateGraphQLTypeCommand(context: vscode.ExtensionContext) {
  const createGraphQLTypeCommand = vscode.commands.registerCommand(
    "graphql-lens.createGraphQLType",
    async () => {
      const typeName = await vscode.window.showInputBox({
        placeHolder: "Enter the GraphQL type name",
      })

      if (!typeName) {
        return
      }

      let folderPath: string
      try {
        folderPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, getSchemaFolder())
      } catch (error) {
        vscode.window.showErrorMessage(error.message)
        return
      }

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }

      const filePath = path.join(folderPath, `${typeName}.gql`)
      const fileContent = `type ${typeName} {\n  # Add fields here\n}`

      fs.writeFileSync(filePath, fileContent, "utf8")

      const document = await vscode.workspace.openTextDocument(filePath)
      await vscode.window.showTextDocument(document)

      vscode.window.showInformationMessage(`GraphQL type ${typeName} created successfully.`)
    },
  )

  context.subscriptions.push(createGraphQLTypeCommand)
}
