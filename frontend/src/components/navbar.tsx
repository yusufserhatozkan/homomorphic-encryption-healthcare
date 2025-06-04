import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <nav className="w-full p-4 border-b mb-8">
      <div className="max-w-6xl mx-auto flex flex-row justify-between items-center">
        <Link href="/" className="font-semibold hover:underline">
          Homomorphic Encryption - Group 8
        </Link>
        <div className="space-x-8">
          <Link href="/" className="font-semibold hover:underline">
            Operations
          </Link>
          <Link
            href="/benchmark-visualization"
            className="font-semibold hover:underline"
          >
            Benchmark
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
