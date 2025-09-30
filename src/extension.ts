import * as vscode from 'vscode';
import { MarkdownPreview } from './viewer';

export function activate(context: vscode.ExtensionContext) {
	MarkdownPreview.register(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('markdownPreview.open', async () => {
			const doc = await pickMarkdown();
			if (doc) {
				await vscode.commands.executeCommand('vscode.openWith', doc.uri, MarkdownPreview.viewType, vscode.ViewColumn.Beside);
			}
		})
	);
}

async function pickMarkdown(): Promise<vscode.TextDocument | undefined> {
	const files = await vscode.window.showOpenDialog({
		filters: { 'Markdown Files': ['md', 'markdown'] },
		canSelectMany: false,
		openLabel: 'Open Markdown File'
	});
	if (!files || !files[0]) { return; }
	return vscode.workspace.openTextDocument(files[0]);
}

export function deactivate() { }