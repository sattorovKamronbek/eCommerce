"use client";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { useShop } from "@/stores/shop";
export function Providers({ children, defaultTheme = "light", enableSystem = false }: {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
}) {
  useEffect(() => {
    void useShop.persist.rehydrate();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem={enableSystem}>
      {children}
    </ThemeProvider>
  );
}
