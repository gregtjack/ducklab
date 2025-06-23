import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { SettingsLayout } from "@/components/settings/settings-layout";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <div className="container mx-auto p-5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
        <SettingsLayout />
      </div>
    </div>
  );
}
