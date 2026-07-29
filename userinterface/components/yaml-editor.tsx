"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Editor wird geladen …</div>,
});

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function YamlEditor({ value, onChange }: YamlEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language="yaml"
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      theme="vs-dark"
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 21,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: "off",
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        padding: { top: 18, bottom: 18 },
        stickyScroll: { enabled: true },
      }}
    />
  );
}
