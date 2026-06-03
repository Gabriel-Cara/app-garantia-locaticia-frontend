import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/query-client";
import { router } from "./router";
import { AuthProvider } from "./providers/auth-provider";
import { TooltipProvider } from "./components/ui/tooltip";

export function App() {
  return (
    <HelmetProvider>
      <ThemeProvider storageKey="doculoc-theme" defaultTheme="light">
        <Helmet titleTemplate="%s | Doculoc" defaultTitle="Doculoc" />

        <Toaster richColors />

        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
