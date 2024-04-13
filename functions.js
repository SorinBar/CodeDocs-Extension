function generateMarkdown(type, data) {
    let markdownText = '';
    if (type === 'function') {
        markdownText = `
### Function: ${data.usage}

**Description:**
${data.description}

**Parameters:**
${data.params.join(', ')}

**Usage:**
\`\`\`javascript
${data.usage}
\`\`\`
`;
    } else if (type === 'component') {
        markdownText = `
### Component: ${data.usage}

**Description:**
${data.description}

**Props:**
${Object.keys(data.props)
    .map((prop) => `${prop}: ${data.props[prop]}`)
    .join('\n')}

**Usage:**
\`\`\`javascript
${data.usage}
\`\`\`
`;
    }
    return markdownText;
}

async function updateReadme(readmePath, markdownText, type) {
    let existingContent = await vscode.workspace.fs
        .readFile(readmePath)
        .then((bytes) => bytes.toString());
    let sectionHeader = type === 'function' ? '## Functions' : '## Components';
    let sectionPos = existingContent.indexOf(sectionHeader);

    if (sectionPos === -1) {
        // If the section doesn't exist, create it at the end of the file
        existingContent += `\n${sectionHeader}\n${markdownText}`;
    } else {
        // If the section exists, append the new content after the section header
        let sectionEndPos = existingContent.indexOf('\n## ', sectionPos + 1);
        if (sectionEndPos === -1) sectionEndPos = existingContent.length;
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
