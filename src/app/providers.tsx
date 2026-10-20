"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/shared/api/client";
import { Toaster } from "@/shared/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // خطای ۴xx تکرار نمی‌شود؛ قطعی گذرا تا دو بار با فاصلهٔ فزاینده.
            retry: (count, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2,
            refetchOnWindowFocus: true,
            networkMode: "offlineFirst",
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
