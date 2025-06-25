import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">404</span>
          </div>
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            {children || "The page you are looking for does not exist."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">
              <Home className="size-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
