"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Headshot } from "./Headshot";
import { LeaderCard, PlayerCard } from "./PlayerCard";
import type { HomePayload, PlayerRef } from "@/lib/types";

export function HomeClient({ initial }: { initial: HomePayload }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerRef[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { players?: PlayerRef[] };
        setResults(data.players ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  const lineupPlayers = useMemo(() => {
    const seen = new Map<number, PlayerRef>();
    for (const game of initial.games) {
      for (const player of game.players) {
        if (!seen.has(player.id)) seen.set(player.id, player);
      }
    }
    return [...seen.values()].slice(0, 24);
  }, [initial.games]);

  return (
    <>
      <header className="topbar">
        <div>
          <div className="kicker">MLB 2026 · Live feed</div>
          <h1 className="brand">Crazy Stats</h1>
          <p className="lede">
            Tap a player. We pull the live numbers. Then we find the stat that
            should not be real.
          </p>
        </div>
        <div className="live-dot">Live</div>
      </header>

      <div className="search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any MLB player"
          aria-label="Search players"
        />
        {query.trim().length >= 2 ? (
          <div className="search-list" role="listbox">
            {searching && results.length === 0 ? (
              <div className="search-item muted">Searching live roster…</div>
            ) : null}
            {!searching && results.length === 0 ? (
              <div className="search-item muted">No players found</div>
            ) : null}
            {results.map((player) => (
              <Link
                key={player.id}
                className="search-item"
                href={`/player/${player.id}?name=${encodeURIComponent(player.name)}&pos=${encodeURIComponent(player.position ?? "")}`}
              >
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

      <section className="section">
        <h2>{initial.slateLabel}</h2>
        <p className="hint">Click anyone on a card. The feed does the rest.</p>
        <div className="row-scroll">
          {initial.games.map((game) => (
            <div className="game-chip" key={game.gamePk}>
              <div className="meta">{game.status}</div>
              <div className="score">
                {game.away.abbr ?? game.away.name} {game.away.score ?? ""}
              </div>
              <div className="score">
                {game.home.abbr ?? game.home.name} {game.home.score ?? ""}
              </div>
            </div>
          ))}
        </div>
        <div className="row-scroll" style={{ marginTop: 12 }}>
          {lineupPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>League heaters</h2>
        <p className="hint">2026 leaders, live from MLB. Tap for the crazy stat.</p>
        <h3 className="kicker" style={{ margin: "12px 0 8px" }}>Home runs</h3>
        <div className="grid">
          {initial.heaters.homeRuns.slice(0, 4).map((p) => (
            <LeaderCard key={`hr-${p.id}`} player={p} value={`${p.value} HR`} />
          ))}
        </div>
        <h3 className="kicker" style={{ margin: "16px 0 8px" }}>OPS</h3>
        <div className="grid">
          {initial.heaters.ops.slice(0, 4).map((p) => (
            <LeaderCard key={`ops-${p.id}`} player={p} value={p.value} />
          ))}
        </div>
        <h3 className="kicker" style={{ margin: "16px 0 8px" }}>Stolen bases</h3>
        <div className="grid">
          {initial.heaters.stolenBases.slice(0, 4).map((p) => (
            <LeaderCard key={`sb-${p.id}`} player={p} value={`${p.value} SB`} />
          ))}
        </div>
        <h3 className="kicker" style={{ margin: "16px 0 8px" }}>ERA</h3>
        <div className="grid">
          {initial.heaters.era.slice(0, 4).map((p) => (
            <LeaderCard key={`era-${p.id}`} player={p} value={p.value} />
          ))}
        </div>
        <h3 className="kicker" style={{ margin: "16px 0 8px" }}>Strikeouts</h3>
        <div className="grid">
          {initial.heaters.strikeouts.slice(0, 4).map((p) => (
            <LeaderCard key={`k-${p.id}`} player={p} value={`${p.value} K`} />
          ))}
        </div>
      </section>

      <p className="footer">Live numbers via MLB Stats API · {initial.asOf}</p>
    </>
  );
}
