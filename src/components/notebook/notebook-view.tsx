"use client";

import { useNotebookStore, useActiveNotebook } from "@/store/notebook-store";
import { NotebookCell } from "./notebook-cell";
import { Loader2, PencilIcon, PlusIcon } from "lucide-react";
import { nanoid } from "nanoid";
import React, { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useParams } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from "@/components/ui/emoji-picker";

export function NotebookView() {
  const { addCell, updateNotebook, isLoading, setActiveNotebook } = useNotebookStore();
  const activeNotebook = useActiveNotebook();
  const { id: notebookId } = useParams({ from: "/notebook/$id" });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    if (notebookId && activeNotebook?.id !== notebookId) {
      setActiveNotebook(notebookId);
    }
  }, [notebookId, activeNotebook?.id]);

  const handleAddCell = (index?: number) => {
    if (!activeNotebook) return;

    const newCell = {
      id: nanoid(),
      index: index ?? 0,
      query: "",
      results: null,
      error: null,
      isLoading: false,
    };

    addCell(activeNotebook.id, newCell, index);
  };

  const handleNameSubmit = async (e: React.FormEvent<HTMLInputElement>) => {
    if (!activeNotebook || !e.currentTarget.value.trim()) return;
    await updateNotebook(activeNotebook.id, { name: e.currentTarget.value });
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNameSubmit(e);
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  const handleIconSelect = async (emoji: { emoji: string; label: string }) => {
    if (!activeNotebook) return;
    await updateNotebook(activeNotebook.id, { icon: emoji.emoji });
    setIsIconPickerOpen(false);
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
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-fit">
          <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
            <PopoverTrigger asChild>
              <div className="size-8 flex hover:bg-accent transition-colors rounded-md p-0.5 items-center justify-center gap-2 cursor-pointer group">
                <h2 className="text-2xl font-semibold">{activeNotebook.icon}</h2>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-fit h-84 p-0 border" align="start">
              <EmojiPicker onEmojiSelect={handleIconSelect}>
                <EmojiPickerSearch />
                <EmojiPickerContent />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
        </div>
        <div className="shrink-0 w-fit">
          {isEditingName ? (
            <input
              defaultValue={activeNotebook.name}
              onFocus={e => e.target.select()}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameSubmit}
              autoFocus
              className="text-xl font-semibold bg-accent/75 border-none outline-none px-2 py-1 rounded-md"
            />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setIsEditingName(true)}
            >
              <h2 className="text-2xl font-semibold">{activeNotebook.name}</h2>
              <PencilIcon className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
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
