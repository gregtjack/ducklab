import { useDuckDBStore } from "@/store/duckdb-store";
import { Button } from "./ui/button";
import { RefreshCcw, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

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
  const { isLoading, error, errorHistory, memoryUsage, reset } = useDuckDBStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col gap-1 p-2 rounded-md hover:bg-accent cursor-pointer">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="size-4"
                >
                  <RefreshCcw className="size-4" />
                </Button>
              </div>
            )}
            {!isLoading && !error && (
              <div className="flex items-center gap-1 text-green-500">
                <div className="size-2 rounded-full bg-green-500" />
                <span>Ready</span>
              </div>
            )}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-4" />
            DuckDB Status
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <span className="text-yellow-500">Initializing...</span>
              ) : error ? (
                <span className="text-red-500">Error</span>
              ) : (
                <span className="text-green-400">Ready</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Memory Usage</h4>
            <p className="text-sm font-mono">
              {memoryUsage !== null ? formatBytes(memoryUsage) : "Unknown"}
            </p>
          </div>
          {error && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Current Error</h4>
              <p className="text-sm text-red-500">{error.message}</p>
            </div>
          )}
          {errorHistory && errorHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Error History</h4>
              <div className="space-y-1">
                {errorHistory.map((err, i) => (
                  <p key={i} className="text-sm text-red-500">
                    {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="text-destructive">
          <Button variant="outline" onClick={reset}>
            Reset DuckDB
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
