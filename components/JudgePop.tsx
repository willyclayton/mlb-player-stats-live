"use client";

import { useEffect, useState } from "react";
import { JUDGE_PAIRS, STAT_PAIRS, WORD_PAIRS, type JudgePair } from "@/lib/judge-pairs";

type Pick = "A" | "B";

function line(pairs: JudgePair[], picks: Pick[]): string {
  return pairs
    .map((pair, i) => `${pair.id}${picks[i] ?? ""}`)
    .join(" ");
}

function Side({
  letter,
  pair,
  onPick,
}: {
  letter: "A" | "B";
  pair: JudgePair;
  onPick: (pick: Pick) => void;
}) {
  const side = letter === "A" ? pair.a : pair.b;
  return (
    <button className="judge-card" type="button" onClick={() => onPick(letter)}>
      <span className="judge-letter">{letter}</span>
      <span className="judge-who">{side.scope}</span>
      <strong>{side.fact}</strong>
      {side.note ? <span className="judge-note">{side.note}</span> : null}
    </button>
  );
}

export function JudgePop() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [copied, setCopied] = useState(false);
  const done = picks.length >= JUDGE_PAIRS.length;
  const pair = JUDGE_PAIRS[index];
  const inWords = Boolean(pair && pair.section === "word");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function choose(pick: Pick) {
    if (done || !pair) return;
    const next = [...picks, pick];
    setPicks(next);
    setIndex((i) => Math.min(i + 1, JUDGE_PAIRS.length));
    if (next.length === JUDGE_PAIRS.length) {
      try {
        localStorage.setItem(
          "judge-votes-2",
          `${line(STAT_PAIRS, next.slice(0, STAT_PAIRS.length))} | ${line(WORD_PAIRS, next.slice(STAT_PAIRS.length))}`,
        );
      } catch {
        /* ignore */
      }
    }
  }

  async function copy() {
    const text = `${line(STAT_PAIRS, picks.slice(0, STAT_PAIRS.length))} | ${line(WORD_PAIRS, picks.slice(STAT_PAIRS.length))}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (done) {
    const stats = line(STAT_PAIRS, picks.slice(0, STAT_PAIRS.length));
    const words = line(WORD_PAIRS, picks.slice(STAT_PAIRS.length));
    return (
      <div className="judge-pop">
        <p className="judge-kicker">Done</p>
        <h1>Send this</h1>
        <p className="judge-code">{stats}</p>
        <p className="judge-code">{words}</p>
        <button className="btn judge-copy" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  if (!pair) return null;

  const label = inWords ? "shorter or overkill" : "better stat";
  const n = inWords ? index - STAT_PAIRS.length + 1 : index + 1;
  const of = inWords ? WORD_PAIRS.length : STAT_PAIRS.length;

  return (
    <div className="judge-pop">
      <p className="judge-kicker">
        {inWords ? "Word" : "Stat"} {n} / {of} · {label}
      </p>
      <Side letter="A" pair={pair} onPick={choose} />
      <Side letter="B" pair={pair} onPick={choose} />
    </div>
  );
}
