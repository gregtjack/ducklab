import { SunIcon, MoonIcon, Monitor } from "lucide-react";
import { useTheme } from "../theme-provider";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { type Theme } from "@/components/theme-provider"

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Theme</h2>
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
    </div>
  );
}
