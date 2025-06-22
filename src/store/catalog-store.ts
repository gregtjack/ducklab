import { create } from "zustand";
import { useDuckDBStore } from "./duckdb-store";
import { nanoid } from "nanoid";

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  tableName: string;
  fileType: string;
  size: number | bigint;
  rowCount?: number | bigint;
  createdAt: Date;
  lastAccessed?: Date;
  tags?: string[];
  isInsertable: boolean;
}

interface CatalogState {
  datasets: Dataset[];
  isLoading: boolean;
  error: Error | null;
  selectedDataset: Dataset | null;
  autoSyncInterval: number | null;
  isAutoSyncEnabled: boolean;

  // Actions
  addDataset: (dataset: Omit<Dataset, "id" | "createdAt">) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  updateDataset: (id: string, updates: Partial<Dataset>) => Promise<void>;
  selectDataset: (id: string | null) => void;
  sync: () => Promise<void>;
  refreshDatasets: () => void;
  startAutoSync: (intervalMs?: number) => void;
  stopAutoSync: () => void;
  waitForDuckDB: () => Promise<void>;
  getTableInfo: (
    tableName: string,
  ) => Promise<{ rowCount: number | bigint; size: number | bigint }>;
  getTableSchema: (tableName: string) => Promise<
    {
      columnName: string;
      dataType: string;
      isNullable: string;
      columnDefault: string | null;
    }[]
  >;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  datasets: [],
  isLoading: false,
  error: null,
  selectedDataset: null,
  autoSyncInterval: null,
  isAutoSyncEnabled: false,

  waitForDuckDB: async () => {
    const { isDuckDBReady } = useDuckDBStore.getState();

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

  addDataset: async dataset => {
    await get().waitForDuckDB();

    const { db } = useDuckDBStore.getState();
    if (!db) {
      throw new Error("DuckDB is not initialized");
    }

    const newDataset: Dataset = {
      ...dataset,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isInsertable: false,
    };

    set(state => ({
      datasets: [...state.datasets, newDataset],
    }));
  },

  removeDataset: async id => {
    await get().waitForDuckDB();

    const { db, runQuery } = useDuckDBStore.getState();
    if (!db) {
      throw new Error("DuckDB is not initialized");
    }

    const tableName = get().datasets.find(d => d.id === id)?.tableName;

    if (!tableName) {
      throw new Error("Table not found");
    }

    await runQuery(`DROP TABLE IF EXISTS "${tableName}"`);

    set(state => ({
      datasets: state.datasets.filter(d => d.id !== id),
      selectedDataset: state.selectedDataset?.id === id ? null : state.selectedDataset,
    }));
  },

  updateDataset: async (id, updates) => {
    set(state => ({
      datasets: state.datasets.map(d => (d.id === id ? { ...d, ...updates } : d)),
      selectedDataset:
        state.selectedDataset?.id === id
          ? { ...state.selectedDataset, ...updates }
          : state.selectedDataset,
    }));
  },

  selectDataset: id => {
    set(state => ({
      selectedDataset: id ? state.datasets.find(d => d.id === id) || null : null,
    }));
  },

  getTableInfo: async (tableName: string) => {
    await get().waitForDuckDB();

    const { conn } = useDuckDBStore.getState();
    if (!conn) {
      throw new Error("DuckDB is not initialized");
    }

    try {
      // Get row count
      const rowCountResult = await conn.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const rowCount = rowCountResult.get(0)?.count as number | bigint;

      return { rowCount, size: 0 };
    } catch (err) {
      console.error("Failed to get table info:", err);
      return { rowCount: 0, size: 0 };
    }
  },

  getTableSchema: async (tableName: string) => {
    await get().waitForDuckDB();

    const { conn } = useDuckDBStore.getState();
    if (!conn) {
      throw new Error("DuckDB is not initialized");
    }

    try {
      const result = await conn.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'main' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      return result.toArray().map(row => ({
        columnName: row.column_name as string,
        dataType: row.data_type as string,
        isNullable: row.is_nullable as string,
        columnDefault: row.column_default as string | null,
      }));
    } catch (err) {
      console.error("Failed to get table schema:", err);
      return [];
    }
  },

  sync: async () => {
    await get().waitForDuckDB();

    const { conn } = useDuckDBStore.getState();
    if (!conn) {
      throw new Error("DuckDB is not initialized");
    }

    try {
      const result = await conn.query(`
        SELECT 
          table_name,
          table_type,
          is_insertable_into
        FROM information_schema.tables 
        WHERE table_schema = 'main'
        ORDER BY table_name
      `);

      const newDatasets = await Promise.all(
        result.toArray().map(async row => {
          const tableName = row.table_name as string;
          const { rowCount, size } = await get().getTableInfo(tableName);

          return {
            id: nanoid(),
            name: tableName,
            tableName: tableName,
            fileType: row.table_type as string,
            size,
            rowCount,
            createdAt: new Date(),
            lastAccessed: undefined,
            isInsertable: row.is_insertable_into === "YES",
          };
        }),
      );

      const currentDatasets = get().datasets;
      const hasChanges =
        newDatasets.length !== currentDatasets.length ||
        newDatasets.some(
          newDs =>
            !currentDatasets.find(
              currentDs =>
                currentDs.tableName === newDs.tableName &&
                currentDs.fileType === newDs.fileType &&
                currentDs.size === newDs.size &&
                currentDs.rowCount === newDs.rowCount &&
                currentDs.isInsertable === newDs.isInsertable,
            ),
        );

      if (hasChanges) {
        set({ datasets: newDatasets, error: null });
      }
    } catch (err) {
      throw new Error("Failed to fetch tables", { cause: err });
    }
  },

  refreshDatasets: () => {
    set({ isLoading: true, error: null });
    get()
      .sync()
      .then(() => {
        set({ isLoading: false });
      })
      .catch(err => {
        set({
          isLoading: false,
          error:
            err instanceof Error ? err : new Error("Failed to refresh datasets", { cause: err }),
        });
      });
  },

  startAutoSync: (intervalMs = 5000) => {
    const { stopAutoSync } = get();

    // Stop any existing auto-sync
    stopAutoSync();

    // Start new auto-sync interval
    const interval = window.setInterval(() => {
      const { isDuckDBReady } = useDuckDBStore.getState();
      const { sync } = get();
      if (isDuckDBReady()) {
        sync().catch(err => {
          console.error("Catalog auto-sync failed:", err);
        });
      }
    }, intervalMs);

    set({
      autoSyncInterval: interval,
      isAutoSyncEnabled: true,
    });
  },

  stopAutoSync: () => {
    const { autoSyncInterval } = get();
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
    }
    set({
      autoSyncInterval: null,
      isAutoSyncEnabled: false,
    });
  },
}));
