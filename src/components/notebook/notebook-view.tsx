"use client";

import { useNotebook } from "./notebook-context";
import { NotebookCell } from "./notebook-cell";
import { Loader2, PencilIcon, PlusIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function NotebookView() {
  const { activeNotebook, addCell, updateNotebook, isLoading } = useNotebook();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAddCell = (index?: number) => {
    if (!activeNotebook) return;

    const newCell = {
      id: uuidv4(),
      index: index ?? 0,
      query: "",
      results: null,
      error: null,
      isLoading: false,
    };

    addCell(activeNotebook.id, newCell, index);
  };

  const handleNameSubmit = async () => {
    if (!activeNotebook || !newName.trim()) return;
    await updateNotebook(activeNotebook.id, { name: newName.trim() });
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setNewName(activeNotebook?.name || "");
    }
  };

  if (!activeNotebook) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No notebook selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-4 animate-spin" />
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[96rem] flex flex-col w-full p-4 gap-4">
      <div className="shrink-0 w-fit">
        {isEditingName ? (
          <input
            value={newName}
            onFocus={e => e.target.select()}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={handleNameSubmit}
            autoFocus
            className="text-xl font-semibold bg-accent/75 border-none outline-none px-2 py-1 rounded-md"
          />
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              setNewName(activeNotebook.name);
              setIsEditingName(true);
            }}
          >
            <h2 className="text-xl font-semibold">{activeNotebook.name}</h2>
            <PencilIcon className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
      <div>
        {activeNotebook.cells.map((cell, idx) => (
          <React.Fragment key={cell.id}>
            <AddCellSeparator index={idx} handleAddCell={handleAddCell} />
            <NotebookCell cellId={cell.id} index={idx} />
          </React.Fragment>
        ))}
        <Button
          variant="ghost"
          className="mb-[400px] w-full mt-3"
          onClick={() => handleAddCell(activeNotebook.cells.length)}
        >
          <PlusIcon className="text-primary" />
          New cell
        </Button>
      </div>
    </div>
  );
}

function AddCellSeparator({
  className,
  index,
  handleAddCell,
}: {
  className?: string;
  index: number;
  handleAddCell: (index?: number) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <div
            onClick={() => handleAddCell(index)}
            className={cn(
              "w-full relative h-4 my-2 opacity-20 transition-all hover:opacity-100 cursor-pointer",
              className,
            )}
          >
            <div className="absolute ml-8 inset-0 bg-primary top-1/2 -translate-y-1/2 h-[2px] rounded-full" />
            <div className="absolute flex ml-[17px] items-center justify-center top-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[10px] rounded-sm">
              <PlusIcon className="size-[24px] text-primary" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Add new cell</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
