import { NotebookView } from "@/components/notebook/notebook-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="h-full">
      <NotebookView />
    </div>
  );
}
