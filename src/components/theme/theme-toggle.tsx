import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "./use-theme"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function resolveTheme() {
    if (theme === "system") {
      if (typeof window === "undefined") {
        return "light"
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return theme
  }

  function handleToggle() {
    const current = resolveTheme()
    setTheme(current === "dark" ? "light" : "dark")
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-11 w-11 md:h-9 md:w-9"
      onClick={handleToggle}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
