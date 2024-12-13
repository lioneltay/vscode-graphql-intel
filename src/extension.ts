import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "graphql-lens" is now active!')

  const disposable = vscode.commands.registerCommand(
    "graphql-lens.helloWorld",
    () => {
      vscode.window.showInformationMessage("What is going on here???")
    },
  )

  const listCommand = vscode.commands.registerCommand(
    "graphql-lens.showList",
    async () => {
      const items: vscode.QuickPickItem[] = [
        { label: "Item 1" },
        { label: "Item 2" },
        { label: "Item 3" },
      ]

      const selectedItem = await vscode.window.showQuickPick(items, {
        placeHolder: "Select an item",
      })

      if (selectedItem) {
        vscode.window.showInformationMessage(
          `You selected: ${selectedItem.label}`,
        )
      }
    },
  )

  const webviewCommand = vscode.commands.registerCommand(
    "graphql-lens.showWebview",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "graphqlLensWebview",
        "GraphQL Lens",
        vscode.ViewColumn.One,
        {
          enableScripts: true, // Enable scripts in the webview
        },
      )

      // Set the HTML content for the webview
      panel.webview.html = getWebviewContent()

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "buttonClicked":
              vscode.window.showInformationMessage("Button was clicked!")
              // Send a message back to the webview to update the content
              panel.webview.postMessage({
                command: "updateContent",
                text: "Button was clicked!",
              })
              return
          }
        },
        undefined,
        context.subscriptions,
      )
    },
  )

  const openGraphQLTypeCommand = vscode.commands.registerCommand(
    "graphql-lens.openGraphQLType",
    async () => {
      const typeName = await vscode.window.showInputBox({
        placeHolder: "Enter the GraphQL type name",
      })

      if (!typeName) {
        return
      }

      const files = await vscode.workspace.findFiles("**/*.gql")

      for (const file of files) {
        const content = fs.readFileSync(file.fsPath, "utf8")
        const regex = new RegExp(`type\\s+${typeName}\\s+{`, "g")
        if (regex.test(content)) {
          const document = await vscode.workspace.openTextDocument(file)
          await vscode.window.showTextDocument(document)
          return
        }
      }

      vscode.window.showInformationMessage(`Type ${typeName} not found.`)
    },
  )

  context.subscriptions.push(disposable)
  context.subscriptions.push(listCommand)
  context.subscriptions.push(webviewCommand)
  context.subscriptions.push(openGraphQLTypeCommand)
}

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GraphQL Lens</title>
    </head>
    <body>
      <h1>GraphQL Lens</h1>
      <button onclick="handleButtonClick()">Click me</button>
      <div id="dynamicContent"></div>
      <script>
        const vscode = acquireVsCodeApi();
        function handleButtonClick() {
          vscode.postMessage({ command: 'buttonClicked' });
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
          const message = event.data; // The JSON data our extension sent
          switch (message.command) {
            case 'updateContent':
              document.getElementById('dynamicContent').innerText = message.text;
              break;
          }
        });
      </script>
    </body>
    </html>
  `
}

// This method is called when your extension is deactivated
export function deactivate() {}
