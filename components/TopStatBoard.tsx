"use client";

import { useState } from "react";
import { TopCard } from "./PlayerCard";
import type { TopStatCard } from "@/lib/types";

type Scope = "game" | "season";

export function TopStatBoard({ cards }: { cards: TopStatCard[] }) {
  const [scope, setScope] = useState<Scope>("game");
  const shown = cards.filter((card) => (card.scope ?? "game") === scope);

  if (cards.length === 0) return null;

  return (
    <section className="section">
      <div className="take-head">
        <h2>Top stat</h2>
        <div className="top-toggle" role="tablist" aria-label="Top stat range">
          <button
            className={`team-chip${scope === "game" ? " on" : ""}`}
            type="button"
            onClick={() => setScope("game")}
            aria-pressed={scope === "game"}
          >
            Today
          </button>
          <button
            className={`team-chip${scope === "season" ? " on" : ""}`}
            type="button"
            onClick={() => setScope("season")}
            aria-pressed={scope === "season"}
          >
            Season
          </button>
        </div>
      </div>
      {shown.length ? (
        <div className="top-list">
          {shown.map((player) => (
            <TopCard
              key={`${player.id}-${player.feat}-${player.gamePk ?? "szn"}`}
              player={player}
            />
          ))}
        </div>
      ) : (
        <p className="hint">
          {scope === "game"
            ? "No rare line on the board today."
            : "No rare season line yet."}
        </p>
      )}
    </section>
  );
}
