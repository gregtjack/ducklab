/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import appCss from "@/styles/app.css?url";
import { seo } from "@/utils/seo";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useDuckDBStore } from "@/store/duckdb-store";
import { Sidebar } from "@/components/sidebar";
import { useEffect } from "react";
import { useNotebookStore } from "@/store/notebook-store";
import interFontCss from "@fontsource-variable/inter?url";
import jetbrainsMonoFontCss from "@fontsource-variable/jetbrains-mono?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "DuckLab | Local-first data analytics",
        description: `DuckLab is a web-based interactive data analysis tool powered by DuckDB.`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: interFontCss },
      { rel: "stylesheet", href: jetbrainsMonoFontCss },
    ],
  }),
  errorComponent: props => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  const initialize = useDuckDBStore(state => state.initialize);

  useEffect(() => {
    initialize().catch(console.error);
    useNotebookStore.persist.rehydrate();
  }, [initialize]);

  return (
    <RootDocument>
      <ThemeProvider defaultTheme="dark">
        <div className="flex h-screen text-gray-900 dark:text-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto transition-[margin] duration-200">
            <Outlet />
          </main>
        </div>

        <Toaster richColors />
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
