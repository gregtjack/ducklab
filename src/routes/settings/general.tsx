import { SunIcon, MoonIcon, Monitor } from "lucide-react";
import { useTheme } from "../../components/theme-provider";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { type Theme } from "@/components/theme-provider"
import { createFileRoute } from "@tanstack/react-router";
import { SectionHeader } from "@/components/settings/section-header";

export const Route = createFileRoute("/settings/general")({
  component: GeneralSettings,
});

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-4">
      <section id="theme" className="space-y-4">
        <SectionHeader title="Theme" fragment="theme" />
        <div className="space-y-4">
          <div className="flex">
            <Tabs className="w-full" defaultValue={theme} onValueChange={(value) => setTheme(value as Theme)}>
              <TabsList className="w-full">
                <TabsTrigger value="system">
                  <Monitor />
                  System
                </TabsTrigger>
                <TabsTrigger value="light">
                  <SunIcon />
                  Light
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <MoonIcon />
                  Dark
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
