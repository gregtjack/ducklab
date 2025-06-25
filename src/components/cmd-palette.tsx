"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Database } from "lucide-react";
import { useNotebookStore } from "@/store/notebook-store";
import { useCatalogStore, Dataset } from "@/store/catalog-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { DatasetDetailsDialog } from "./catalog/dataset-details-dialog";

export function NotebookSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false);
  const { notebooks, setActiveNotebook, createNotebook } = useNotebookStore();
  const { datasets } = useCatalogStore();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectNotebook = async (notebookId: string) => {
    setActiveNotebook(notebookId);
    navigate({ to: `/notebook/${notebookId}` });
    setOpen(false);
  };

  const handleCreateNotebook = async () => {
    const newNotebookId = await createNotebook();
    navigate({ to: `/notebook/${newNotebookId}` });
    setOpen(false);
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsDatasetDialogOpen(true);
    setOpen(false);
  };

  const sortedNotebooks = [...notebooks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const sortedDatasets = [...datasets].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2 gap-1 bg-muted/20 shadow-none"
        onClick={() => setOpen(true)}
        title="Switch notebooks (⌘K)"
      >
        <Search className="size-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground hidden sm:inline">⌘K</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search notebooks and datasets..." />
        <CommandList>
          <CommandEmpty>No notebooks or datasets found.</CommandEmpty>
          <CommandGroup heading="Recent notebooks">
            {sortedNotebooks.map(notebook => (
              <CommandItem
                value={notebook.id}
                key={notebook.id}
                keywords={[notebook.name]}
                onSelect={() => handleSelectNotebook(notebook.id)}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{notebook.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{notebook.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {notebook.cells.length} cell{notebook.cells.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {datasets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Catalog">
                {sortedDatasets.map(dataset => (
                  <CommandItem
                    value={dataset.id}
                    key={dataset.id}
                    keywords={[dataset.name]}
                    onSelect={() => handleSelectDataset(dataset)}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{dataset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {dataset.rowCount !== undefined
                          ? `${dataset.rowCount.toLocaleString()} rows`
                          : ""}
                        {dataset.rowCount !== undefined && dataset.size > 0 ? " • " : ""}
                        {dataset.size > 0 ? `${(Number(dataset.size) / 1024).toFixed(1)} KB` : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleCreateNotebook}>
              <Plus className=" h-4 w-4" />
              Create new notebook
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <DatasetDetailsDialog
        dataset={selectedDataset}
        isOpen={isDatasetDialogOpen}
        onClose={() => {
          setIsDatasetDialogOpen(false);
          setSelectedDataset(null);
        }}
      />
    </>
  );
}
