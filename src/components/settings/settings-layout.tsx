import { useState } from "react";
import { Database, Settings2 } from "lucide-react";
import { DuckDBSettings } from "./duckdb-settings";
import { GeneralSettings } from "./general-settings";
import { match } from "ts-pattern";

type SettingsSection = "general" | "duckdb";

const sections = [
  {
    id: "general" as SettingsSection,
    title: "General",
    description: "Basic application settings",
    icon: Settings2,
  },
  {
    id: "duckdb" as SettingsSection,
    title: "DuckDB",
    description: "Database configuration and status",
    icon: Database,
  },
];

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  return (
    <div className="flex gap-2">
      {/* Settings Sidebar */}
      <div className="w-48">
        <nav className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                className={`flex items-center w-full justify-start hover:bg-accent gap-3 px-2 py-1.5 rounded-md transition-colors ${
                  isActive ? "bg-accent" : ""
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="size-4" />
                <div className="flex-1 text-left">
                  <div className="text-sm">{section.title}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="px-6">
          {match(activeSection)
            .with("general", () => <GeneralSettings />)
            .with("duckdb", () => <DuckDBSettings />)
            .otherwise(() => (
              <GeneralSettings />
            ))}
        </div>
      </div>
    </div>
  );
}
