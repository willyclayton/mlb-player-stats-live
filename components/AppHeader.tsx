import Link from "next/link";
import { Suspense } from "react";
import { NameToggle } from "./NameToggle";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="shell">
      <div className="shell-row">
        <Link href="/" className="brand-link">
          MLB
        </Link>
        <div className="shell-actions">
          <NameToggle />
          <ThemeToggle />
        </div>
      </div>
      <Suspense fallback={null}>
        <SearchBox />
      </Suspense>
    </header>
  );
}
