import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Github, ExternalLink, Shield } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">About DuckLab</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <div className="space-y-2 leading-relaxed">
            <p>
              DuckLab is a browser-based data analysis platform that runs entirely in your web
              browser. Upload CSV, Parquet, JSON, or Excel files and analyze them using SQL queries
              in interactive notebooks.
            </p>
            <p>
              All processing happens locally using DuckDB inside of WebAssembly. Your data never
              leaves your computer.
            </p>
          </div>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Drag-and-drop file upload (CSV, Parquet, JSON, Excel)</li>
                  <li>Interactive SQL notebooks with syntax highlighting</li>
                  <li>Built-in data visualization and charting</li>
                  <li>100% client-side processing - no data leaves your browser</li>
                  <li>No setup or installation required</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Built With</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    "DuckDB (WASM)",
                    "React",
                    "TypeScript",
                    "TanStack Router",
                    "Tailwind CSS",
                    "Apache Arrow",
                  ].map(tech => (
                    <Badge key={tech} variant="secondary" className="text-sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Source */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Open Source
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  DuckLab is open source and available on GitHub. Contributions, bug reports, and
                  feature requests are welcome.
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://github.com/yourusername/datakite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Built with <Heart className="inline h-4 w-4 text-red-500" /> and open source tools
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
