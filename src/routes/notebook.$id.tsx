import { NotebookView } from "@/components/notebook/notebook-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notebook/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-full">
      <NotebookView />
    </div>
  );
}
