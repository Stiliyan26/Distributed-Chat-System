import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "../queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/context/auth/AuthProvider";
import { ThemeProvider } from "@/context/theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
