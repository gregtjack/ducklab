import { useDuckDBStore } from "@/store/duckdb-store";
import { Button } from "./ui/button";
import { Info, DatabaseZap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import prettyBytes from "pretty-bytes";

export function DuckDBStatus() {
  const { isLoading, error, errorHistory, memoryUsage, reset } = useDuckDBStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <DatabaseZap />
          <span className="text-sm">DuckDB</span>
          {isLoading && <span className="text-yellow-500">Initializing...</span>}
        </Button>
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
              {memoryUsage !== null ? prettyBytes(Number(memoryUsage)) : "Unknown"}
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
