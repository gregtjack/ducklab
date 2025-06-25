import { create } from "zustand";
import { persist, StorageValue } from "zustand/middleware";
import superjson from "superjson";
import { genUniqueId } from "@/lib/utils";
import { Cell, Notebook } from "@/lib/types/notebook";

const randomDemoQueries = [
  "SELECT 1",
  "SELECT * FROM generate_series(1, 5) as numbers",
  "SELECT current_timestamp as now",
  "SELECT pi() as pi",
  "SELECT uuid() as unique_id",
  "SELECT concat('Welcome', ' ', 'to', ' ', 'DuckLab!') as greeting",
];

const INITIAL_ICONS = ["🌊", "📊", "📈", "🔍", "📝", "💡", "🗂️", "📓", "🔮", "⚡️"];

interface NotebookState {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  isLoading: boolean;

  setIsLoading: (isLoading: boolean) => void;
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
      notebooks: [
        {
          id: "1",
          name: "Welcome",
          icon: "🦆",
          lastOpened: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
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
        },
      ],
      activeNotebookId: null,
      isLoading: true,

      setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      createNotebook: async (name: string = "Untitled") => {
        const newNotebook: Notebook = {
          id: genUniqueId(),
          name,
          icon: INITIAL_ICONS[Math.floor(Math.random() * INITIAL_ICONS.length)],
          lastOpened: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
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
          notebooks: state.notebooks.map(n =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n,
          ),
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

            return { ...n, cells, updatedAt: new Date() };
          }),
        }));
      },

      removeCell: async (notebookId: string, cellId: string) => {
        set(state => ({
          notebooks: state.notebooks.map(n =>
            n.id === notebookId
              ? {
                  ...n,
                  cells: n.cells.filter(c => c.id !== cellId),
                  updatedAt: new Date(),
                }
              : n,
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
                  updatedAt: new Date(),
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
          isLoading: true,
        } as NotebookState;
      },
      skipHydration: true,
      onRehydrateStorage: () => {
        return (state, error: unknown) => {
          if (error) {
            console.error("Error rehydrating notebook store:", error);
          }
          state!.isLoading = false;
        };
      },
    },
  ),
);

export const useActiveNotebook = () => {
  const { notebooks, activeNotebookId } = useNotebookStore();
  return notebooks.find(n => n.id === activeNotebookId) || null;
};
