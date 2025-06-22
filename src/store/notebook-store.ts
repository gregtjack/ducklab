import { create } from "zustand";
import { QueryResult } from "./duckdb-store";
import { persist, StorageValue } from "zustand/middleware";
import superjson from "superjson";
import { genUniqueId } from "@/lib/utils";

const randomDemoQueries = [
  "SELECT 1 as number",
  "SELECT * FROM generate_series(1, 5) as numbers",
  "SELECT current_timestamp as now",
  "SELECT pi() as pi",
  "SELECT uuid() as unique_id",
  "SELECT concat('Hello', ' ', 'World!') as greeting",
  "WITH RECURSIVE fibonacci(n, fib_n, next_fib) AS (SELECT 1, 1, 1 UNION ALL SELECT n + 1, next_fib, fib_n + next_fib FROM fibonacci WHERE n < 10) SELECT n, fib_n as fibonacci_number FROM fibonacci",
];

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
  icon: string;
  cells: Cell[];
  lastOpened: Date;
  createdAt: Date;
}

const INITIAL_ICONS = ["🌊", "📊", "📈", "🔍", "📝", "💡", "🗂️", "📓", "🔮", "⚡️"];

interface NotebookState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  isLoading: boolean;

  createNotebook: (name?: string) => Promise<string>;
  removeNotebook: (id: string) => Promise<void>;
  setActiveNotebook: (id: string | null) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>;
  addCell: (notebookId: string, cell: Cell, index?: number) => Promise<void>;
  removeCell: (notebookId: string, cellId: string) => Promise<void>;
  updateCell: (notebookId: string, cellId: string, updates: Partial<Cell>) => Promise<void>;
}

export const useNotebookStore = create<NotebookState>()(
  persist(
    set => ({
      notebooks: [],
      activeNotebookId: null,
      isLoading: true,

      createNotebook: async (name: string = "Untitled") => {
        const newNotebook: Notebook = {
          id: genUniqueId(),
          name,
          icon: INITIAL_ICONS[Math.floor(Math.random() * INITIAL_ICONS.length)],
          lastOpened: new Date(),
          createdAt: new Date(),
          cells: [
            {
              id: genUniqueId(),
              index: 0,
              query: randomDemoQueries[Math.floor(Math.random() * randomDemoQueries.length)],
              error: null,
              isLoading: false,
              results: null,
            },
          ],
        };

        set(state => ({
          notebooks: [...state.notebooks, newNotebook],
          activeNotebookId: newNotebook.id,
        }));

        return newNotebook.id;
      },

      removeNotebook: async (id: string) => {
        set(state => ({
          notebooks: state.notebooks.filter(n => n.id !== id),
          activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
        }));
      },

      setActiveNotebook: (id: string | null) => {
        set(state => ({
          activeNotebookId: id,
          notebooks: state.notebooks.map(n => ({
            ...n,
            lastOpened: id === n.id ? new Date() : n.lastOpened,
          })),
        }));
      },

      updateNotebook: async (id: string, updates: Partial<Notebook>) => {
        set(state => ({
          notebooks: state.notebooks.map(n => (n.id === id ? { ...n, ...updates } : n)),
        }));
      },

      addCell: async (notebookId: string, cell: Cell, index?: number) => {
        set(state => ({
          notebooks: state.notebooks.map(n => {
            if (n.id !== notebookId) return n;

            const cells =
              index !== undefined
                ? [...n.cells.slice(0, index), cell, ...n.cells.slice(index)]
                : [...n.cells, cell];

            return { ...n, cells };
          }),
        }));
      },

      removeCell: async (notebookId: string, cellId: string) => {
        set(state => ({
          notebooks: state.notebooks.map(n =>
            n.id === notebookId ? { ...n, cells: n.cells.filter(c => c.id !== cellId) } : n,
          ),
        }));
      },

      updateCell: async (notebookId: string, cellId: string, updates: Partial<Cell>) => {
        set(state => ({
          notebooks: state.notebooks.map(n =>
            n.id === notebookId
              ? {
                  ...n,
                  cells: n.cells.map(c => (c.id === cellId ? { ...c, ...updates } : c)),
                }
              : n,
          ),
        }));
      },
    }),
    {
      name: "notebook-store",
      storage: {
        getItem: name => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return superjson.parse(str) as StorageValue<NotebookState>;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, superjson.stringify(value));
        },
        removeItem: name => localStorage.removeItem(name),
      },
      partialize: state => {
        // don't persist the query results
        return {
          notebooks: state.notebooks.map(n => ({
            ...n,
            cells: n.cells.map(c => ({
              ...c,
              results: null,
            })),
          })),
          activeNotebookId: state.activeNotebookId,
          isLoading: state.isLoading,
        } as NotebookState;
      },
      onRehydrateStorage: () => {
        return (state, error: unknown) => {
          if (error) {
            console.error("Error rehydrating notebook store:", error);
          } else {
            state!.isLoading = false;
          }
        };
      },
    },
  ),
);

export const useActiveNotebook = () => {
  const { notebooks, activeNotebookId } = useNotebookStore();
  return notebooks.find(n => n.id === activeNotebookId) || null;
};
