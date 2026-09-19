import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="shell">
      <div className="shell-row">
        <Link href="/" className="brand-link">
          MLB
        </Link>
        <ThemeToggle />
      </div>
      <SearchBox />
    </header>
  );
}
