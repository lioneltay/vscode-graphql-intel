import * as vscode from "vscode"
import { registerOpenGraphQLTypeCommand } from "./commands/openGraphQLType"
import { registerCreateGraphQLTypeCommand } from "./commands/createGraphQLType"
import { registerFindGraphQLResolverCommand } from "./commands/findGraphQLResolver"

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  // Register the command to open a GraphQL type
  registerOpenGraphQLTypeCommand(context)
  // Register the command to create a new GraphQL type
  registerCreateGraphQLTypeCommand(context)
  // Register the command to find a GraphQL resolver
  registerFindGraphQLResolverCommand(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
