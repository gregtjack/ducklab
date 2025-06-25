import { create } from "zustand";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDuckDB, cleanupDuckDB } from "../lib/duckdb";
import {
  DuckDBConnectionError,
  DuckDBQueryError,
  DuckDBImportError,
  DuckDBExportError,
} from "@/lib/duckdb/errors";
import * as arrow from "apache-arrow";
import { match } from "ts-pattern";
import { type QueryResult } from "@/lib/types/query-result";
import { type ImportOptions } from "@/lib/types/files";
import { nanoid } from "nanoid";

const Log = {
  info: (message: string) => {
    console.log(`[DuckDBStore] ${message}`);
  },
  error: (message: string) => {
    console.error(`[DuckDBStore] ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[DuckDBStore] ${message}`);
  },
};

interface DuckDBState {
  db: duckdb.AsyncDuckDB | null;
  conn: duckdb.AsyncDuckDBConnection | null;
  isLoading: boolean;
  error: Error | null;
  errorHistory: Error[] | null;
  memoryUsage: number | null;
  initialize: () => Promise<void>;
  installExtensions: () => Promise<void>;
  updateMemoryUsage: () => Promise<void>;
  isDuckDBReady: () => boolean;
  waitForReady: () => Promise<void>;
  runQuery: <T extends arrow.TypeMap>(query: string, timeoutMs?: number) => Promise<QueryResult<T>>;
  registerFile: (name: string, file: File) => Promise<void>;
  registerURL: (name: string, url: string) => Promise<void>;
  importFile: (file: File, options: ImportOptions) => Promise<void>;
  importFromURL: (url: string, options: ImportOptions) => Promise<void>;
  importFromRegisteredFile: (fileName: string, options: ImportOptions) => Promise<void>;
  importCSV: (fileName: string, options: ImportOptions) => Promise<void>;
  importJSON: (fileName: string, options: ImportOptions) => Promise<void>;
  importParquet: (fileName: string, options: ImportOptions) => Promise<void>;
  importExcel: (fileName: string, options: ImportOptions) => Promise<void>;
  exportResults: (queryResult: QueryResult, format: "csv" | "parquet" | "json") => Promise<string>;
  exportTable: (tableName: string, format: "csv" | "parquet" | "json") => Promise<string>;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
  clearErrors: () => void;
}

// Helper function to add error to history
const addErrorToHistory = (error: Error, errorHistory: Error[] | null): Error[] => {
  const history = errorHistory || [];
  // Keep only last 10 errors to prevent memory issues
  return [...history.slice(-9), error];
};

// Helper function to check if DuckDB is ready with better error message
const ensureDuckDBReady = (
  db: duckdb.AsyncDuckDB | null,
  conn: duckdb.AsyncDuckDBConnection | null,
  operation: string,
): void => {
  if (!db || !conn) {
    throw new DuckDBConnectionError("DuckDB is not initialized", operation);
  }
};

export const useDuckDBStore = create<DuckDBState>((set, get) => ({
  db: null,
  conn: null,
  isLoading: true,
  error: null,
  errorHistory: null,
  memoryUsage: 0,

  initialize: async () => {
    try {
      Log.info("Initializing...");
      const database = await getDuckDB();
      const connection = await database.connect();

      set({ db: database, conn: connection, error: null });
      await get().installExtensions();

      const { updateMemoryUsage } = get();
      await updateMemoryUsage();
      Log.info("Initialization completed successfully");
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new DuckDBConnectionError("Failed to initialize DuckDB", "initialization");
      Log.error(`Initialization failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  installExtensions: async () => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "extension installation");

    try {
      Log.info("Installing extensions...");
      await conn!.query(`LOAD excel;`);
      Log.info("Extensions installed successfully");
    } catch (err) {
      const error = new DuckDBConnectionError(
        err instanceof Error ? err.message : "Failed to install extensions",
        "extension installation",
      );
      Log.error(`Extension installation failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  waitForReady: async () => {
    const { isDuckDBReady } = get();

    // If already ready, return immediately
    if (isDuckDBReady()) {
      return;
    }

    Log.info("Waiting for DuckDB to be ready...");

    // Wait for DuckDB to be ready with a timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const error = new DuckDBConnectionError(
          "Timeout waiting for DuckDB to be ready",
          "waiting",
        );
        Log.warn("Timeout waiting for DuckDB to be ready");
        reject(error);
      }, 30000); // 30 second timeout

      const checkReady = () => {
        if (isDuckDBReady()) {
          Log.info("DuckDB is now ready");
          clearTimeout(timeout);
          resolve();
        } else {
          // Check again in 100ms
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
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
      // Don't throw for memory usage errors, just log them
      Log.error(`Failed to get memory usage: ${err}`);
    }
  },

  isDuckDBReady: () => {
    const { db, conn, isLoading } = get();
    return !isLoading && db !== null && conn !== null;
  },

  runQuery: async <T extends arrow.TypeMap>(
    query: string,
    timeoutMs: number = 10000,
  ): Promise<QueryResult<T>> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "query execution");

    try {
      const start = performance.now();

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new DuckDBQueryError(`Query timed out after ${timeoutMs}ms`, query));
        }, timeoutMs);
      });

      // Race between query and timeout
      const result = (await Promise.race([conn!.query<T>(query), timeoutPromise])) as arrow.Table;

      const end = performance.now();
      const queryDuration = end - start;

      set({ error: null });

      return {
        query,
        table: result,
        duration: queryDuration,
      };
    } catch (err) {
      const error =
        err instanceof DuckDBQueryError
          ? err
          : new DuckDBQueryError(err instanceof Error ? err.message : "Failed to run query", query);
      Log.error(`Query execution failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  registerFile: async (name: string, file: File): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "file registration");

    try {
      await db!.registerFileHandle(name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
      Log.info(`File registered successfully: ${name}`);
    } catch (err) {
      const error = new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to register file",
        undefined,
        name,
      );
      Log.error(`File registration failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  registerURL: async (name: string, url: string): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "URL registration");

    try {
      await db!.registerFileURL(name, url, duckdb.DuckDBDataProtocol.HTTP, false);
      Log.info(`URL registered successfully: ${name}`);
    } catch (err) {
      const error = new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to register URL",
        undefined,
        name,
      );
      Log.error(`URL registration failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  importFile: async (file: File, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "file import");

    try {
      const fileName = `${options.format}_${Date.now()}_${file.name}`;
      Log.info(`Importing file: ${file.name} as ${fileName}`);

      // Register the file
      await db!.registerFileHandle(
        fileName,
        file,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true,
      );

      // Import based on format
      await get().importFromRegisteredFile(fileName, options);
      await get().updateMemoryUsage();
      Log.info(`File imported successfully: ${file.name}`);
    } catch (err) {
      const error = new DuckDBImportError(
        err instanceof Error ? err.message : `Failed to import ${options.format} file`,
        options.format,
        file.name,
      );
      Log.error(`File import failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  importFromURL: async (url: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "URL import");

    try {
      const fileName = `${options.format}_url_${nanoid()}`;
      Log.info(`Importing from URL: ${url} as ${fileName}`);

      // Register the URL
      await db!.registerFileURL(fileName, url, duckdb.DuckDBDataProtocol.HTTP, false);

      // Import based on format
      await get().importFromRegisteredFile(fileName, options);
      await get().updateMemoryUsage();
      Log.info(`URL import completed successfully: ${url}`);
    } catch (err) {
      const error = new DuckDBImportError(
        err instanceof Error ? err.message : `Failed to import ${options.format} from URL`,
        options.format,
        url,
      );
      Log.error(`URL import failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  // Helper method to import from already registered file
  importFromRegisteredFile: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "registered file import");

    try {
      match(options.format)
        .with("csv", () => get().importCSV(fileName, options))
        .with("json", () => get().importJSON(fileName, options))
        .with("parquet", () => get().importParquet(fileName, options))
        .with("excel", () => get().importExcel(fileName, options))
        .otherwise(() => {
          throw new DuckDBImportError(
            `Unsupported file format: ${options.format}`,
            options.format,
            fileName,
          );
        });
    } catch (err) {
      // Re-throw if it's already a DuckDBImportError, otherwise wrap it
      if (err instanceof DuckDBImportError) {
        throw err;
      }
      throw new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to import from registered file",
        options.format,
        fileName,
      );
    }
  },

  importCSV: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "CSV import");

    try {
      await conn!.insertCSVFromPath(fileName, {
        schema: "main",
        name: options.tableName,
        delimiter: options.delimiter,
        header: options.header,
        detect: true,
        dateFormat: "auto",
      });
      Log.info(`CSV imported successfully to table: ${options.tableName}`);
    } catch (err) {
      throw new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to import CSV",
        "csv",
        fileName,
      );
    }
  },

  importJSON: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "JSON import");

    try {
      const jsonOptions = [];
      if (options.jsonFormat && options.jsonFormat !== "auto") {
        jsonOptions.push(`format='${options.jsonFormat}'`);
      }

      const optionsString = jsonOptions.length > 0 ? `, ${jsonOptions.join(", ")}` : "";

      await conn!.query(`
        CREATE TABLE ${options.tableName} AS 
        SELECT * FROM read_json('${fileName}'${optionsString});
      `);

      Log.info(`JSON imported successfully to table: ${options.tableName}`);
    } catch (err) {
      throw new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to import JSON",
        "json",
        fileName,
      );
    }
  },

  importParquet: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "Parquet import");

    try {
      await conn!.query(`
        CREATE TABLE ${options.tableName} AS 
        SELECT * FROM read_parquet('${fileName}');
      `);
      Log.info(`Parquet imported successfully to table: ${options.tableName}`);
    } catch (err) {
      throw new DuckDBImportError(
        err instanceof Error ? err.message : "Failed to import Parquet",
        "parquet",
        fileName,
      );
    }
  },

  importExcel: async (fileName: string): Promise<void> => {
    throw new DuckDBImportError("Excel import is not supported in DuckDB WASM", "excel", fileName);
  },

  exportTable: async (tableName: string, format: "csv" | "parquet" | "json"): Promise<string> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "table export");

    try {
      const runQuery = get().runQuery;
      const fileName = `table_${tableName}_${nanoid()}.${format}`;

      Log.info(`Exporting table ${tableName} to ${format} format`);
      await runQuery(`COPY ${tableName} TO '${fileName}';`);

      const buffer = await db!.copyFileToBuffer(fileName);

      if (!buffer) {
        throw new DuckDBExportError("Failed to read exported file buffer", format, tableName);
      }

      Log.info(`Table exported successfully: ${tableName}`);
      return URL.createObjectURL(new Blob([buffer]));
    } catch (err) {
      const error =
        err instanceof DuckDBExportError
          ? err
          : new DuckDBExportError(
              err instanceof Error ? err.message : "Failed to export table",
              format,
              tableName,
            );
      Log.error(`Table export failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  exportResults: async (
    queryResult: QueryResult,
    format: "csv" | "parquet" | "json",
  ): Promise<string> => {
    const { db, conn } = get();
    ensureDuckDBReady(db, conn, "results export");

    try {
      const runQuery = get().runQuery;
      const { query } = queryResult;

      // Remove any trailing semicolon
      const strippedQuery = query.replace(/;\s*$/, "");
      // If there are multiple statements just execute the last one
      const lastQuery = strippedQuery.split(";").pop()?.trim();
      const fileName = `results_${nanoid()}.${format}`;

      Log.info(`Exporting query results to ${format} format`);
      await runQuery(`COPY (${lastQuery}) TO '${fileName}' (FORMAT ${format})`);

      const buffer = await db!.copyFileToBuffer(fileName);

      if (!buffer) {
        throw new DuckDBExportError("Failed to read exported results buffer", format);
      }

      Log.info(`Results exported successfully`);
      return URL.createObjectURL(new Blob([buffer]));
    } catch (err) {
      const error =
        err instanceof DuckDBExportError
          ? err
          : new DuckDBExportError(
              err instanceof Error ? err.message : "Failed to export results",
              format,
            );
      Log.error(`Results export failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  reset: async () => {
    const { db, conn } = get();
    if (!db) {
      throw new DuckDBConnectionError("DuckDB is not initialized", "reset");
    }

    try {
      Log.info("Resetting database...");
      await conn?.close();
      await db.reset();

      // Re-establish the connection
      const connection = await db.connect();

      set({
        conn: connection,
        memoryUsage: null,
        error: null,
      });
      Log.info("Database reset completed successfully");
    } catch (err) {
      const error = new DuckDBConnectionError(
        err instanceof Error ? err.message : "Failed to reset database",
        "reset",
      );
      Log.error(`Database reset failed: ${error.message}`);
      set({
        error,
        errorHistory: addErrorToHistory(error, get().errorHistory),
      });
      throw error;
    }
  },

  cleanup: async () => {
    try {
      Log.info("Cleaning up...");
      // Clear the memory usage interval
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interval = (window as any).__duckdb_memory_interval;
      if (interval) {
        clearInterval(interval);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__duckdb_memory_interval;
      }

      await cleanupDuckDB().catch(console.error);

      set({
        db: null,
        conn: null,
        memoryUsage: null,
        error: null,
      });
      Log.info("Cleanup completed successfully");
    } catch (err) {
      Log.error(`Cleanup failed: ${err}`);
    }
  },

  clearErrors: () => {
    set({ error: null, errorHistory: null });
  },
}));
