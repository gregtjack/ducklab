"use client";

import { Editor, useMonaco } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCatalogStore } from "@/store/catalog-store";
import { languages } from "monaco-editor";


interface QueryEditorProps {
  initialQuery: string;
  onQueryChange: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function QueryEditor({ initialQuery, onQueryChange, onFocus, onBlur }: QueryEditorProps) {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const { datasets } = useCatalogStore();
  const [query, setQuery] = useState(initialQuery);
  const lastSyncedQueryRef = useRef(initialQuery);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when initialQuery changes from external sources
  useEffect(() => {
    // Only update if the initialQuery is different from what we last synced
    // This prevents the input from going blank when running queries
    if (initialQuery !== lastSyncedQueryRef.current) {
      setQuery(initialQuery);
      lastSyncedQueryRef.current = initialQuery;
    }
  }, [initialQuery]);

  // Debounced update to parent
  const debouncedUpdate = useCallback((newQuery: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onQueryChange(newQuery);
      lastSyncedQueryRef.current = newQuery;
    }, 300); // 300ms debounce
  }, [onQueryChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (value: string | undefined) => {
    const newQuery = value || "";
    setQuery(newQuery);
    debouncedUpdate(newQuery);
  };

  useEffect(() => {
    if (!monaco) return;

    // Register completion provider for table names
    const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions: {
          label: string;
          kind: languages.CompletionItemKind;
          insertText: string;
          detail?: string;
          documentation?: { value: string; };
          sortText: string;
          range: {
            startLineNumber: number;
            endLineNumber: number;
            startColumn: number;
            endColumn: number;
          };
        }[] = [];

        // Get the word range for replacement
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Add table names from catalog
        datasets.forEach(dataset => {
          suggestions.push({
            label: dataset.tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `"${dataset.tableName}"`,
            detail: `Table: ${dataset.tableName}`,
            documentation: {
              value: [
                `**Table: ${dataset.tableName}**`,
                '',
                `**Type:** ${dataset.fileType}`,
                `**Rows:** ${dataset.rowCount ? dataset.rowCount.toString() : 'Unknown'}`,
                `**Size:** ${dataset.size ? dataset.size.toString() : 'Unknown'}`,
                dataset.isInsertable ? '**Insertable:** Yes' : '**Insertable:** No'
              ].join('\n')
            },
            sortText: `0_${dataset.tableName}`, // Ensure tables appear first
            range: range,
          });
        });

        // Add common SQL keywords
        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
          'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
          'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE',
          'ALTER TABLE', 'INDEX', 'PRIMARY KEY', 'FOREIGN KEY',
          'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT',
          'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
          'ASC', 'DESC', 'LIMIT', 'OFFSET', 'AS', 'ON', 'USING'
        ];

        sqlKeywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            sortText: `1_${keyword}`, // Keywords appear after tables
            range: range,
          });
        });

        return {
          suggestions: suggestions
        };
      }
    });

    // Register hover provider for table information
    const hoverProvider = monaco.languages.registerHoverProvider('sql', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const dataset = datasets.find(d => d.tableName === word.word);
        if (!dataset) return;

        return {
          contents: [
            {
              value: [
                `**${dataset.tableName}**`,
                '',
                `**Type:** ${dataset.fileType}`,
                `**Rows:** ${dataset.rowCount ? dataset.rowCount.toString() : 'Unknown'}`,
                `**Size:** ${dataset.size ? dataset.size.toString() : 'Unknown'}`,
                dataset.isInsertable ? '**Insertable:** Yes' : '**Insertable:** No'
              ].join('\n')
            }
          ]
        };
      }
    });

    return () => {
      completionProvider.dispose();
      hoverProvider.dispose();
    };
  }, [monaco, datasets]);

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
            // Immediately sync on blur to ensure no pending changes are lost
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
              onQueryChange(query);
              lastSyncedQueryRef.current = query;
            }
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
          suggest: {
            showKeywords: true,
            showSnippets: false,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
            showConstants: true,
            showEnums: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showWords: true,
          },
        }}
      />
    </div>
  );
}
