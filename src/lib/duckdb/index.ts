import { type AsyncDuckDB } from "@duckdb/duckdb-wasm";

import * as duckdb from "@duckdb/duckdb-wasm";

export { DuckDBProvider, useDuckDB } from "./provider";

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

let DB: duckdb.AsyncDuckDB | null = null;
let worker: Worker | null = null;
let isInitializing = false;
let initializationError: Error | null = null;

export class DuckDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuckDBError";
  }
}

export async function initializeDB(): Promise<duckdb.AsyncDuckDB> {
  if (DB) {
    return DB;
  }

  if (isInitializing) {
    throw new DuckDBError("DuckDB is already initializing");
  }

  if (initializationError) {
    throw initializationError;
  }

  try {
    isInitializing = true;

    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    if (!bundle.mainWorker) {
      throw new DuckDBError("Failed to load DuckDB worker bundle");
    }

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: "text/javascript",
      })
    );

    // Instantiate the asynchronous version of DuckDB-Wasm
    worker = new window.Worker(worker_url);

    const logLevel =
      process.env.NODE_ENV === "development"
        ? duckdb.LogLevel.DEBUG
        : duckdb.LogLevel.ERROR;

    const logger = new duckdb.ConsoleLogger(logLevel);

    DB = new duckdb.AsyncDuckDB(logger, worker);
    await DB.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    return DB;
  } catch (error) {
    initializationError =
      error instanceof Error
        ? error
        : new DuckDBError("Failed to initialize DuckDB");
    throw initializationError;
  } finally {
    isInitializing = false;
  }
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!DB) {
    return await initializeDB();
  }
  return DB;
}

export async function cleanupDB(): Promise<void> {
  if (DB) {
    try {
      await DB.terminate();
    } catch (error) {
      console.error("Error terminating DuckDB:", error);
    }
    DB = null;
  }

  if (worker) {
    worker.terminate();
    worker = null;
  }

  initializationError = null;
  isInitializing = false;
}

export { AsyncDuckDB };
