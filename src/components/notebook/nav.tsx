"use client";

import { BookPlusIcon, Loader2Icon, MoreVerticalIcon, NotebookIcon, Trash2Icon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { notebooks, activeNotebook, setActiveNotebook, removeNotebook, createNotebook, isLoading } = useNotebook();

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
    <div className="flex flex-col px-4">
      <div className="text-sm text-muted-foreground flex items-center justify-between mb-4">
        <div className="text-xs uppercase">Notebooks</div>
        <Button size="icon" variant="ghost" className="size-6 cursor-pointer" onClick={() => createNotebook()}>
          <BookPlusIcon className="size-4" />
        </Button>
      </div>
      {notebooks.length === 0 ? (
        <div className="flex flex-col items-center h-full text-center">
          <div className="flex flex-col items-center justify-center w-full bg-gradient-to-br from-primary/15 to-secondary/10 rounded p-4">
            <NotebookIcon className="size-10 text-muted-foreground my-4" />
            <h3 className="text-lg text-card-foreground font-medium mb-2">No notebooks</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a notebook to get started</p>
            <Button size="sm" onClick={() => createNotebook()}>
              <BookPlusIcon className="size-4" />
              Create notebook
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {notebooks.map(notebook => (
            <button
              key={notebook.id}
              onClick={() => setActiveNotebook(notebook.id)}
              className={`w-full flex items-center justify-between p-2 rounded h-8 transition-colors hover:bg-accent cursor-pointer hover:text-accent-foreground ${activeNotebook?.id === notebook.id
                ? "bg-accent text-accent-foreground border font-semibold"
                : ""
                }`}
            >
              <span className="text-sm truncate">{notebook.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center justify-center text-muted-foreground size-5 hover:text-foreground p-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVerticalIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className=""
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotebook(notebook.id);
                    }}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
