"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Headshot } from "./Headshot";
import { playerHref } from "@/lib/href";
import type { PlayerRef } from "@/lib/types";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerRef[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const ac = new AbortController();
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = (await res.json()) as { players?: PlayerRef[] };
        setResults(data.players ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => {
      window.clearTimeout(handle);
      ac.abort();
    };
  }, [query]);

  return (
    <div className="search">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a player"
        aria-label="Search players"
      />
      {query.trim().length >= 2 ? (
        <div className="search-list" role="listbox">
          {searching && results.length === 0 ? (
            <div className="search-item muted">Searching…</div>
          ) : null}
          {!searching && results.length === 0 ? (
            <div className="search-item muted">No players found</div>
          ) : null}
          {results.map((player) => (
            <Link key={player.id} className="search-item" href={playerHref(player)}>
              <Headshot id={player.id} name={player.name} size={80} />
              <div>
                <div className="name">{player.name}</div>
                <div className="muted">{player.position || "MLB"}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
