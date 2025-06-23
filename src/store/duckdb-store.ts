import { create } from "zustand";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDuckDB, cleanupDuckDB } from "../lib/duckdb";
import { DuckDBError } from "@/lib/types/duckdb";
import * as arrow from "apache-arrow";
import { match } from "ts-pattern";
import { type QueryResult } from "@/lib/types/query-result";
import { type ImportOptions } from "@/lib/types/fs";
import { nanoid } from "nanoid";

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
  exportResults: (queryResult: QueryResult, format: "csv" | "parquet") => Promise<string>;
  exportTable: (tableName: string, format: "csv" | "parquet" | "json") => Promise<string>;
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
      const database = await getDuckDB();
      const connection = await database.connect();

      set({ db: database, conn: connection, error: null });
      await get().installExtensions();

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

  installExtensions: async () => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }
    await conn.query(`LOAD excel;`);
  },

  waitForReady: async () => {
    const { isDuckDBReady } = get();

    // If already ready, return immediately
    if (isDuckDBReady()) {
      return;
    }

    console.log("Waiting for DuckDB to be ready...");

    // Wait for DuckDB to be ready with a timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("Timeout waiting for DuckDB to be ready");
        reject(new Error("Timeout waiting for DuckDB to be ready"));
      }, 30000); // 30 second timeout

      const checkReady = () => {
        if (isDuckDBReady()) {
          console.log("DuckDB is now ready");
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
      console.error("Failed to get memory usage:", err);
    }
  },

  isDuckDBReady: () => {
    const { db, conn, isLoading } = get();
    return !isLoading && db !== null && conn !== null;
  },

  runQuery: async <T extends arrow.TypeMap>(
    query: string,
    timeoutMs: number = 30000,
  ): Promise<QueryResult<T>> => {
    const { db, conn } = get();

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
      await db.registerFileHandle(
        fileName,
        file,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true,
      );

      // Import based on format
      await get().importFromRegisteredFile(fileName, options);
      await get().updateMemoryUsage();
    } catch (err) {
      throw new DuckDBError(
        err instanceof Error ? err.message : `Failed to import ${options.format} file`,
      );
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
      throw new DuckDBError(
        err instanceof Error ? err.message : `Failed to import ${options.format} from URL`,
      );
    }
  },

  // Helper method to import from already registered file
  importFromRegisteredFile: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    match(options.format)
      .with("csv", () => get().importCSV(fileName, options))
      .with("json", () => get().importJSON(fileName, options))
      .with("parquet", () => get().importParquet(fileName, options))
      .with("excel", () => get().importExcel(fileName, options))
      .otherwise(() => {
        throw new DuckDBError(`Unsupported file format: ${options.format}`);
      });
  },

  importCSV: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    await conn.insertCSVFromPath(fileName, {
      schema: "main",
      name: options.tableName,
      delimiter: options.delimiter,
      header: options.header,
      detect: true,
      dateFormat: "auto",
    });
  },

  importJSON: async (fileName: string, options: ImportOptions): Promise<void> => {
    const { conn } = get();
    if (!conn) {
      throw new DuckDBError("DuckDB is not ready yet.");
    }

    const jsonOptions = [];
    if (options.jsonFormat && options.jsonFormat !== "auto") {
      jsonOptions.push(`format='${options.jsonFormat}'`);
    }

    const optionsString = jsonOptions.length > 0 ? `, ${jsonOptions.join(", ")}` : "";

    await conn.query(`
      CREATE TABLE ${options.tableName} AS 
      SELECT * FROM read_json('${fileName}'${optionsString});
    `);
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

  importExcel: async (fileName: string, options: ImportOptions): Promise<void> => {
    throw new DuckDBError("Excel import is not supported.");

    // await conn.query(`
    //   CREATE TABLE ${options.tableName} AS (SELECT * FROM read_xlsx('${fileName}'${buildOptions()}));
    // `);

    // the above doesn't seem to work, even with the excel extension installed.
    // not sure if DuckDB WASM supports excel import the same as on other platforms.
    // Maybe convert the excel file to csv first?
  },

  exportTable: async (tableName: string, format: "csv" | "parquet" | "json"): Promise<string> => {
    const runQuery = get().runQuery;

    const fileName = `table_${tableName}_${nanoid()}.${format}`;

    await runQuery(`COPY ${tableName} TO '${fileName}';`);

    const buffer = await get().db?.copyFileToBuffer(fileName);

    if (!buffer) {
      throw new DuckDBError("Failed to export table.");
    }

    return URL.createObjectURL(new Blob([buffer]));
  },

  exportResults: async (queryResult: QueryResult, format: "csv" | "parquet"): Promise<string> => {
    const runQuery = get().runQuery;

    const { query } = queryResult;

    // Remove any trailing semicolon
    const strippedQuery = query.replace(/;\s*$/, "");
    // If there are multiple statements just execute the last one
    const lastQuery = strippedQuery.split(";").pop()?.trim();
    const fileName = `results_${nanoid()}.${format}`;

    await runQuery(`COPY (${lastQuery}) TO '${fileName}' (FORMAT ${format})`);

    const buffer = await get().db?.copyFileToBuffer(fileName);

    if (!buffer) {
      throw new DuckDBError("Failed to export results.");
    }

    return URL.createObjectURL(new Blob([buffer]));
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

    await cleanupDuckDB().catch(console.error);

    set({
      db: null,
      conn: null,
      memoryUsage: null,
      error: null,
    });
  },
}));
