"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b bg-card">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`font-semibold ${pathname === "/" ? "underline" : "hover:underline"}`}
          >
            Demo
          </Link>
          <Link
            href="/benchmark"
            className={`font-semibold ${pathname === "/benchmark" ? "underline" : "hover:underline"}`}
          >
            Benchmark
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Homomorphic Encryption - IoT Group 8</span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
