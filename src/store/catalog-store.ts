import { create } from "zustand";
import { useDuckDBStore } from "./duckdb-store";

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

  // Actions
  addDataset: (dataset: Omit<Dataset, "id" | "createdAt">) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  updateDataset: (id: string, updates: Partial<Dataset>) => Promise<void>;
  selectDataset: (id: string | null) => void;
  refreshDatasets: () => Promise<void>;
  getTableInfo: (tableName: string) => Promise<{ rowCount: number | bigint; size: number | bigint }>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  datasets: [],
  isLoading: false,
  error: null,
  selectedDataset: null,

  addDataset: async (dataset) => {
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

    set((state) => ({
      datasets: [...state.datasets, newDataset],
    }));
  },

  removeDataset: async (id) => {
    const { db } = useDuckDBStore.getState();
    if (!db) {
      throw new Error("DuckDB is not initialized");
    }

    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
      selectedDataset: state.selectedDataset?.id === id ? null : state.selectedDataset,
    }));
  },

  updateDataset: async (id, updates) => {
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
      selectedDataset:
        state.selectedDataset?.id === id
          ? { ...state.selectedDataset, ...updates }
          : state.selectedDataset,
    }));
  },

  selectDataset: (id) => {
    set((state) => ({
      selectedDataset: id
        ? state.datasets.find((d) => d.id === id) || null
        : null,
    }));
  },

  getTableInfo: async (tableName: string) => {
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

  refreshDatasets: async () => {
    const { db, conn } = useDuckDBStore.getState();
    if (!db || !conn) {
      throw new Error("DuckDB is not initialized");
    }

    set({ isLoading: true, error: null });

    try {
      // Query DuckDB's information schema to get all tables
      const result = await conn.query(`
        SELECT 
          table_name,
          table_type,
          is_insertable_into
        FROM information_schema.tables 
        WHERE table_schema = 'main'
        ORDER BY table_name
      `);

      // Transform the results into Dataset objects
      const datasets = await Promise.all(
        result.toArray().map(async (row) => {
          const tableName = row.table_name as string;
          const { rowCount, size } = await get().getTableInfo(tableName);

          return {
            id: crypto.randomUUID(), // Generate new IDs for existing tables
            name: tableName,
            tableName: tableName,
            fileType: row.table_type as string,
            size,
            rowCount,
            createdAt: new Date(), // Creation time is not available in information_schema
            lastAccessed: undefined, // Last accessed time is not available in information_schema
            isInsertable: row.is_insertable_into === 'YES'
          };
        })
      );

      set({ datasets, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err : new Error("Failed to refresh datasets"),
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
