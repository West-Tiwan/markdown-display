import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';

export class MarkdownPreview implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'markdownPreview.preview';

    private constructor(private readonly context: vscode.ExtensionContext) { }

    public static register(context: vscode.ExtensionContext) {
        const provider = new MarkdownPreview(context);
        const disposable = vscode.window.registerCustomEditorProvider(
            MarkdownPreview.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        );
        context.subscriptions.push(disposable);
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        const update = () => {
            const md = new MarkdownIt();
            const html = md.render(document.getText());
            webviewPanel.webview.html = this.getHtml(html);
        };

        update();

        const changeSub = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                update();
            }
        });

        webviewPanel.onDidDispose(() => changeSub.dispose());

        webviewPanel.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'reopenSource') {
                vscode.window.showTextDocument(document, { preview: false });
            }
        });
    }

    private getHtml(rendered: string): string {
        const nonce = Date.now().toString();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Markdown Preview</title>
            <style>
            body { font-family: system-ui, sans-serif; padding: 1rem; line-height: 1.5; }
            pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
            </style>
            </head>
            <body>
            <div id="content">${rendered}</div>
            <button id="openSrc">Open Source</button>
            <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            document.getElementById('openSrc').addEventListener('click', () => {
                vscode.postMessage({ type: 'reopenSource' });
            });
            </script>
            </body>
            </html>`;
    }
}