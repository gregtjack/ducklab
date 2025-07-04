import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
              <h1 className="text-2xl font-bold">About DuckPad</h1>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-2 leading-relaxed">
            <p>
              DuckPad is a simple data analytics tool that runs entirely in your web
              browser. It's built on top of{" "}
              <a
                className="text-primary hover:underline"
                href="https://duckdb.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                DuckDB
              </a>
              , a fast in-memory columnar database powered by WebAssembly.
            </p>
            <p>All data processing happens locally, so your data never leaves your computer.</p>
          </div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Features</h2>
          <div className="space-y-4 leading-relaxed">
            <ul className="space-y-1 list-disc list-inside">
              <li>
                Drag-and-drop file upload (CSV, Parquet, JSON - Excel/XLSX may be supported in the
                future)
              </li>
              <li>
                Interactive SQL notebooks with data export, syntax highlighting, and basic
                auto-completion
              </li>
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
              <p>DuckPad is open source and available on GitHub.</p>
              <div className="flex justify-start">
                <Button asChild>
                  <a
                    href="https://github.com/gregtjack/ducklab"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="size-4" />
                    View on GitHub
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="text-left">
            <p className="text-muted-foreground text-sm">
              Built by{" "}
              <a
                href="https://gregtjack.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                gregtjack
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
