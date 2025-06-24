import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotebookStore } from "@/store/notebook-store";
import { Plus, Notebook, FileSpreadsheetIcon, PlusIcon } from "lucide-react";
import { FileUpload } from "@/components/catalog/file-upload";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { notebooks, createNotebook } = useNotebookStore();
  const navigate = useNavigate();
  const recentNotebooks = notebooks
    .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
    .slice(0, 5);

  const handleCreateNotebook = async () => {
    const notebookId = await createNotebook();
    navigate({ to: "/notebook/$id", params: { id: notebookId } });
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-4">
        <p className="text-lg font-medium">Welcome to DuckPad!</p>
        <p className="text-sm text-muted-foreground">Choose a quick action to get started</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-2">
        <Button variant="outline" onClick={handleCreateNotebook} className="w-full sm:w-auto">
          <PlusIcon />
          Create notebook
        </Button>
        <FileUpload>
          <Button variant="outline" className="w-full sm:w-auto">
            <FileSpreadsheetIcon />
            Import data
          </Button>
        </FileUpload>
      </div>

      {/* Recent Notebooks */}
      {notebooks.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg">Recent notebooks</h2>
          <div className="grid gap-3">
            {recentNotebooks.map(notebook => (
              <Link key={notebook.id} to="/notebook/$id" params={{ id: notebook.id }}>
                <Card className="shadow-none cursor-pointer transition-transform duration-200 hover:scale-102">
                  <CardContent className="px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 text-2xl rounded-lg flex items-center justify-center">
                        {notebook.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{notebook.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notebook.cells.length} cell{notebook.cells.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Notebook className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No notebooks yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first notebook to start analyzing data
          </p>
          <Button onClick={handleCreateNotebook}>
            <Plus className="h-4 w-4 mr-2" />
            Create Notebook
          </Button>
        </div>
      )}
    </div>
  );
}
