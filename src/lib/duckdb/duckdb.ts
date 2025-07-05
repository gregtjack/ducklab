import * as duckdb from "@duckdb/duckdb-wasm";
import { DuckDBConnectionError } from "@/lib/duckdb/errors";

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

let DB: duckdb.AsyncDuckDB | null = null;
let worker: Worker | null = null;
let isInitializing = false;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

const timeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const validateEnvironment = () => {
  if (typeof window === "undefined") {
    throw new DuckDBConnectionError("Server-side not supported");
  }
  if (!window.Worker || !window.WebAssembly) {
    throw new DuckDBConnectionError("Browser not supported");
  }
};

const createWorker = async (bundle: duckdb.DuckDBBundle): Promise<Worker> => {
  if (!bundle.mainWorker) {
    throw new DuckDBConnectionError("Bundle missing worker");
  }

  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }),
  );

  const worker = new window.Worker(workerUrl);
  worker.onerror = event => {
    throw new DuckDBConnectionError(`Worker error: ${event.error?.message || "Unknown"}`);
  };

  return worker;
};

const initializeWithRetry = async (): Promise<duckdb.AsyncDuckDB> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      validateEnvironment();

      const bundle = await timeout(duckdb.selectBundle(JSDELIVR_BUNDLES), 10000);
      worker = await createWorker(bundle);

      const logger = new duckdb.ConsoleLogger(
        process.env.NODE_ENV === "development" ? duckdb.LogLevel.DEBUG : duckdb.LogLevel.ERROR,
      );

      DB = new duckdb.AsyncDuckDB(logger, worker);
      await timeout(DB.instantiate(bundle.mainModule, bundle.pthreadWorker), TIMEOUT_MS);

      const conn = await DB.connect();
      await timeout(conn.query("SELECT 1"), 5000);

      return DB;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (DB) {
        try {
          await DB.terminate();
        } catch {
          /* ignore */
        }
        DB = null;
      }
      if (worker) {
        try {
          worker.terminate();
        } catch {
          /* ignore */
        }
        worker = null;
      }

      if (
        error instanceof DuckDBConnectionError &&
        (error.message.includes("not supported") || error.message.includes("WebAssembly"))
      ) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt);
      }
    }
  }

  throw new DuckDBConnectionError(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`,
  );
};

export async function initializeDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (DB) return DB;
  if (isInitializing && initPromise) return initPromise;
  if (isInitializing) throw new DuckDBConnectionError("Already initializing");

  try {
    isInitializing = true;
    initPromise = initializeWithRetry();
    return await initPromise;
  } finally {
    isInitializing = false;
    initPromise = null;
  }
}

export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!DB) return await initializeDuckDB();

  // Health check
  try {
    const conn = await DB.connect();
    await timeout(conn.query("SELECT 1"), 2000);
    return DB;
  } catch {
    await cleanupDuckDB();
    return await initializeDuckDB();
  }
}

export async function cleanupDuckDB(): Promise<void> {
  if (DB) {
    try {
      await timeout(DB.terminate(), 5000);
    } catch {
      /* ignore */
    }
    DB = null;
  }
  if (worker) {
    try {
      worker.terminate();
    } catch {
      /* ignore */
    }
    worker = null;
  }
  isInitializing = false;
  initPromise = null;
}

export function getDuckDBState() {
  return {
    isInitialized: !!DB,
    isInitializing,
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (worker) worker.terminate();
  });
}
