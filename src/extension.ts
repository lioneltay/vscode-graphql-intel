import * as vscode from "vscode"
import { registerOpenGraphQLTypeCommand } from "./commands/findGraphQLType"
import { registerFindGraphQLResolverCommand } from "./commands/findGraphQLResolver"

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register the command to open a GraphQL type
  registerOpenGraphQLTypeCommand(context)
  // Register the command to find a GraphQL resolver
  registerFindGraphQLResolverCommand(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
