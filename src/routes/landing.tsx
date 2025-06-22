import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Code,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Play,
  Upload,
  BarChart3,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/landing")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Local-first
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
            DuckLab
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            DuckLab is a modern browser-based data analysis platform powered by DuckDB and
            WebAssembly. Explore, analyze, and visualize your data with SQL notebooks.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Easy Data Import</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Upload CSV, Parquet, JSON, and Excel files directly in your browser
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">SQL Notebooks</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Write and execute SQL queries in interactive notebook cells
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">DuckDB Powered</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Lightning-fast analytical queries with DuckDB's columnar engine
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Data Visualization</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Built-in charting and data exploration capabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Privacy First</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                All data processing happens locally in your browser
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">No Setup Required</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Works instantly in any modern web browser
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started with data analysis in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                {window.innerWidth > 768 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Your Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Drag and drop your data files (CSV, Parquet, JSON, Excel) into the application.
                DataKite will automatically detect the format and load it into DuckDB.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                {window.innerWidth > 768 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-y-1/2"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3">Explore with SQL</h3>
              <p className="text-muted-foreground leading-relaxed">
                Write SQL queries in notebook cells to explore your data. Get intelligent
                autocomplete and syntax highlighting for a smooth experience.
              </p>
            </div>

            <div className="text-center group">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Analyze & Visualize</h3>
              <p className="text-muted-foreground leading-relaxed">
                View query results in interactive tables and charts. Save your work in notebooks for
                future reference.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Formats Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Supported File Formats</h2>
            <p className="text-muted-foreground text-lg">
              Import data from a wide variety of popular formats
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "CSV", color: "from-blue-500 to-blue-600" },
              { name: "Parquet", color: "from-green-500 to-green-600" },
              { name: "JSON", color: "from-yellow-500 to-yellow-600" },
              { name: "Excel", color: "from-emerald-500 to-emerald-600" },
            ].map(format => (
              <div
                key={format.name}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r ${format.color} hover:scale-105 transition-transform duration-200 shadow-lg`}
              >
                <FileText className="h-4 w-4" />
                {format.name}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Jump right in and start analyzing your data with DataKite.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Analyzing
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
