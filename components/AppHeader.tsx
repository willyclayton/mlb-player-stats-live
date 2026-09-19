import Link from "next/link";
import { SearchBox } from "./SearchBox";

export function AppHeader() {
  return (
    <header className="shell">
      <div className="shell-row">
        <Link href="/" className="brand-link">
          MLB
        </Link>
      </div>
      <SearchBox />
    </header>
  );
}
