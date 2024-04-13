import * as vscode from 'vscode';
import axios from 'axios';
import { json } from 'stream/consumers';
import { read } from 'fs';

interface FunctionData {
    type: string;
    description: string;
    params: Record<string, string>; // Assuming params is now a dictionary
    usage: string;
    name: string;
}

interface ComponentData {
    type: string;
    description: string;
    props: Record<string, string>;
    usage: string;
    name: string;
}

function generateMarkdown(
    type: string,
    data: FunctionData | ComponentData
): string {
    let markdownText = '';
    if (type === 'Function') {
        const functionData = data as FunctionData;
        console.log(functionData);
        markdownText = `
### **${functionData['name']}()**

<u>**Description:**</u>
${functionData['description']}

<u>**Parameters:**</u>
${Object.entries(functionData['params'])
    .map(([key, value]) => `- **${key}**: ${value}`)
    .join('\n')}

<u>**Usage:**</u>
${functionData['usage']}
`;
    } else if (type === 'Component') {
        const componentData = data as ComponentData;
        markdownText = `
### **${componentData['name']}.jsx**

<u>**Description:**</u>
${componentData['description']}

<u>**Props:**</u>
${Object.entries(componentData['props'])
    .map(([key, value]) => `- **${key}**: ${value}`)
    .join('\n')}

<u>**Usage:**</u>
${componentData['usage']}
`;
    }
    return markdownText;
}

async function updateReadme(
    readmePath: vscode.Uri,
    markdownText: string,
    type: string,
    name: string
): Promise<void> {
    let existingContent = await vscode.workspace.fs
        .readFile(readmePath)
        .then((bytes) => bytes.toString());

    const sectionHeader =
        type === 'Function' ? '# **Functions**' : '# **Components**';
    let sectionPos = existingContent.indexOf(sectionHeader);

    if (sectionPos === -1) {
        // If the section doesn't exist, create it at the end of the file
        existingContent += `\n${sectionHeader}\n${markdownText}`;
    } else {
        // Find existing entry for the function or component
        const entryHeader =
            type === 'Function' ? `### **${name}()**` : `### **${name}.jsx**`;
        let entryStart = existingContent.indexOf(entryHeader, sectionPos);

        if (entryStart !== -1) {
            // If the entry exists, replace it
            let entryEnd = existingContent.indexOf('\n### **', entryStart + 1);
            if (entryEnd === -1) {
                // Check if it's the last entry
                entryEnd = existingContent.length;
            }
            existingContent =
                existingContent.substring(0, entryStart) +
                markdownText +
                existingContent.substring(entryEnd);
        } else {
            // If the entry does not exist, append the new content after the section header
            const newEntryPos = existingContent.indexOf(
                '\n',
                sectionPos + sectionHeader.length
            );
            existingContent =
                existingContent.substring(0, newEntryPos) +
                '\n' +
                markdownText +
                existingContent.substring(newEntryPos);
        }
    }

    await vscode.workspace.fs.writeFile(
        readmePath,
        Buffer.from(existingContent)
    );
    vscode.window.showInformationMessage('Documentation updated in README.md');
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codedocs" is now active!');
    let disposable = vscode.commands.registerCommand(
        'codedocs.helloWorld',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);

                if (!text) {
                    vscode.window.showInformationMessage('No text selected.');
                    return;
                }

                // Make a request to the backend
                const formattedText = text.replace(/\r?\n|\r/g, ' ').trim();

                try {
                    const response = await axios.post(
                        'https://wpoeml43owuky4yqiu62iw2jwq0rckaj.lambda-url.us-east-1.on.aws/',
                        {
                            jsonrpc: '2.0',
                            method: 'Server.generateDoc',
                            params: ['En', `"${formattedText}"`],
                            id: 3,
                        }
                    );

                    const finalResult = response.data.result;

                    try {
                        const parsedResult = JSON.parse(finalResult);
                        const type = parsedResult['type'];
                        const name = parsedResult['name'];
                        const markdownText = generateMarkdown(
                            type,
                            parsedResult['data']
                        );

                        const workspaceFolders =
                            vscode.workspace.workspaceFolders;
                        if (workspaceFolders) {
                            const readmePath = vscode.Uri.joinPath(
                                workspaceFolders[0].uri,
                                'README.md'
                            );
                            updateReadme(readmePath, markdownText, type, name); // Pass 'name' to updateReadme
                        } else {
                            vscode.window.showInformationMessage(
                                'No workspace is open.'
                            );
                        }
                    } catch (error) {
                        console.error('Parsing error:', error);
                    }
                } catch (error) {
                    console.error('HTTP request failed:', error);
                    vscode.window.showErrorMessage(
                        'Failed to make a request or write to README.md'
                    );
                }
            } else {
                vscode.window.showInformationMessage('No active editor.');
            }
        }
    );

    context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
export function deactivate() {}
