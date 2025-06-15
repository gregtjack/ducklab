"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { useDuckDBStore } from "../../store/duckdb-store";
import { QueryEditor } from "./query-editor";
import { QueryResults } from "./query-results";
import { Button } from "../ui/button";
import { Loader2, Play, Trash2 } from "lucide-react";
import { useNotebook } from "./notebook-context";
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface NotebookCellProps {
  cellId: string;
  index: number;
}

const MIN_CELL_HEIGHT = 125;
const MAX_CELL_HEIGHT = 900;

interface UseResizeProps {
  initialHeight: number;
  onResize: (height: number) => void;
}

const useResize = ({ initialHeight, onResize }: UseResizeProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const previewHeightRef = useRef<number | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = initialHeight;
    let newHeight = startHeight;
    setShowPreview(true);
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      newHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, startHeight + delta));
      previewHeightRef.current = newHeight;
      requestAnimationFrame(() => {
        if (cellRef.current) {
          const previewLine = document.getElementById("preview-line");
          if (previewLine) {
            previewLine.style.top = `${cellRef.current.getBoundingClientRect().top + newHeight}px`;
          }
        }
      });
    };

    const handleMouseUp = () => {
      onResize(newHeight);
      setShowPreview(false);
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return {
    cellRef,
    showPreview,
    previewHeightRef,
    handleResizeStart,
  };
};

const NotebookCell = memo(({ cellId, index }: NotebookCellProps) => {
  const { activeNotebook, updateCell, removeCell } = useNotebook();
  const { runQuery } = useDuckDBStore();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cellHeight, setCellHeight] = useState(200);

  const { cellRef, showPreview, previewHeightRef, handleResizeStart } = useResize({
    initialHeight: cellHeight,
    onResize: setCellHeight,
  });

  const cell = activeNotebook?.cells.find(c => c.id === cellId);

  if (!cell || !activeNotebook) return null;

  const handleRunQuery = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await runQuery(cell.query);
      await updateCell(activeNotebook.id, cellId, {
        results: result,
        error: null,
      });
      const numRows = result.table.numRows;
      const newHeight = Math.min(Math.max(MIN_CELL_HEIGHT + 100, numRows * 30 + 100), 500);
      setCellHeight(newHeight);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      await updateCell(activeNotebook.id, cellId, {
        error: errorMessage,
        results: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleRunQuery();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cellId, activeNotebook?.id, handleRunQuery, isEditing]);

  const handleDeleteCell = () => {
    removeCell(activeNotebook.id, cellId);
  };

  return (
    <div className="flex flex-col transition-transform duration-300" ref={cellRef}>
      <div className="flex w-full gap-2 min-w-0">
        <div className="flex flex-col h-fit items-center gap-2 flex-shrink-0">
          <div className="text-sm text-muted-foreground font-mono">{index + 1}</div>
          <TooltipProvider delayDuration={700}>
            <div className="inline-flex flex-col border -space-x-px rounded-sm bg-background shadow-xs rtl:space-x-reverse">
              <TooltipPrimitive.Root>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRunQuery}
                    disabled={isRunning}
                    variant="ghost"
                    className="rounded-none size-8 shadow-none first:rounded-t-sm hover:bg-accent last:rounded-b-sm focus-visible:z-10"
                  >
                    {isRunning ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Run Query <span className="text-xs font-mono ml-1 p-0.5">(Ctrl+Enter)</span>
                </TooltipContent>
              </TooltipPrimitive.Root>
              <TooltipPrimitive.Root>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDeleteCell}
                    variant="ghost"
                    className="rounded-none size-8 shadow-none hover:text-red-500 hover:bg-accent first:rounded-t-sm last:rounded-b-sm focus-visible:z-10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Delete Cell</TooltipContent>
              </TooltipPrimitive.Root>
            </div>
          </TooltipProvider>
        </div>
        <div className="flex flex-col flex-1 min-w-0" style={{ height: `${cellHeight}px` }}>
          <ResizablePanelGroup
            direction="vertical"
            className={cn(
              "border rounded-sm shadow-md bg-card text-card-foreground h-full w-full overflow-hidden transition-colors",
              isEditing ? "border-primary ring-2 ring-primary/25" : "",
            )}
            id={`cell-${cellId}`}
          >
            <ResizablePanel
              id="editor"
              minSize={25}
              defaultSize={100}
              order={1}
              className="border-t"
            >
              <QueryEditor
                initialQuery={cell.query}
                onQueryChange={(query: string) => updateCell(activeNotebook.id, cellId, { query })}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
              />
            </ResizablePanel>
            {(cell.results || error) && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="results"
                  className="border-t overflow-hidden"
                  minSize={25}
                  defaultSize={200}
                  order={2}
                >
                  <QueryResults
                    results={cell.results || null}
                    isLoading={isRunning}
                    error={error ? new Error(error) : null}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
      <div
        className="h-4 flex items-center justify-center w-full cursor-row-resize opacity-20 hover:opacity-100 relative"
        onMouseDown={handleResizeStart}
      >
        <div className="h-0.5 w-10 cursor-row-resize bg-primary rounded-full" />
      </div>
      {showPreview && (
        <div
          id="preview-line"
          className="fixed left-0 right-0 h-px bg-primary/50 pointer-events-none z-20"
          style={{
            top: `${cellRef.current?.getBoundingClientRect().top ?? 0 + (previewHeightRef.current ?? 0)}px`,
          }}
        />
      )}
    </div>
  );
});

NotebookCell.displayName = "NotebookCell";

export { NotebookCell };
