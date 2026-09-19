"use client";

import { useState } from "react";
import type { CrazyStat } from "@/lib/types";

function TakeCard({ stat }: { stat: CrazyStat }) {
  return (
    <article className="take">
      <span className="stamp">{stat.stamp}</span>
      <h2>{stat.headline}</h2>
      <p>{stat.body}</p>
      {stat.receipts.length ? (
        <div className="receipts">
          {stat.receipts.map((r) => (
            <div className="receipt" key={`${stat.id}-${r.label}`}>
              <div className="lbl">{r.label}</div>
              <div className="val">{r.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function PlayerTake({
  crazy,
  liveNote,
}: {
  crazy: CrazyStat[];
  liveNote?: string;
}) {
  const [index, setIndex] = useState(0);
  const featured = crazy[index];
  if (!featured) return null;

  return (
    <>
      <TakeCard stat={featured} />
      <div className="actions">
        {crazy.length > 1 ? (
          <button
            className="btn"
            type="button"
            onClick={() => setIndex((i) => (i + 1) % crazy.length)}
          >
            Another take
          </button>
        ) : null}
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(`${featured.stamp}: ${featured.body}`);
          }}
        >
          Copy
        </button>
      </div>
      {liveNote ? <p className="hint">{liveNote}</p> : null}
    </>
  );
}
