"use client";

import { useEffect, useState } from "react";
import {
  GAME_STATS,
  JUDGE_ITEMS,
  SEASON_STATS,
  type JudgeItem,
} from "@/lib/judge-pairs";

type Pick = "Y" | "N";

function line(items: JudgeItem[], picks: Pick[]): string {
  return items.map((item, i) => `${item.id}${picks[i] ?? ""}`).join(" ");
}

export function JudgePop() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [copied, setCopied] = useState(false);
  const done = picks.length >= JUDGE_ITEMS.length;
  const item = JUDGE_ITEMS[index];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function choose(pick: Pick) {
    if (done || !item) return;
    const next = [...picks, pick];
    setPicks(next);
    setIndex((i) => Math.min(i + 1, JUDGE_ITEMS.length));
    if (next.length === JUDGE_ITEMS.length) {
      const text = `${line(SEASON_STATS, next.slice(0, SEASON_STATS.length))} | ${line(GAME_STATS, next.slice(SEASON_STATS.length))}`;
      try {
        localStorage.setItem("judge-votes-3", text);
      } catch {
        /* ignore */
      }
    }
  }

  async function copy() {
    const text = `${line(SEASON_STATS, picks.slice(0, SEASON_STATS.length))} | ${line(GAME_STATS, picks.slice(SEASON_STATS.length))}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (done) {
    const season = line(SEASON_STATS, picks.slice(0, SEASON_STATS.length));
    const game = line(GAME_STATS, picks.slice(SEASON_STATS.length));
    return (
      <div className="judge-pop">
        <p className="judge-kicker">Done</p>
        <h1>Send this</h1>
        <p className="judge-code">{season}</p>
        <p className="judge-code">{game}</p>
        <button className="btn judge-copy" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  if (!item) return null;

  const inGame = item.section === "game";
  const n = inGame ? index - SEASON_STATS.length + 1 : index + 1;
  const of = inGame ? GAME_STATS.length : SEASON_STATS.length;

  return (
    <div className="judge-pop">
      <p className="judge-kicker">
        {inGame ? "Game" : "Season"} {n} / {of} · keep this?
      </p>
      <div className="judge-card judge-stat">
        <span className="judge-who">{item.who}</span>
        <strong>{item.fact}</strong>
        {item.note ? <span className="judge-note">{item.note}</span> : null}
      </div>
      <div className="judge-actions">
        <button className="judge-card" type="button" onClick={() => choose("Y")}>
          <span className="judge-letter">Y</span>
          <strong>Keep</strong>
        </button>
        <button className="judge-card" type="button" onClick={() => choose("N")}>
          <span className="judge-letter">N</span>
          <strong>Skip</strong>
        </button>
      </div>
    </div>
  );
}
