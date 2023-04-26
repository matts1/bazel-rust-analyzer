import * as vscode from 'vscode';

import { GenRustProject } from './gen_rust_project';
import { isRustDocument } from './util';

// This method is called when the extension is activated.
// It's activated when a .rs file is opened.
export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Extension activated');

	const genRustProject = new GenRustProject();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('bazel-rust-analyzer.genRustProjectFromOpenFiles', () => genRustProject.fromOpenFiles()));
	vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
		if (isRustDocument(document)) {
			genRustProject.autoFromOpenFiles();
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
