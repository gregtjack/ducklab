import { useDuckDBStore } from "@/store/duckdb-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import { RefreshCcw } from "lucide-react";

function formatBytes(bytes: number | bigint, decimals = 2) {
  if (typeof bytes === "bigint") {
    bytes = Number(bytes);
  }
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function DuckDBStatus() {
  const { isLoading, error, memoryUsage, reset } = useDuckDBStore();

  return (
    <div className="flex flex-col gap-1 p-2 rounded-md hover:bg-accent">
      <Tooltip>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-xs">DuckDB</span>
          {isLoading && <span className="text-yellow-500">Initializing...</span>}
          {error && (
            <div className="flex items-center gap-1 justify-between w-full">
              <div className="flex items-center gap-1 text-red-500">
                <div className="size-2 rounded-full bg-red-500" />
                <span>Error</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Reset DuckDB"
                onClick={reset}
                className="size-4"
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          )}
          {!isLoading && !error && (
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-primary">
                <div className="size-2 rounded-full bg-primary" />
                <span>Ready</span>
              </div>
            </TooltipTrigger>
          )}
        </div>
        <TooltipContent>
          <p>DuckDB Memory Usage</p>
          <p className="text-xs text-primary-foreground">
            {memoryUsage !== null ? formatBytes(memoryUsage) : "Unknown"}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
