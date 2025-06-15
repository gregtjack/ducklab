import { create } from "zustand";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDB, cleanupDB, DuckDBError } from "../lib/duckdb";
import * as arrow from "apache-arrow";

export type QueryResult<T extends arrow.TypeMap = any> = {
  query: string;
  table: arrow.Table<T>;
  duration: number;
};

interface DuckDBState {
  db: duckdb.AsyncDuckDB | null;
  conn: duckdb.AsyncDuckDBConnection | null;
  isLoading: boolean;
  error: Error | null;
  memoryUsage: number | null;
  initialize: () => Promise<void>;
  updateMemoryUsage: () => Promise<void>;
  runQuery: <T extends arrow.TypeMap>(
    query: string,
    timeoutMs?: number
  ) => Promise<QueryResult<T>>;
  registerFile: (name: string, file: File) => Promise<void>;
  registerURL: (name: string, url: string) => Promise<void>;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export const useDuckDBStore = create<DuckDBState>((set, get) => ({
  db: null,
  conn: null,
  isLoading: true,
  error: null,
  memoryUsage: null,

  initialize: async () => {
    try {
      const database = await getDB();
      const connection = await database.connect();

      set({ db: database, conn: connection, error: null });

      const { updateMemoryUsage } = get();
      const interval = setInterval(updateMemoryUsage, 5000);
      await updateMemoryUsage();
      (window as any).__duckdb_memory_interval = interval;
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err
            : new DuckDBError("Failed to initialize DuckDB"),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMemoryUsage: async () => {
    const { conn } = get();
    if (!conn) return;
    try {
      const result = await conn.query(
        "SELECT sum(memory_usage_bytes) as usage FROM duckdb_memory()"
      );

      const usage = result.get(0)?.usage as number;
      set({ memoryUsage: usage });
    } catch (err) {
      console.error("Failed to get memory usage:", err);
    }
  },

  runQuery: async <T extends arrow.TypeMap>(
    query: string,
    timeoutMs: number = 30000
  ): Promise<QueryResult<T>> => {
    const { db, conn } = get();

    if (!db || !conn) {
      throw new DuckDBError("DuckDB is not initialized.");
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
  },

  reset: async () => {
    const { db, conn } = get();
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    await conn?.close();
    await db.reset();

    // Re-establish the connection
    const connection = await db.connect();
    set({
      conn: connection,
      memoryUsage: null,
      error: null,
    });
  },

  registerFile: async (name: string, file: File): Promise<void> => {
    const { db } = get();
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
  },

  registerURL: async (name: string, url: string): Promise<void> => {
    const { db } = get();
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
  },

  cleanup: async () => {
    // Clear the memory usage interval
    const interval = (window as any).__duckdb_memory_interval;
    if (interval) {
      clearInterval(interval);
      delete (window as any).__duckdb_memory_interval;
    }

    await cleanupDB().catch(console.error);
    set({
      db: null,
      conn: null,
      memoryUsage: null,
      error: null,
    });
  },
}));
