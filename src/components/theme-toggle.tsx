"use client";
import { copy } from "@/messages";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button theme-button"
      aria-label={copy.rangMavzusiniAlmashtirish}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="sun" />
      <Moon className="moon" />
    </button>
  );
}
