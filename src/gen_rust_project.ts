import {spawn, ChildProcess} from "child_process";
import {Mutex} from "async-mutex";
import * as vscode from 'vscode';

import {bazelWorkspaceDir, isRustDocument} from './util';

export class GenRustProject {
    private mutex: Mutex = new Mutex();
    private output: vscode.OutputChannel|undefined;
    private childProcess: ChildProcess|undefined;

    public async autoFromOpenFiles(): Promise<void> {
        let auto = vscode.workspace.getConfiguration("bazel-rust-analyzer").autoGenRustProjectCommand as (boolean|undefined);
        // undefined => false
        if (auto === true) {
            // We could invoke the function directly, but this allows it to be picked up by vscode.getRunningCommands().
            await this.fromOpenFiles();
        }
    }

    public async fromOpenFiles(): Promise<void> {
        let baseCmd = vscode.workspace.getConfiguration("bazel-rust-analyzer").genRustProjectCommand as (string[]|null|undefined);
        if (baseCmd === null || baseCmd === undefined) {
            baseCmd = ["bazel", "run", "@rules_rust//tools/rust_analyzer:gen_rust_project", "--", "--files"];
        }
        const openFiles = vscode.workspace.textDocuments
                    .filter(isRustDocument)
                    .map((f) => f.fileName);

        await this.fromCommand(baseCmd.concat(openFiles));
    }

    private async fromCommand(command: string[]): Promise<void> {
        // Ensure that only one command runs at a single time.
        // This is vulnerable to race conditions in theory, but in practice, it's unlikely, and the consequences are just that you see two of the same window.
        this.mutex.acquire();
        if (this.childProcess !== undefined) {
            this.childProcess.kill();
        }
        if (this.output !== undefined) {
            this.output.dispose();
        }
        const output = vscode.window.createOutputChannel("Bazel rust project generation");
        this.output = output;
        output.append(`running command: ${command.join(' ')}\n`);
        output.show(true);
        const child = spawn(
            command[0], 
            command.slice(1),
            {
                cwd: bazelWorkspaceDir(),
            },
        );
        this.childProcess = child;
        this.mutex.release();

        let success = await new Promise((resolve, reject) => {
            child.stdout.on("data", async (data) => {
                output.append("Received update. Running flychecks\n");
                await vscode.commands.executeCommand("rust-analyzer.cancelFlycheck");
                await vscode.commands.executeCommand("rust-analyzer.clearFlycheck");
                await vscode.commands.executeCommand("rust-analyzer.runFlycheck");
                child.stdin.write("Flycheck completed\n");
            });
            child.stderr.on("data", (data) => output.append(data.toString()));

            child.on("close", (code) => {
                if (code === 0) {
                    output.append("The command succeeded.\n");
                    resolve(true);
                } else {
                    // On failure, we don't want to actually throw an error, since the error message should appear in the output.
                    output.append("The command failed.\n");
                    output.show(true);
                    resolve(false);
                }
            });
        });

        if (success) {
            await vscode.commands.executeCommand("rust-analyzer.reloadWorkspace");
        }
    }
}
