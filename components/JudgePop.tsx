"use client";

import { useEffect, useState } from "react";
import { JUDGE_PAIRS } from "@/lib/judge-pairs";

type Pick = "A" | "B";

function line(picks: Pick[]): string {
  return picks.map((pick, i) => `${i + 1}${pick}`).join(" ");
}

export function JudgePop() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [copied, setCopied] = useState(false);
  const done = picks.length >= JUDGE_PAIRS.length;
  const pair = JUDGE_PAIRS[index];

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
        localStorage.setItem("judge-votes", line(next));
      } catch {
        /* ignore */
      }
    }
  }

  async function copy() {
    const text = line(picks);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (done) {
    const text = line(picks);
    return (
      <div className="judge-pop">
        <p className="judge-kicker">Done</p>
        <h1>Send this</h1>
        <p className="judge-code">{text}</p>
        <button className="btn judge-copy" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <ol className="judge-log">
          {JUDGE_PAIRS.map((item, i) => (
            <li key={item.id}>
              <b>{i + 1}{picks[i]}</b> {(picks[i] === "A" ? item.a : item.b).fact}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (!pair) return null;

  return (
    <div className="judge-pop">
      <p className="judge-kicker">
        {index + 1} / {JUDGE_PAIRS.length} · better stat
      </p>
      <button className="judge-card" type="button" onClick={() => choose("A")}>
        <span className="judge-letter">A</span>
        {pair.a.who ? <span className="judge-who">{pair.a.who}</span> : null}
        <strong>{pair.a.fact}</strong>
        {pair.a.note ? <span className="judge-note">{pair.a.note}</span> : null}
      </button>
      <button className="judge-card" type="button" onClick={() => choose("B")}>
        <span className="judge-letter">B</span>
        {pair.b.who ? <span className="judge-who">{pair.b.who}</span> : null}
        <strong>{pair.b.fact}</strong>
        {pair.b.note ? <span className="judge-note">{pair.b.note}</span> : null}
      </button>
    </div>
  );
}
