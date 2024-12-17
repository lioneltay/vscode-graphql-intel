import * as vscode from "vscode"
import { registerOpenGraphQLTypeCommand } from "./commands/findGraphQLType"
import { registerFindGraphQLResolverCommand } from "./commands/findGraphQLResolver"
import { registerFindGraphQLFieldCommand } from "./commands/findGraphQLField"

import {
  initializeGetTypeNamesWatcher,
  initializeCache,
  initializeResolverCache,
  initializeResolverCacheWatcher,
} from "./utils"

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  console.log("GraphQL Intel extension is now active.")

  // Initialize caches
  await initializeCache()
  // await initializeResolverCache()

  // Register the command to open a GraphQL type
  registerOpenGraphQLTypeCommand(context)
  // Register the command to find a GraphQL resolver
  registerFindGraphQLResolverCommand(context)
  // Register the command to find a GraphQL field
  registerFindGraphQLFieldCommand(context)

  // Initialize watchers to update caches on file changes
  context.subscriptions.push(initializeGetTypeNamesWatcher())
  // context.subscriptions.push(initializeResolverCacheWatcher())
}

// This method is called when your extension is deactivated
export function deactivate() {}
