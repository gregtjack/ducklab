"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, NotebookRecord, CellRecord, DataSourceRecord } from "@/lib/db/notebook-db";
import { deserialize } from "@/lib/arrow";
// import { QueryResult } from "@/lib/duckdb/provider";
import { useDuckDBStore, QueryResult } from "@/store/duckdb-store";

export interface DataSource {
  id: string;
  name: string;
  type: "local" | "remote";
  path: string;
  file?: File;
}

export interface Cell {
  id: string;
  index: number;
  query: string;
  results: QueryResult | null;
  error: string | null;
  isLoading: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  cells: Cell[];
  dataSources: DataSource[];
}

interface NotebookContextType {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  createNotebook: (name: string) => Promise<void>;
  removeNotebook: (id: string) => Promise<void>;
  setActiveNotebook: (id: string) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>;
  addCell: (notebookId: string, cell: Cell, index?: number) => Promise<void>;
  removeCell: (notebookId: string, cellId: string) => Promise<void>;
  updateCell: (notebookId: string, cellId: string, updates: Partial<Cell>) => Promise<void>;
  addDataSource: (notebookId: string, dataSource: DataSource) => Promise<void>;
  removeDataSource: (notebookId: string, dataSourceId: string) => Promise<void>;
  isLoading: boolean;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { reset } = useDuckDBStore();

  const activeNotebook = notebooks.find(n => n.id === activeNotebookId) || null;

  // Load notebooks on mount
  useEffect(() => {
    const loadNotebooks = async () => {
      const notebookRecords = await db.notebooks.toArray();
      const loadedNotebooks = await Promise.all(
        notebookRecords.map(async record => {
          const cells = await db.cells.where("notebookId").equals(record.id).sortBy("index");

          const dataSources = await db.dataSources
            .where("notebookId")
            .equals(record.id)
            .sortBy("updatedAt");

          return {
            id: record.id,
            name: record.name,
            cells: await Promise.all(
              cells.map(async cell => ({
                id: cell.id,
                query: cell.query,
                results: cell.results ? deserialize(cell.results) : null,
                error: cell.error,
                isLoading: cell.isLoading,
              })),
            ),
            dataSources: dataSources.map(ds => ({
              id: ds.id,
              name: ds.name,
              type: ds.type,
              path: ds.path,
              file: ds.fileData
                ? new File([Buffer.from(ds.fileData, "base64")], ds.name)
                : undefined,
            })),
          };
        }),
      );
      setNotebooks(loadedNotebooks as Notebook[]);
      setIsLoading(false);
    };

    void loadNotebooks();
  }, []);

  const createNotebook = useCallback(async (name: string) => {
    const id = uuidv4();
    const now = new Date();

    const notebookRecord: NotebookRecord = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
    };

    const cellRecord: CellRecord = {
      id: uuidv4(),
      index: 0,
      notebookId: id,
      query: `CREATE TABLE taxi AS (SELECT * FROM 'http://${window.location.host}/demo/yellow_tripdata_2024-12.parquet');`,
      results: null,
      error: null,
      isLoading: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.notebooks.add(notebookRecord);
    await db.cells.add(cellRecord);

    const newNotebook: Notebook = {
      id,
      name,
      cells: [
        {
          id: cellRecord.id,
          index: cellRecord.index,
          query: cellRecord.query,
          results: null,
          error: cellRecord.error,
          isLoading: cellRecord.isLoading,
        },
      ],
      dataSources: [],
    };

    setNotebooks(prev => [...prev, newNotebook]);
    setActiveNotebookId(id);
  }, []);

  const removeNotebook = useCallback(
    async (id: string) => {
      await db.transaction("rw", [db.notebooks, db.cells, db.dataSources], async () => {
        await db.notebooks.delete(id);
        await db.cells.where("notebookId").equals(id).delete();
        await db.dataSources.where("notebookId").equals(id).delete();
      });

      setNotebooks(prev => prev.filter(n => n.id !== id));
      if (activeNotebookId === id) {
        setActiveNotebookId(null);
      }
    },
    [activeNotebookId],
  );

  const setActiveNotebook = useCallback(async (id: string) => {
    setActiveNotebookId(id);
    await reset();
  }, []);

  const updateNotebook = useCallback(async (id: string, updates: Partial<Notebook>) => {
    const now = new Date();
    const notebookRecord: Partial<NotebookRecord> = {
      ...updates,
      updatedAt: now,
    };

    await db.notebooks.update(id, notebookRecord);

    setNotebooks(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const addCell = useCallback(async (notebookId: string, cell: Cell, index?: number) => {
    const now = new Date();
    const cellRecord: CellRecord = {
      id: cell.id,
      index: index ?? 0,
      notebookId,
      query: cell.query,
      results: null,
      error: cell.error,
      isLoading: cell.isLoading,
      createdAt: now,
      updatedAt: now,
    };

    await db.cells.add(cellRecord);

    setNotebooks(prev =>
      prev.map(n => {
        if (n.id !== notebookId) return n;

        const cells =
          index !== undefined
            ? [...n.cells.slice(0, index), cell, ...n.cells.slice(index)]
            : [...n.cells, cell];

        return { ...n, cells };
      }),
    );
  }, []);

  const removeCell = useCallback(async (notebookId: string, cellId: string) => {
    await db.cells.delete(cellId);

    setNotebooks(prev =>
      prev.map(n =>
        n.id === notebookId ? { ...n, cells: n.cells.filter(c => c.id !== cellId) } : n,
      ),
    );
  }, []);

  const updateCell = useCallback(
    async (notebookId: string, cellId: string, updates: Partial<Cell>) => {
      const now = new Date();
      const cellRecord: Partial<CellRecord> = {
        ...updates,
        results: null,
        updatedAt: now,
      };

      await db.cells.update(cellId, cellRecord);

      setNotebooks(prev =>
        prev.map(n =>
          n.id === notebookId
            ? {
                ...n,
                cells: n.cells.map(c => (c.id === cellId ? { ...c, ...updates } : c)),
              }
            : n,
        ),
      );
    },
    [],
  );

  const addDataSource = useCallback(async (notebookId: string, dataSource: DataSource) => {
    const now = new Date();
    const dataSourceRecord: DataSourceRecord = {
      id: dataSource.id,
      notebookId,
      name: dataSource.name,
      type: dataSource.type,
      path: dataSource.path,
      fileData: dataSource.file ? await fileToBase64(dataSource.file) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.dataSources.add(dataSourceRecord);

    setNotebooks(prev =>
      prev.map(n =>
        n.id === notebookId ? { ...n, dataSources: [...n.dataSources, dataSource] } : n,
      ),
    );
  }, []);

  const removeDataSource = useCallback(async (notebookId: string, dataSourceId: string) => {
    await db.dataSources.delete(dataSourceId);

    setNotebooks(prev =>
      prev.map(n =>
        n.id === notebookId
          ? {
              ...n,
              dataSources: n.dataSources.filter(ds => ds.id !== dataSourceId),
            }
          : n,
      ),
    );
  }, []);

  const value = {
    notebooks,
    activeNotebook,
    createNotebook,
    removeNotebook,
    setActiveNotebook,
    updateNotebook,
    addCell,
    removeCell,
    updateCell,
    addDataSource,
    removeDataSource,
    isLoading,
  };

  return <NotebookContext.Provider value={value}>{children}</NotebookContext.Provider>;
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (context === undefined) {
    throw new Error("useNotebook must be used within a NotebookProvider");
  }
  return context;
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/octet-stream;base64,")
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}
