import * as vscode from 'vscode';
import axios from 'axios';

interface FunctionData {
    description: string;
    params: Record<string, string>;
    usage: string;
    name: string;
}

interface ComponentData {
    description: string;
    props: Record<string, string>;
    usage: string;
    name: string;
}

enum Language {
    Ro = 'Ro',
    En = 'En',
}

enum CodeType {
    Function = 'Function',
    Component = 'Component',
    None = 'None',
}

enum ResponseStatus {
    Success = 'Success',
    Error = 'Error',
}

interface APIResponse {
    type: CodeType;
    status: ResponseStatus;
    data?: String;
    info?: String;
}

interface FlexibleObject {
    [key: string]: any;
}

interface FunctionsType {
    Function: FlexibleObject;
    Component: FlexibleObject;
}

let functionsData: FunctionsType = {
    Function: {},
    Component: {},
};

let languageData: Language = Language.En;

function generateMarkdown(
    type: string,
    data: FunctionData | ComponentData
): string {
    let markdownText = '';
    if (type === 'Function') {
        const functionData = data as FunctionData;
        // console.log(functionData);
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
### **${componentData['name']}**

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

async function loadFunctios(filePath: vscode.Uri) {
    try {
        console.log('File exists.');
        const filedata = await vscode.workspace.fs.readFile(filePath);
        const filedata_str = filedata.toString();
        try {
            functionsData = JSON.parse(filedata.toString()) as FunctionsType;
        } catch (error) {
            console.error('functions.json parse error:', error);
            vscode.window.showErrorMessage('functions.json parse error');
        }
    } catch (error) {
        console.log('File does not exist, creating file...');
        await vscode.workspace.fs.writeFile(
            filePath,
            Buffer.from(
                JSON.stringify({
                    Function: {},
                    Component: {},
                })
            )
        );
    }
}

async function updateFunctions(filePath: vscode.Uri) {
    await vscode.workspace.fs.writeFile(
        filePath,
        Buffer.from(JSON.stringify(functionsData))
    );
}

async function updateReadme(filePath: vscode.Uri) {
    const funcs = functionsData.Function;
    const comps = functionsData.Component;
    let text: String = '';

    const funcsEntries = Object.entries(funcs);
    if (funcsEntries.length > 0) {
        text += '# **Functions**\n';
    }
    funcsEntries.forEach((element) => {
        const value = element[1];
        text += generateMarkdown(CodeType.Function, value);
    });

    const compsEntries = Object.entries(comps);
    if (compsEntries.length > 0) {
        text += '\n# **Components**\n';
    }
    Object.entries(comps).forEach((element) => {
        const value = element[1];
        text += generateMarkdown(CodeType.Component, value);
    });

    await vscode.workspace.fs.writeFile(filePath, Buffer.from(text));
}

function getUri(filename: string): vscode.Uri | undefined {
    if (vscode.workspace.workspaceFolders) {
        return vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders[0].uri,
            filename
        );
    } else {
        vscode.window.showInformationMessage('No workspace is open.');
    }
}

class DocsCodeActionProvider implements vscode.CodeActionProvider {
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction[] | undefined {
        const selectedText = document.getText(range);

        if (!selectedText.trim()) {
            return;
        }

        const generateDocsAction = new vscode.CodeAction(
            'Generate documentation',
            vscode.CodeActionKind.QuickFix
        );
        generateDocsAction.command = {
            title: 'Generate documentation fix',
            command: 'codedocs.generateDocumentation',
            arguments: [selectedText, range],
        };
        const changeLangRoAction = new vscode.CodeAction(
            'Set documentation Ro',
            vscode.CodeActionKind.Notebook
        );
        changeLangRoAction.command = {
            title: 'Set documentation Ro',
            command: 'codedocs.generateDocumentation',
            arguments: [selectedText, range, Language.Ro],
        };
        const changeLangEnAction = new vscode.CodeAction(
            'Set documentation En',
            vscode.CodeActionKind.Notebook
        );
        changeLangEnAction.command = {
            title: 'Set documentation En',
            command: 'codedocs.generateDocumentation',
            arguments: [selectedText, range, Language.En],
        };

        return [generateDocsAction, changeLangRoAction, changeLangEnAction];
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codedocs" is now active!');
    const URI = getUri('functions.json');
    if (URI) {
        loadFunctios(URI);
    }

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            'javascript',
            new DocsCodeActionProvider()
        )
    );
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            'typescript',
            new DocsCodeActionProvider()
        )
    );

    let disposable = vscode.commands.registerCommand(
        'codedocs.generateDocumentation',
        async (selectedText?: string,range?: vscode.Range, lang?: Language) => {
            if (lang) {
                languageData = lang;
                return;
            }
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = selectedText
                    ? selectedText
                    : editor.document.getText(selection);

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
                            params: [languageData, `"${formattedText}"`],
                            id: 3,
                        }
                    );

                    try {
                        const parsedResult = JSON.parse(response.data.result);
                        console.log('Parsed result:', parsedResult);
                        const status = parsedResult['status'] as ResponseStatus;
                        if (status == ResponseStatus.Error) {
                            console.log('Response status: ' + status);
                            vscode.window.showErrorMessage(
                                'Response status: ' + parsedResult['info']
                            );
                        } else if (status == ResponseStatus.Success) {
                            const type = parsedResult['type'] as
                                | 'Function'
                                | 'Component';
                            const data = parsedResult['data'] as ComponentData;

                            functionsData[type][data.name] = data;
                            let URI = getUri('functions.json');
                            if (URI) {
                                await updateFunctions(URI);
                            }
                            URI = getUri('README.md');
                            if (URI) {
                                await updateReadme(URI);
                            }
                        }
                    } catch (error) {
                        console.error('Parsing error:', error);
                        vscode.window.showErrorMessage('Parsing error');
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
