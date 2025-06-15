"use client";

import { BookPlusIcon, FileIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotebook } from "@/components/notebook/notebook-context";
import { PropsWithChildren, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function NewNotebookDialog({
  isOpen,
  setIsOpen,
  children,
}: PropsWithChildren<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}>) {
  const [newNotebookName, setNewNotebookName] = useState("");
  const { createNotebook } = useNotebook();
  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;
    await createNotebook(newNotebookName.trim());
    setNewNotebookName("");
    setIsOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new notebook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              value={newNotebookName}
              onChange={e => setNewNotebookName(e.target.value)}
              placeholder="Enter notebook name"
            />
          </div>
          <Button onClick={handleCreateNotebook}>Create Notebook</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NotebookList() {
  const { notebooks, activeNotebook, setActiveNotebook, removeNotebook, isLoading } = useNotebook();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center h-full text-center px-4">
        <div className="flex flex-col items-center justify-center w-full p-4">
          <Loader2Icon className="size-10 text-muted-foreground my-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading notebooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {notebooks.length === 0 ? (
        <div className="flex flex-col items-center h-full text-center px-4">
          <div className="flex flex-col items-center justify-center w-full border rounded-xl p-4">
            <FileIcon className="size-10 text-muted-foreground my-4" />
            <h3 className="text-lg text-card-foreground font-medium mb-2">No notebooks</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a notebook to get started</p>
            <NewNotebookDialog isOpen={isOpen} setIsOpen={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="default" className="w-full text-xs">
                  Create
                  <BookPlusIcon className="size-4" />
                </Button>
              </DialogTrigger>
            </NewNotebookDialog>
          </div>
        </div>
      ) : (
        <div className="px-3">
          <div className="text-sm text-muted-foreground flex items-center justify-between mb-2">
            <div className="text-xs uppercase">Notebooks</div>
            <NewNotebookDialog isOpen={isOpen} setIsOpen={setIsOpen}>
              <DialogTrigger asChild>
                <BookPlusIcon className="size-4 hover:text-foreground/80 my-2 cursor-pointer" />
              </DialogTrigger>
            </NewNotebookDialog>
          </div>
          <div className="space-y-1">
            {notebooks.map(notebook => (
              <button
                key={notebook.id}
                onClick={() => setActiveNotebook(notebook.id)}
                className={`w-full flex items-center justify-between p-2 rounded-sm h-8 transition-colors hover:bg-accent cursor-pointer hover:text-accent-foreground ${
                  activeNotebook?.id === notebook.id
                    ? "bg-accent text-accent-foreground border font-semibold"
                    : ""
                }`}
              >
                <span className="text-sm truncate">{notebook.name}</span>
                <button
                  className="flex items-center justify-center text-muted-foreground size-5 hover:text-red-500 p-0"
                  onClick={() => removeNotebook(notebook.id)}
                >
                  <Trash2Icon className="size-4" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
