"use client";

import { PlusIcon, Loader2Icon, MoreVerticalIcon, NotebookIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotebookStore } from "@/store/notebook-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";

export function NotebookList() {
  const { notebooks, setActiveNotebook, removeNotebook, createNotebook, isLoading } =
    useNotebookStore();
  const navigate = useNavigate();

  const handleCreateNotebook = async () => {
    const notebookId = await createNotebook();
    setActiveNotebook(notebookId);
    navigate({ to: "/notebook/$id", params: { id: notebookId } });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex flex-col items-center justify-center w-full p-4">
          <Loader2Icon className="size-10 text-muted-foreground my-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading notebooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="text-muted-foreground flex items-center justify-between mb-3">
        <div className="uppercase text-xs">notebooks</div>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 cursor-pointer"
          onClick={handleCreateNotebook}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {notebooks.length === 0 ? (
        <div className="flex flex-col items-center h-full text-center">
          <div className="flex flex-col items-center justify-center w-full p-4">
            <NotebookIcon className="size-10 text-muted-foreground my-4" />
            <h3 className="text-lg text-muted-foreground font-medium mb-2">No notebooks</h3>
          </div>
        </div>
      ) : (
        <div className="space-y-1 mb-3">
          {notebooks
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map(notebook => (
              <Link
                key={notebook.id}
                to="/notebook/$id"
                params={{ id: notebook.id }}
                activeProps={{ className: "bg-primary/10 border border-primary/20" }}
                className={`w-full flex items-center justify-between p-2 rounded-lg h-9 hover:bg-primary/15 cursor-pointer hover:text-accent-foreground`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-lg">{notebook.icon}</span>
                  <span className="text-sm truncate">{notebook.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      className="flex items-center justify-center text-muted-foreground size-5 hover:text-foreground p-0 cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVerticalIcon className="size-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className=""
                      onClick={e => {
                        e.stopPropagation();
                        removeNotebook(notebook.id);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
