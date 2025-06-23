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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">About DuckLab</h1>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-2 leading-relaxed">
            <p>
              DuckLab is an open source, browser-based data analytics tool that runs entirely in your web
              browser. It's built on top of DuckDB, a fast in-memory columnar database that's compiled to WebAssembly.
            </p>
            <p>
              All processing happens locally using DuckDB inside of WebAssembly. Your data never
              leaves your computer.
            </p>
          </div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Features</h2>
          <div className="space-y-4 leading-relaxed">
            <ul className="space-y-1 list-disc list-inside">
              <li>Drag-and-drop file upload (CSV, Parquet, JSON)</li>
              <li>Interactive SQL notebooks with data export, syntax highlighting, and basic auto-completion</li>
              <li>100% client-side processing - no data leaves your browser</li>
              <li>No setup required</li>
            </ul>
          </div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Built With</h2>
          <div className="space-y-4 leading-relaxed">
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
          </div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Open Source</h2>
          <div className="space-y-4 leading-relaxed">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                DuckLab is open source and available on GitHub. Contributions are welcome.
              </p>
              <div className="flex justify-start">
                <a
                  href="https://github.com/gregtjack/ducklab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <Github className="size-4" />
                  View on GitHub
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="text-left">
            <p className="text-muted-foreground text-sm">
              Built by <a href="https://gregtjack.me" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gregtjack</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
