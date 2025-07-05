"use client";

import { useEffect, useState } from "react";
import { DatabaseIcon, RefreshCcw, FilePlus2 } from "lucide-react";
import { useCatalogStore, Dataset } from "@/store/catalog-store";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FileUpload } from "./file-import";
import { DatasetDetailsDialog } from "./dataset-details-dialog";
import prettyBytes from "pretty-bytes";
import { format } from "d3-format";
import { Skeleton } from "../ui/skeleton";

function formatNumber(num: number | bigint): string {
  return num.toString();
}

export function CatalogList() {
  const { datasets, isLoading, error, refreshDatasets, startAutoSync, stopAutoSync } =
    useCatalogStore();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    refreshDatasets();
    startAutoSync();

    return () => {
      stopAutoSync();
    };
  }, [refreshDatasets, startAutoSync, stopAutoSync]);

  const handleDatasetClick = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 ml-auto" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-full text-center">
        <div className="flex flex-col items-center justify-center w-full border rounded-xl p-4">
          <RefreshCcw className="size-10 text-muted-foreground my-4" />
          <h3 className="text-lg text-card-foreground font-medium mb-2">Error loading tables</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refreshDatasets()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="uppercase text-xs text-muted-foreground">catalog</h3>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <FileUpload>
                <Button variant="ghost" size="icon" className="size-6">
                  <FilePlus2 className="size-4 text-muted-foreground" />
                </Button>
              </FileUpload>
            </TooltipTrigger>
            <TooltipContent>Open file</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {datasets.length === 0 ? (
          <div className="text-center">
            <FileUpload>
              <div className="hover:from-primary/15 hover:to-indigo-400/15 transition-colors hover:cursor-pointer flex flex-col items-center justify-center border border-primary/20 w-full rounded-lg p-4 bg-gradient-to-r from-primary/10 to-indigo-400/10">
                <DatabaseIcon className="size-10 text-primary my-4" />
                <h3 className="text-lg text-foreground font-medium mb-2">No tables</h3>
                <p className="text-sm  mb-2">Open a file to get started</p>
                <p className="text-xs text-muted-foreground mb-4">
                  CSV, Parquet, and JSON files are supported
                </p>
              </div>
            </FileUpload>
          </div>
        ) : (
          <div className="space-y-1">
            {datasets.map(dataset => (
              <Tooltip key={dataset.id} delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full rounded-md justify-start text-left cursor-pointer font-normal h-12 p-2"
                    onClick={() => handleDatasetClick(dataset)}
                  >
                    <div className="flex items-center w-full">
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{dataset.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {dataset.rowCount !== undefined
                            ? `${format(".2s")(Number(dataset.rowCount))} rows`
                            : ""}
                          {dataset.rowCount !== undefined && dataset.size > 0 ? " • " : ""}
                          {dataset.size > 0 ? prettyBytes(dataset.size) : ""}
                        </div>
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-mono">{dataset.name}</p>
                    {dataset.rowCount !== undefined && (
                      <p className="text-xs">{formatNumber(dataset.rowCount)} rows</p>
                    )}
                    {dataset.size > 0 && (
                      <p className="text-xs text-primary-foreground">{prettyBytes(dataset.size)}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      <DatasetDetailsDialog
        dataset={selectedDataset}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDataset(null);
        }}
      />
    </div>
  );
}
