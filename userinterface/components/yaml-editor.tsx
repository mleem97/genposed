"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@astryxdesign/core/theme";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Editor wird geladen …</div>,
});

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function YamlEditor({ value, onChange }: YamlEditorProps) {
  const { mode, token } = useTheme();
  const codeFontSize = token("--text-code-size");
  const rootFontSize = typeof window === "undefined"
    ? 16
    : Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const fontSize = codeFontSize.endsWith("rem")
    ? Number.parseFloat(codeFontSize) * rootFontSize
    : Number.parseFloat(codeFontSize);

  return (
    <MonacoEditor
      height="100%"
      language="yaml"
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      theme={mode === "dark" ? "vs-dark" : "vs-light"}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: "var(--font-family-code)",
        fontSize,
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
