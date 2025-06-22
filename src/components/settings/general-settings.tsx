import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Save, Download, Upload } from "lucide-react";
import { useTheme } from "../theme-provider";

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">General Settings</h3>
        <p className="text-muted-foreground">Configure basic application preferences</p>
      </div>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application
          </CardTitle>
          <CardDescription>Basic application behavior and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme">Theme</Label>
              <p className="text-sm text-muted-foreground">Select the theme for the application</p>
            </div>
            <Select defaultValue={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto-save</Label>
              <p className="text-sm text-muted-foreground">Automatically save your work</p>
            </div>
            <Switch id="auto-save" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-sm text-muted-foreground">Show desktop notifications</p>
            </div>
            <Switch id="notifications" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve DuckLab with anonymous usage data
              </p>
            </div>
            <Switch id="analytics" />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>Set your preferred language and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="en">
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="auto">
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Time</SelectItem>
                <SelectItem value="cst">Central Time</SelectItem>
                <SelectItem value="mst">Mountain Time</SelectItem>
                <SelectItem value="pst">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-format">Date Format</Label>
            <Select defaultValue="mm/dd/yyyy">
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your data and export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="local-storage">Local Storage</Label>
              <p className="text-sm text-muted-foreground">Store data locally in your browser</p>
            </div>
            <Switch id="local-storage" defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="backup-interval">Backup Interval</Label>
            <Select defaultValue="daily">
              <SelectTrigger>
                <SelectValue placeholder="Select backup interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>

          <Button variant="destructive" className="w-full">
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Optimize application performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="query-cache">Query Cache</Label>
              <p className="text-sm text-muted-foreground">
                Cache query results for faster performance
              </p>
            </div>
            <Switch id="query-cache" defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="cache-size">Cache Size Limit</Label>
            <Select defaultValue="100mb">
              <SelectTrigger>
                <SelectValue placeholder="Select cache size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50mb">50 MB</SelectItem>
                <SelectItem value="100mb">100 MB</SelectItem>
                <SelectItem value="250mb">250 MB</SelectItem>
                <SelectItem value="500mb">500 MB</SelectItem>
                <SelectItem value="1gb">1 GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-optimize">Auto-optimize</Label>
              <p className="text-sm text-muted-foreground">
                Automatically optimize database performance
              </p>
            </div>
            <Switch id="auto-optimize" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
