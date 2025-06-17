"use client";

import { useEffect } from "react";
import { DatabaseIcon, RefreshCcw, FilePlus2, FileSpreadsheetIcon } from "lucide-react";
import { useCatalogStore } from "@/store/catalog-store";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FileUpload } from "../file-upload";
import prettyBytes from "pretty-bytes";
import { format } from "d3-format";

function formatNumber(num: number | bigint): string {
  return num.toString();
}

export function CatalogList() {
  const { datasets, isLoading, error, refreshDatasets } = useCatalogStore();

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center h-full text-center px-4">
        <div className="flex flex-col items-center justify-center w-full p-4">
          <DatabaseIcon className="size-10 text-muted-foreground my-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-full text-center px-4">
        <div className="flex flex-col items-center justify-center w-full border rounded-xl p-4">
          <RefreshCcw className="size-10 text-muted-foreground my-4" />
          <h3 className="text-lg text-card-foreground font-medium mb-2">Error loading datasets</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message}
          </p>
          <Button onClick={() => refreshDatasets()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col ">
      <div className="px-3 py-2 flex items-center justify-between">
        <h3 className="text-xs text-muted-foreground uppercase">Catalog</h3>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <FileUpload>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                >
                  <FilePlus2 className="size-4 text-muted-foreground" />
                </Button>
              </FileUpload>
            </TooltipTrigger>
            <TooltipContent>Open file</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => refreshDatasets()}
              >
                <RefreshCcw className="size-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh datasets</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {datasets.length === 0 ? (
          <div className="flex flex-col items-center h-full text-center px-4">
            <div className="flex flex-col items-center justify-center w-full bg-gradient-to-br from-primary/15 to-secondary/10 rounded-xl p-4">
              <DatabaseIcon className="size-10 text-muted-foreground my-4" />
              <h3 className="text-lg text-card-foreground font-medium mb-2">No datasets</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open a file to get started
              </p>
              <FileUpload>
                <Button size="sm">
                  Open file
                  <FilePlus2 />
                </Button>
              </FileUpload>
            </div>
          </div>
        ) : (
          <div className="space-y-1 px-4">
            {datasets.map((dataset) => (
              <Tooltip key={dataset.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal h-12 p-2"
                  >
                    <div className="flex items-center w-full">
                      <FileSpreadsheetIcon className="size-4 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{dataset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {dataset.rowCount !== undefined ? `${format(".2s")(Number(dataset.rowCount))} rows` : ''}
                          {dataset.rowCount !== undefined && dataset.size > 0 ? ' • ' : ''}
                          {dataset.size > 0 ? prettyBytes(dataset.size) : ''}
                        </div>
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{dataset.name}</p>
                    <p className="text-xs text-primary-foreground">
                      {dataset.fileType} {dataset.isInsertable ? '(Insertable)' : '(Read-only)'}
                    </p>
                    {dataset.rowCount !== undefined && (
                      <p className="text-xs text-primary-foreground">
                        {formatNumber(dataset.rowCount)} rows
                      </p>
                    )}
                    {dataset.size > 0 && (
                      <p className="text-xs text-primary-foreground">
                        {prettyBytes(dataset.size)}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 