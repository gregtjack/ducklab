"use client";

import { Editor } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";

interface QueryEditorProps {
  initialQuery: string;
  onQueryChange: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function QueryEditor({
  initialQuery,
  onQueryChange,
  onFocus,
  onBlur,
}: QueryEditorProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState(initialQuery);

  // Update local state when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleChange = (value: string | undefined) => {
    const newQuery = value || "";
    setQuery(newQuery);
    onQueryChange(newQuery);
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        width="100%"
        theme={theme === "dark" ? "vs-dark" : "light"}
        language="sql"
        value={query}
        onChange={handleChange}
        onMount={(editor) => {
          editor.onDidFocusEditorWidget(() => {
            onFocus?.();
          });
          editor.onDidBlurEditorWidget(() => {
            onBlur?.();
          });
        }}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          lineNumbers: "on",
          fontFamily: "var(--font-mono)",
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
        }}
      />
    </div>
  );
}
