import React, { createContext, useContext, useEffect, useState } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDB, cleanupDB, DuckDBError } from "./index";
import * as arrow from "apache-arrow";

export type QueryResult<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends arrow.TypeMap = any,
> = {
  /**
   * The query.
   */
  query: string;
  /**
   * The result of the query.
   */
  table: arrow.Table<T>;
  /**
   * The duration of the query in milliseconds.
   */
  duration: number;
};

interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  isLoading: boolean;
  error: Error | null;
  runQuery: <T extends arrow.TypeMap>(query: string) => Promise<QueryResult<T>>;
  memoryUsage: number | null;
  registerFile: (name: string, file: File) => Promise<void>;
  registerURL: (name: string, url: string) => Promise<void>;
  reset: () => Promise<void>;
}

const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  isLoading: true,
  error: null,
  runQuery: async () => {
    throw new DuckDBError("Database is not initialized");
  },
  memoryUsage: null,
  registerFile: async () => {
    throw new DuckDBError("Database is not initialized");
  },
  registerURL: async () => {
    throw new DuckDBError("Database is not initialized");
  },
  reset: async () => {
    throw new DuckDBError("Database is not initialized");
  },
});

export const useDuckDB = () => {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error("useDuckDB must be used within a DuckDBProvider");
  }
  return context;
};

interface DuckDBProviderProps {
  children: React.ReactNode;
}

export const DuckDBProvider: React.FC<DuckDBProviderProps> = ({ children }) => {
  const [db, setDB] = useState<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    const initializeDuckDB = async () => {
      try {
        const database = await getDB();
        setDB(database);
        const connection = await database.connect();
        setConn(connection);
        setError(null);

        // Start monitoring memory usage
        const updateMemoryUsage = async () => {
          try {
            const result = await connection.query(
              "SELECT sum(memory_usage_bytes) as usage FROM duckdb_memory()"
            );
            const usage = result.get(0)?.usage as number;
            setMemoryUsage(usage);
          } catch (err) {
            console.error("Failed to get memory usage:", err);
            setError(
              err instanceof Error
                ? err
                : new DuckDBError("Failed to get memory usage")
            );
          }
        };

        // Update memory usage every 5 seconds
        const interval = setInterval(updateMemoryUsage, 5000);
        await updateMemoryUsage(); // Initial update

        return () => clearInterval(interval);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new DuckDBError("Failed to initialize DuckDB")
        );
      } finally {
        setIsLoading(false);
      }
    };

    void initializeDuckDB();

    return () => {
      cleanupDB().catch(console.error);
    };
  }, []);

  const runQuery = async <T extends arrow.TypeMap>(
    query: string,
    timeoutMs: number = 30000 // Default 30 second timeout
  ): Promise<QueryResult<T>> => {
    if (!db || !conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      let start = performance.now();

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race between query and timeout
      const result = (await Promise.race([
        conn.query<T>(query),
        timeoutPromise,
      ])) as arrow.Table;

      let end = performance.now();
      const queryDuration = end - start;

      return {
        query,
        table: result,
        duration: queryDuration,
      };
    } catch (err) {
      throw new Error(String(err), { cause: err });
    }
  };

  const reset = async () => {
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }
    console.log("resetting duckdb");
    await db.reset();

    // Reset the connection
    const connection = await db.connect();
    setConn(connection);

    // Reset the memory usage
    setMemoryUsage(null);

    // Reset the error
    setError(null);
  };

  const registerFile = async (name: string, file: File): Promise<void> => {
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      await db.registerFileHandle(
        name,
        file,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true
      );
    } catch (err) {
      throw new DuckDBError(
        err instanceof Error ? err.message : "Failed to register file"
      );
    }
  };

  const registerURL = async (name: string, url: string): Promise<void> => {
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      await db.registerFileURL(
        name,
        url,
        duckdb.DuckDBDataProtocol.HTTP,
        false
      );
    } catch (err) {
      throw new DuckDBError(
        err instanceof Error ? err.message : "Failed to register URL"
      );
    }
  };

  const value = {
    db,
    isLoading,
    error,
    runQuery,
    memoryUsage,
    registerFile,
    registerURL,
    reset,
  };

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
};
