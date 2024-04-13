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
    Ro = "Ro",
    En = "En"
};
  
enum CodeType {
    Function = "Function",
    Component = "Component",
    None = "None"
};
  
enum ResponseStatus {
    Success = "Success",
    Error = "Error"
};

interface APIResponse {
    type: CodeType,
    status: ResponseStatus,
    data?: String,
    info?: String
};

interface FlexibleObject {
    [key: string]: any;
}

interface FunctionsType {
    Function: FlexibleObject,
    Component: FlexibleObject
}

let functions: FunctionsType = {
    Function: {},
    Component: {}
}




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
    type: string
): Promise<void> {
    let existingContent = await vscode.workspace.fs
        .readFile(readmePath)
        .then((bytes) => bytes.toString());
    let sectionHeader =
        type === 'Function' ? '# **Functions**' : '# **Components**';
    let sectionPos = existingContent.indexOf(sectionHeader);

    if (sectionPos === -1) {
        // If the section doesn't exist, create it at the end of the file
        existingContent += `\n${sectionHeader}\n${markdownText}`;
    } else {
        // If the section exists, append the new content after the section header
        let sectionEndPos = existingContent.indexOf('\n## ', sectionPos + 1);
        if (sectionEndPos === -1) {
            sectionEndPos = existingContent.length;
        }
        existingContent =
            existingContent.slice(0, sectionEndPos) +
            '\n' +
            markdownText +
            existingContent.slice(sectionEndPos);
    }

    await vscode.workspace.fs.writeFile(
        readmePath,
        Buffer.from(existingContent)
    );
    vscode.window.showInformationMessage('Documentation updated in README.md');
}

async function loadFunctios(filePath: vscode.Uri) {
    try {
        console.log('File exists.');
        const filedata = await vscode.workspace.fs.readFile(filePath);
        const filedata_str = filedata.toString();
        try {
            functions = JSON.parse(filedata.toString()) as FunctionsType;
        } catch(error) {
            console.error('functions.json parse error:', error);
            vscode.window.showErrorMessage(
                'functions.json parse error'
            );
        }
    } catch (error) {
        console.log('File does not exist, creating file...');
        await vscode.workspace.fs.writeFile(
            filePath,
            Buffer.from('{}')
        );
    }
}

async function updateFunctios(filePath: vscode.Uri) {
    await vscode.workspace.fs.writeFile(
        filePath,
        Buffer.from(JSON.stringify(functions))
    );
}

function getUri(filename: string): vscode.Uri | undefined {
    if (vscode.workspace.workspaceFolders) {
        return vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders[0].uri,
            filename
        );
    } else {
        vscode.window.showInformationMessage(
            'No workspace is open.'
        );
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codedocs" is now active!');
    const URI = getUri('functions.json');
    if (URI) {
        loadFunctios(URI);
    }
    
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
                            params: [Language.En, `"${formattedText}"`],
                            id: 3,
                        }
                    );

                    try {
                        const parsedResult = JSON.parse(response.data.result);
                        const status = parsedResult['status'] as ResponseStatus;
                        if (status == ResponseStatus.Error) {
                            console.log("Response status: " + status)
                            vscode.window.showErrorMessage(
                                'Response status: ' + 
                                parsedResult['info']
                            );
                        } else if (status == ResponseStatus.Success) {
                            const type = parsedResult['type'] as "Function" | "Component";
                            const data = parsedResult['data'] as ComponentData;
                            
                            functions[type][data.name] = data;
                            const URI = getUri('functions.json');
                            if (URI) {
                                await updateFunctios(URI);
                            }
                           
                        }
                        
                    } catch (error) {
                        console.error('Parsing error:', error);
                        vscode.window.showErrorMessage(
                            'Parsing error'
                        );
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
