"use client";

import { Button } from "./ui/button";
import { NotebookList } from "./notebook/nav";
import { CatalogList } from "./catalog/catalog-list";
import { useState, useRef, useEffect } from "react";
import { PanelLeftInactive, PanelLeft, InfoIcon, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 240;
const SPACING = 10;
const CLOSE_DELAY = 300;

interface SidebarHeaderProps {
  isDocked: boolean;
  onToggleDock: () => void;
  onToggleVisibility: () => void;
}

function SidebarHeader({ isDocked, onToggleDock }: SidebarHeaderProps) {
  return (
    <div className="px-3 py-2 flex items-center justify-between">
      <div className="text-2xl tracking-tight font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
        <Link to="/">DuckPad</Link>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="p-0 size-6 text-muted-foreground"
          onClick={onToggleDock}
          title={isDocked ? "Undock sidebar" : "Dock sidebar"}
        >
          {isDocked ? <PanelLeftInactive className="size-4" /> : <PanelLeft className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-1 px-3 pb-3">
      <Link
        to="/settings"
        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-primary/15"
        activeProps={{ className: "bg-primary/10 border border-primary/20" }}
      >
        <Settings className="size-4" />
        <span className="text-sm">Settings</span>
      </Link>
      <Link
        to="/about"
        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-primary/15"
        activeProps={{ className: "bg-primary/10 border border-primary/20" }}
      >
        <InfoIcon className="size-4" />
        <span className="text-sm">About DuckPad</span>
      </Link>
    </div>
  );
}

export function Sidebar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDocked, setIsDocked] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>(null);

  const handleMouseLeave = () => {
    if (!isDocked) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, CLOSE_DELAY);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      sidebarRef.current.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      if (!sidebarRef.current) return;
      const finalWidth = parseInt(sidebarRef.current.style.width);
      setWidth(finalWidth);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    if (!isDocked || !isVisible) {
      main.style.marginLeft = `-${width}px`;
    } else {
      main.style.marginLeft = "0";
    }
  }, [isDocked, isVisible, width]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Computed styles
  const sidebarClasses = [
    "bg-sidebar relative border-r overflow-ellipsis z-25",
    !isDocked &&
      "fixed shadow-xl rounded-lg border z-50 bg-sidebar/75 backdrop-blur-md motion-reduce:transition-none transition-all duration-150",
    !isDocked && !isVisible && "translate-x-[-110%]",
  ]
    .filter(Boolean)
    .join(" ");

  const sidebarStyle: React.CSSProperties = {
    width: `${width}px`,
    top: !isDocked ? `${SPACING}px` : "0",
    left: !isDocked ? `${SPACING}px` : "0",
    height: !isDocked ? `calc(100vh - ${SPACING * 2}px)` : "100vh",
  };

  return (
    <>
      {!isDocked && !isVisible && (
        <div
          className="fixed left-0 top-0 w-2 h-full z-[100]"
          onMouseEnter={() => setIsVisible(true)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={sidebarClasses}
        style={sidebarStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader
            isDocked={isDocked}
            onToggleDock={() => {
              setIsDocked(!isDocked);
              setWidth(DEFAULT_WIDTH);
            }}
            onToggleVisibility={() => setIsVisible(false)}
          />

          <nav className="flex-1 my-2 space-y-2 px-3 overflow-y-auto">
            <NotebookList />
            <CatalogList />
          </nav>
          <SidebarFooter />
        </div>
        {isDocked && (
          <div
            className="absolute right-[-3px] top-0 z-[50] w-[5px] h-full cursor-col-resize transition-all hover:bg-blue-500/50 active:bg-blue-500"
            onMouseDown={handleMouseDown}
          />
        )}
      </aside>
    </>
  );
}
