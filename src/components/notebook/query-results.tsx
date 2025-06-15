"use client";

import { ArrowTable } from "../arrow-table";
import { QueryResult } from "@/lib/duckdb/provider";
import prettyMs from "pretty-ms";
import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

interface QueryResultsProps {
  results: QueryResult;
  isLoading: boolean;
  error: Error | null;
}

export function QueryResults({ results, isLoading, error }: QueryResultsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No results to display</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <p className="text-red-500 font-mono text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-30 bg-background" : ""}`}
    >
      <div className="h-12 text-muted-foreground flex px-2 items-center bg-card justify-between border-b">
        <h3 className="text-xs uppercase">Query Results</h3>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 hover:bg-accent rounded-sm"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>
      <ArrowTable data={results.table} />
      <div className="border-t text-xs text-muted-foreground bg-card">
        <div className="flex items-center gap-1 p-1">
          <span className="italic">
            {results.table.numRows} row(s) in{" "}
            {prettyMs(results.duration, { compact: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
