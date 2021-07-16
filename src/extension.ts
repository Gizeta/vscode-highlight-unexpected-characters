import * as vscode from 'vscode';

function debounce(callback: Function, delay: number) {
  let timeoutId: NodeJS.Timeout | null;
  return (...args: any[]) => {
    if (timeoutId)
      clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, delay);
  }
}

const configuration = vscode.workspace.getConfiguration('highlight-unexpected-characters');
const targetCharMatcher = new RegExp(`[${configuration.rules.join('')}]`, 'gu');

const targetCharDecorationType = vscode.window.createTextEditorDecorationType({
  cursor: 'crosshair',
  backgroundColor: 'rgba(255,0,0,0.3)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255,0,0,0.6)',
});

function updateDecorations(editor: vscode.TextEditor | undefined) {
  if (!editor)
    editor = vscode.window.activeTextEditor;
  if (editor) {
    const text = editor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];
    let match;
    while (match = targetCharMatcher.exec(text)) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      const hexCharCode = match[0].charCodeAt(0).toString(16);
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        hoverMessage: `Unexpected character: [${hexCharCode}](https://unicode.org/cldr/utility/character.jsp?a=${hexCharCode})`,
      };
      decorations.push(decoration);
    }
    editor.setDecorations(targetCharDecorationType, decorations);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const triggerUpdateDecorations = debounce(updateDecorations, 500);

  triggerUpdateDecorations();

  vscode.window.onDidChangeActiveTextEditor(editor => triggerUpdateDecorations(editor), null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === event.document)
      triggerUpdateDecorations(editor);
  }, null, context.subscriptions);
}

export function deactivate() {}
