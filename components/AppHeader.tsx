import Link from "next/link";
import { SearchBox } from "./SearchBox";

export function AppHeader() {
  return (
    <header className="shell">
      <div className="shell-row">
        <Link href="/" className="brand-link">
          Crazy Stats
        </Link>
        <span className="live-dot">Live</span>
      </div>
      <SearchBox />
    </header>
  );
}
