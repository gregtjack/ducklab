"use client";

import React, { useState, useEffect } from "react";
import { useDuckDBStore } from "../../store/duckdb-store";
import { QueryEditor } from "./query-editor";
import { QueryResults } from "./query-results";
import { Button } from "../ui/button";
import { Loader2, Play, Trash2 } from "lucide-react";
import { useNotebook } from "./notebook-context";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface NotebookCellProps {
  cellId: string;
  index: number;
}

const MIN_CELL_HEIGHT = 125;
const MAX_CELL_HEIGHT = 500;

export function NotebookCell({ cellId, index }: NotebookCellProps) {
  const { activeNotebook, updateCell, removeCell } = useNotebook();
  const { runQuery } = useDuckDBStore();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cellHeight, setCellHeight] = useState(200);

  const cell = activeNotebook?.cells.find((c) => c.id === cellId);

  if (!cell || !activeNotebook) return null;

  const handleRunQuery = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await runQuery(cell.query);
      console.log(result);
      await updateCell(activeNotebook.id, cellId, {
        results: result,
        error: null,
      });
      // Set cell height based on number of rows, with min 200px and max 500px
      const numRows = result.table.numRows;
      const newHeight = Math.min(
        Math.max(MIN_CELL_HEIGHT + 100, numRows * 30 + 100),
        MAX_CELL_HEIGHT
      );
      setCellHeight(newHeight);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
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
    <div className="flex flex-col transition-transform duration-300">
      <div className="flex w-full gap-2 min-w-0">
        <div className="flex flex-col h-fit items-center gap-2 flex-shrink-0">
          <div className="text-sm text-muted-foreground font-mono">
            {index + 1}
          </div>
          <TooltipProvider delayDuration={700}>
            <div className="inline-flex flex-col border -space-x-px rounded-sm bg-gray-50 dark:bg-neutral-900 shadow-xs rtl:space-x-reverse">
              <TooltipPrimitive.Root>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRunQuery}
                    disabled={isRunning}
                    variant="ghost"
                    className="rounded-none size-8 shadow-none first:rounded-t-sm last:rounded-b-sm focus-visible:z-10"
                  >
                    {isRunning ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Run Query{" "}
                  <span className="text-xs font-mono ml-1 p-0.5">
                    (Ctrl+Enter)
                  </span>
                </TooltipContent>
              </TooltipPrimitive.Root>
              <TooltipPrimitive.Root>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDeleteCell}
                    variant="ghost"
                    className="rounded-none size-8 shadow-none hover:text-red-500 first:rounded-t-sm last:rounded-b-sm focus-visible:z-10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Delete Cell</TooltipContent>
              </TooltipPrimitive.Root>
            </div>
          </TooltipProvider>
        </div>
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ height: `${cellHeight}px` }}
        >
          <ResizablePanelGroup
            direction="vertical"
            className={cn(
              "border rounded-sm shadow-md bg-card text-card-foreground h-full w-full overflow-hidden transition-colors",
              isEditing ? "border-primary ring-2 ring-primary/25" : ""
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
                onQueryChange={(query: string) =>
                  updateCell(activeNotebook.id, cellId, { query })
                }
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
              />
            </ResizablePanel>
            {cell.results && (
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
                    results={cell.results}
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
        className="h-4 flex items-center justify-center w-full cursor-row-resize opacity-20 hover:opacity-100"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = cellHeight;
          const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientY - startY;
            const newHeight = Math.max(
              MIN_CELL_HEIGHT,
              Math.min(MAX_CELL_HEIGHT, startHeight + delta)
            );
            setCellHeight(newHeight);
          };
          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };
          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      >
        <div className="h-0.5 w-10 cursor-row-resize bg-primary rounded-full" />
      </div>
    </div>
  );
}
