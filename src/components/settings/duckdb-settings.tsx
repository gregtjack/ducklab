import { useDuckDBStore } from "@/store/duckdb-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import prettyBytes from "pretty-bytes";
import { useEffect, useState } from "react";

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

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">DuckDB Settings</h3>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Database Status</CardTitle>
          <CardDescription>Current status and health of DuckDB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">Status</span>
            </div>
            <Badge className={getStatusColor()}>{getStatusText()}</Badge>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="font-medium">Memory Usage</span>
              </div>
              <span className="text-sm font-mono">
                {memoryUsage !== null ? prettyBytes(Number(memoryUsage)) : "0 B"}
              </span>
            </div>
          </div>

          {/* Error Display */}
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

          {/* Error History */}
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
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
          <CardDescription>Manage DuckDB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Configuration Info */}
      {loadingVersion ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Current DuckDB configuration details</CardDescription>
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
    </div>
  );
}
