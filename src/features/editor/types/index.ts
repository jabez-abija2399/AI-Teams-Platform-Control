export interface EditorState {
  fileId: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  viewState: unknown | null;
  decorations: EditorDecoration[];
}

export interface EditorDecoration {
  id: string;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  options: {
    inlineClassName?: string;
    glyphMarginClassName?: string;
    hoverMessage?: string;
  };
}

export interface EditorPreferences {
  fontSize: number;
  minimap: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  lineNumbers: boolean;
  tabSize: number;
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
}

export interface DiffEditorState {
  originalContent: string;
  modifiedContent: string;
  language: string;
}

export type MonacoTheme = EditorPreferences['theme'];

export interface FileContent {
  fileId: string;
  content: string;
  language: string;
  path: string;
}
