import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header className="w-full border-b bg-card">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold hover:underline">
            Operations
          </Link>
          <Link
            href="/benchmark"
            className="font-semibold hover:underline"
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
