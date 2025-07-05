import { useDuckDBStore } from "@/store/duckdb-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import prettyBytes from "pretty-bytes";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "@/components/settings/section-header";

export const Route = createFileRoute("/settings/duckdb")({
  component: DuckDBSettings,
});

export function DuckDBSettings() {
  const {
    isLoading,
    error,
    errorHistory,
    memoryUsage,
    reset,
    updateMemoryUsage,
    conn,
    waitForReady,
  } = useDuckDBStore();

  const [loadingVersion, setLoadingVersion] = useState(false);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      await waitForReady();
      const result = await conn?.query("SELECT version()");
      const version = result?.get(0)?.toArray()[0] as string;
      setVersion(version);
    };

    setLoadingVersion(true);
    fetchVersion().then(() => {
      setLoadingVersion(false);
    });
  }, []);

  const getStatusText = () => {
    if (isLoading) return "Initializing...";
    if (error) return "Error";
    return "Ready";
  };

  const getStatusColor = () => {
    if (isLoading) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    if (error) return "bg-red-500/10 text-red-600 dark:text-red-400";
    return "bg-green-500/10 text-green-600 dark:text-green-400";
  };

  return (
    <section id="duckdb" className="space-y-4">
      <SectionHeader title="DuckDB" fragment="duckdb" />
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Status</h2>
        <Badge className={getStatusColor()}>{getStatusText()}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Memory Usage</span>
          </div>
          <span className="text-sm font-mono">
            {memoryUsage !== null ? prettyBytes(Number(memoryUsage)) : "0 B"}
          </span>
        </div>
      </div>

      {error && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="font-medium text-destructive">Recent error</span>
          </div>
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error.message}
          </p>
        </div>
      )}

      {errorHistory && errorHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">Error History</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {errorHistory.map((err, i) => (
              <p
                key={i}
                className="text-sm text-destructive bg-destructive/5 px-2 py-1 rounded text-wrap"
              >
                {err.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 space-y-1 flex-col">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => updateMemoryUsage()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Memory Usage
          </Button>
          <Button variant="destructive" onClick={() => reset()} disabled={isLoading}>
            <Database className="h-4 w-4 mr-2" />
            Reset Database
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Warning: Resetting the database will clear all data and tables.
        </p>
      </div>

      {loadingVersion ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine:</span>
                <span>DuckDB WebAssembly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage:</span>
                <span>In-Memory</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>{version}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
