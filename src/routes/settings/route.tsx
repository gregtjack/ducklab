import { createFileRoute } from "@tanstack/react-router";
import { Settings, Settings2 } from "lucide-react";
import { Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type SettingsSection = "general" | "duckdb";

const pages = [
  {
    id: "general" as SettingsSection,
    title: "General",
    path: "/settings/general",
    description: "Basic application settings",
    icon: (
      <div className="size-6 bg-green-500/20 rounded-sm flex items-center justify-center">
        <Settings2 className="size-4 text-green-500" />
      </div>
    ),
  },
  {
    id: "duckdb" as SettingsSection,
    title: "DuckDB",
    path: "/settings/duckdb",
    description: "Database configuration and status",
    icon: (
      <div className="size-6 bg-black dark:bg-[#FFF000] rounded-sm flex items-center justify-center">
        <svg
          className="fill-[#FFF000] dark:fill-black size-4"
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>DuckDB</title>
          <path d="M12 0C5.363 0 0 5.363 0 12s5.363 12 12 12 12-5.363 12-12S18.637 0 12 0zM9.502 7.03a4.974 4.974 0 0 1 4.97 4.97 4.974 4.974 0 0 1-4.97 4.97A4.974 4.974 0 0 1 4.532 12a4.974 4.974 0 0 1 4.97-4.97zm6.563 3.183h2.351c.98 0 1.787.782 1.787 1.762s-.807 1.789-1.787 1.789h-2.351v-3.551z" />
        </svg>
      </div>
    ),
  },
];

function SettingsPage() {
  return (
    <div>
      <div className="container px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-60">
            <nav className="space-y-1">
              {pages.map(page => {
                return (
                  <Link
                    key={page.id}
                    className="flex items-center w-full justify-start hover:bg-accent gap-3 p-1.5 rounded-md"
                    activeOptions={{ exact: true }}
                    activeProps={{
                      className: "bg-accent font-bold",
                    }}
                    to={page.path}
                  >
                    {page.icon}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{page.title}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1 max-w-4xl">
            <div className="px-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
