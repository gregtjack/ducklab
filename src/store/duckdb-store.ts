import { create } from "zustand";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDB, cleanupDB, DuckDBError } from "../lib/duckdb";
import * as arrow from "apache-arrow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T extends arrow.TypeMap = any> = {
  query: string;
  table: arrow.Table<T>;
  duration: number;
};

export type FileFormat = "csv" | "json" | "parquet" | "arrow";

export interface ImportOptions {
  tableName: string;
  format: FileFormat;
  // CSV specific options
  delimiter?: string;
  header?: boolean;
  autoDetect?: boolean;
  sampleSize?: number;
  // JSON specific options
  jsonFormat?: "auto" | "newline_delimited" | "records";
  // Parquet specific options
  compression?: string;
  // Arrow specific options
  arrowSchema?: arrow.Schema;
}

interface DuckDBState {
  db: duckdb.AsyncDuckDB | null;
  conn: duckdb.AsyncDuckDBConnection | null;
  isLoading: boolean;
  error: Error | null;
  errorHistory: Error[] | null;
  memoryUsage: number | null;
  initialize: () => Promise<void>;
  updateMemoryUsage: () => Promise<void>;
  runQuery: <T extends arrow.TypeMap>(query: string, timeoutMs?: number) => Promise<QueryResult<T>>;
  registerFile: (name: string, file: File) => Promise<void>;
  registerURL: (name: string, url: string) => Promise<void>;
  importFile: (file: File, options: ImportOptions) => Promise<void>;
  importFromURL: (url: string, options: ImportOptions) => Promise<void>;
  importFromRegisteredFile: (fileName: string, options: ImportOptions) => Promise<void>;
  importCSV: (fileName: string, options: ImportOptions) => Promise<void>;
  buildJSONImportQuery: (fileName: string, options: ImportOptions) => string;
  importParquet: (fileName: string, options: ImportOptions) => Promise<void>;
  buildArrowImportQuery: (fileName: string, options: ImportOptions) => string;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export const useDuckDBStore = create<DuckDBState>((set, get) => ({
  db: null,
  conn: null,
  isLoading: true,
  error: null,
  errorHistory: null,
  memoryUsage: null,

  initialize: async () => {
    try {
      const database = await getDB();
      const connection = await database.connect();

      set({ db: database, conn: connection, error: null });

      const { updateMemoryUsage } = get();
      await updateMemoryUsage();
    } catch (err) {
      set({
        error: err instanceof Error ? err : new DuckDBError("Failed to initialize DuckDB"),
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
        "SELECT sum(memory_usage_bytes) as usage FROM duckdb_memory()",
      );

      const usage = result.get(0)?.usage as number;
      set({ memoryUsage: usage });
    } catch (err) {
      console.error("Failed to get memory usage:", err);
    }
  },

  runQuery: async <T extends arrow.TypeMap>(
    query: string,
    timeoutMs: number = 30000,
  ): Promise<QueryResult<T>> => {
    const { db, conn, updateMemoryUsage } = get();

    if (!db || !conn) {
      throw new DuckDBError("DuckDB is not initialized.");
    }

    try {
      const start = performance.now();

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race between query and timeout
      const result = (await Promise.race([conn.query<T>(query), timeoutPromise])) as arrow.Table;

      const end = performance.now();
      const queryDuration = end - start;

      set({ error: null });
      await updateMemoryUsage();

      return {
        query,
        table: result,
        duration: queryDuration,
      };
    } catch (err) {
      console.error("A DuckDB error occurred", err);
      set({
        error: err instanceof Error ? err : new DuckDBError("Failed to run query"),
        errorHistory: [
          ...(get().errorHistory || []),
          err instanceof Error ? err : new DuckDBError("Failed to run query"),
        ],
      });
      throw err;
    }
  },

  registerFile: async (name: string, file: File): Promise<void> => {
    const { db } = get();
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      await db.registerFileHandle(name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
    } catch (err) {
      throw new DuckDBError(err instanceof Error ? err.message : "Failed to register file");
    }
  },

  registerURL: async (name: string, url: string): Promise<void> => {
    const { db } = get();
    if (!db) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      await db.registerFileURL(name, url, duckdb.DuckDBDataProtocol.HTTP, false);
    } catch (err) {
      throw new DuckDBError(err instanceof Error ? err.message : "Failed to register URL");
    }
  },

  importFile: async (file: File, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    if (!db || !conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      const fileName = `${options.format}_${Date.now()}_${file.name}`;

      // Register the file
      await db.registerFileHandle(fileName, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

      // Import based on format
      await get().importFromRegisteredFile(fileName, options);
      await get().updateMemoryUsage();
    } catch (err) {
      throw new DuckDBError(err instanceof Error ? err.message : `Failed to import ${options.format} file`);
    }
  },

  importFromURL: async (url: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    if (!db || !conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    try {
      const fileName = `${options.format}_url_${Date.now()}`;

      // Register the URL
      await db.registerFileURL(fileName, url, duckdb.DuckDBDataProtocol.HTTP, false);

      // Import based on format
      await get().importFromRegisteredFile(fileName, options);
      await get().updateMemoryUsage();
    } catch (err) {
      throw new DuckDBError(err instanceof Error ? err.message : `Failed to import ${options.format} from URL`);
    }
  },

  // Helper method to import from already registered file
  importFromRegisteredFile: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    switch (options.format) {
      case "csv":
        await get().importCSV(fileName, options);
        break;
      case "json":
        // await get().importJSON(fileName, options);
        break;
      case "parquet":
        await get().importParquet(fileName, options);
        break;
      case "arrow":
        // await get().importArrow(fileName, options);
        break;
      default:
        throw new DuckDBError(`Unsupported file format: ${options.format}`);
    }
  },

  importCSV: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    await conn.insertCSVFromPath(fileName, {
      schema: 'main',
      name: options.tableName,
      delimiter: options.delimiter,
      header: options.header,
      detect: options.autoDetect,
      dateFormat: 'auto',
    });
  },

  buildJSONImportQuery: (fileName: string, options: ImportOptions): string => {
    const jsonOptions = [];
    if (options.jsonFormat && options.jsonFormat !== "auto") {
      jsonOptions.push(`format='${options.jsonFormat}'`);
    }

    const optionsString = jsonOptions.length > 0 ? `(${jsonOptions.join(', ')})` : '';

    return `
      CREATE TABLE ${options.tableName} AS 
      SELECT * FROM read_json('${fileName}'${optionsString})
    `;
  },

  importParquet: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    await conn.query(`
      CREATE TABLE ${options.tableName} AS 
      SELECT * FROM read_parquet('${fileName}');
    `);
  },

  buildArrowImportQuery: (fileName: string, options: ImportOptions): string => {
    // For Arrow files, we'll use the read_parquet function as a placeholder
    // since DuckDB doesn't have a direct read_arrow function
    // In a real implementation, you might need to convert Arrow to Parquet first
    return `
      CREATE TABLE ${options.tableName} AS 
      SELECT * FROM read_parquet('${fileName}')
    `;
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

  cleanup: async () => {
    // Clear the memory usage interval
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interval = (window as any).__duckdb_memory_interval;
    if (interval) {
      clearInterval(interval);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
