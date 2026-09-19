"use client";

import { useState } from "react";
import { isTopTake } from "@/lib/top-stat";
import type { CrazyStat } from "@/lib/types";

function TakeCard({ stat }: { stat: CrazyStat }) {
  const top = isTopTake(stat);
  return (
    <article className={`take${top ? " top" : ""}`}>
      {top ? <span className="top-tag">Top stat</span> : null}
      <h2>{stat.headline}</h2>
      <p>{stat.body}</p>
    </article>
  );
}

function TakeSlot({
  label,
  stats,
  tone,
}: {
  label: string;
  stats: CrazyStat[];
  tone: "season" | "game";
}) {
  const start = stats.findIndex(isTopTake);
  const [index, setIndex] = useState(start >= 0 ? start : 0);
  const stat = stats[index];

  return (
    <section className={`take-slot take-slot-${tone}`}>
      <div className="take-head">
        <h2>{label}</h2>
        {stats.length > 1 ? (
          <button
            className="btn ghost"
            type="button"
            onClick={() => setIndex((i) => (i + 1) % stats.length)}
          >
            Another
          </button>
        ) : null}
      </div>
      {stat ? (
        <TakeCard stat={stat} />
      ) : (
        <p className="hint">No official line for this one yet.</p>
      )}
    </section>
  );
}

export function PlayerTake({
  season,
  game,
  gameLabel,
}: {
  season: CrazyStat[];
  game: CrazyStat[];
  gameLabel: string;
}) {
  return (
    <div className="takes">
      <TakeSlot label="Season" stats={season} tone="season" />
      <TakeSlot label={gameLabel} stats={game} tone="game" />
    </div>
  );
}
