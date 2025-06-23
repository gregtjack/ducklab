"use client";

import { QueryResultTable } from "./query-result-table";
import prettyMs from "pretty-ms";
import { DownloadIcon, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { type QueryResult } from "@/lib/types/query-result";
import { useDuckDBStore } from "@/store/duckdb-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "../ui/button";

interface QueryResultsProps {
  results: QueryResult | null;
  isLoading: boolean;
  error: Error | null;
}

export function QueryResults({ results, isLoading, error }: QueryResultsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { exportResults } = useDuckDBStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <p className="text-red-500 font-mono text-sm p-2">{error.message}</p>
      </div>
    );
  }

  if (!results || results.table.numRows === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No results to display</p>
      </div>
    );
  }

  const handleOnExport = async (format: "csv" | "parquet") => {
    const url = await exportResults(results, format);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ducklab_query_results_${new Date().toISOString()}.${format}`;
    a.click();
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-30 bg-card" : ""}`}>
      <div className="h-12 text-muted-foreground flex px-2 items-center bg-card justify-between border-b">
        <h3 className="text-xs uppercase">Query Results</h3>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1 hover:bg-accent rounded-sm flex items-center gap-1"
                title="Export results"
              >
                <span className="text-xs">Export As</span>
                <DownloadIcon className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-24 p-1">
              <div className="flex flex-col gap-1">
                <Button variant="outline" className="w-full h-8 text-xs" onClick={() => handleOnExport("csv")}>CSV</Button>
                <Button variant="outline" className="w-full h-8 text-xs" onClick={() => handleOnExport("parquet")}>Parquet</Button>
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-accent rounded-sm"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>
      <QueryResultTable data={results.table} />
      <div className="border-t text-xs text-muted-foreground bg-card">
        <div className="flex items-center gap-1 p-1">
          <span className="italic">
            {results.table.numRows} row(s) in {prettyMs(results.duration, { compact: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
