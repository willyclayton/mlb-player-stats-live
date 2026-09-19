"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Headshot } from "./Headshot";
import { fmtAvg, fmtEra, fmtIp, fmtOps, prettyDate, slash } from "@/lib/format";
import type { CrazyStat, PlayerPayload } from "@/lib/types";

const FEED_LINES = [
  "Connecting to MLB live feed…",
  "Pulling season line…",
  "Reading last 15 game logs…",
  "Comparing splits against the league…",
  "Hunting for the number that should not exist…",
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

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

export function PlayerClient({
  id,
  hintName,
  hintTeam,
  hintPos,
}: {
  id: number;
  hintName?: string;
  hintTeam?: string;
  hintPos?: string;
}) {
  const [data, setData] = useState<PlayerPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedTick, setFeedTick] = useState(0);
  const [takeIndex, setTakeIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setTakeIndex(0);
    setFeedTick(0);
    const tick = window.setInterval(() => {
      setFeedTick((n) => n + 1);
    }, 420);
    fetch(`/api/player/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load player");
        return json as PlayerPayload;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      })
      .finally(() => {
        window.clearInterval(tick);
      });
    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [id]);

  const featured = data?.crazy[takeIndex] ?? data?.featured;
  const others = useMemo(
    () => (data ? data.crazy.filter((_, i) => i !== takeIndex).slice(0, 3) : []),
    [data, takeIndex],
  );

  const name = data?.player.name ?? hintName ?? "Player";
  const team = data?.player.team ?? hintTeam;
  const pos = data?.player.position ?? hintPos;

  return (
    <>
      <div className="topbar">
        <Link className="back" href="/">
          ← Players
        </Link>
        <div className="live-dot">Live data</div>
      </div>

      <div className="hero">
        <Headshot id={id} name={name} size={360} />
        <div>
          <div className="kicker">{team || "MLB"}</div>
          <h1>{name}</h1>
          <div className="pills">
            {pos ? <span className="pill">{pos}</span> : null}
            {data?.player.number ? <span className="pill">#{data.player.number}</span> : null}
            {data?.player.bats ? <span className="pill">B {data.player.bats[0]}</span> : null}
            {data?.player.throws ? <span className="pill">T {data.player.throws[0]}</span> : null}
          </div>
        </div>
      </div>

      {!data && !error ? (
        <div className="feed" aria-live="polite">
          <div className="kicker">Sending live data to stats</div>
          {FEED_LINES.slice(0, Math.min(FEED_LINES.length, feedTick + 1)).map((line) => (
            <div className="feed line" key={line} style={{ background: "transparent", border: 0, padding: 0 }}>
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {error ? <div className="err">{error}</div> : null}

      {data && featured ? (
        <>
          <TakeCard stat={featured} />
          <div className="actions">
            {data.crazy.length > 1 ? (
              <button
                className="btn"
                type="button"
                onClick={() => setTakeIndex((i) => (i + 1) % data.crazy.length)}
              >
                Another take
              </button>
            ) : null}
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                const text = `${featured.stamp}: ${featured.body}`;
                try {
                  await navigator.clipboard.writeText(text);
                } catch {
                  /* ignore */
                }
              }}
            >
              Copy the take
            </button>
          </div>
          {data.liveNote ? <p className="hint" style={{ color: "var(--dim)", marginTop: 12 }}>{data.liveNote}</p> : null}

          {data.seasonHit ? (
            <section className="section">
              <h2>Season, live</h2>
              <div className="strip">
                <Stat label="AVG" value={fmtAvg(data.seasonHit.avg)} />
                <Stat label="OPS" value={fmtOps(data.seasonHit.ops)} />
                <Stat label="HR" value={String(data.seasonHit.homeRuns)} />
                <Stat label="SB" value={String(data.seasonHit.stolenBases)} />
              </div>
              <div className="strip">
                <Stat label="RBI" value={String(data.seasonHit.rbi)} />
                <Stat label="BB" value={String(data.seasonHit.walks)} />
                <Stat label="SO" value={String(data.seasonHit.strikeOuts)} />
                <Stat label="H" value={String(data.seasonHit.hits)} />
              </div>
              <p className="hint" style={{ marginTop: 10 }}>
                Slash {slash(data.seasonHit)}
              </p>
            </section>
          ) : null}

          {data.recentHit.last15 ? (
            <section className="section">
              <h2>Recent heat</h2>
              <div className="strip">
                <Stat label="L7 AVG" value={data.recentHit.last7 ? fmtAvg(data.recentHit.last7.avg) : "—"} />
                <Stat label="L15 OPS" value={fmtOps(data.recentHit.last15.ops)} />
                <Stat label="L15 HR" value={String(data.recentHit.last15.homeRuns)} />
                <Stat label="L30 OPS" value={data.recentHit.last30 ? fmtOps(data.recentHit.last30.ops) : "—"} />
              </div>
            </section>
          ) : null}

          {data.seasonPitch ? (
            <section className="section">
              <h2>On the mound</h2>
              <div className="strip">
                <Stat label="ERA" value={fmtEra(data.seasonPitch.era)} />
                <Stat label="WHIP" value={data.seasonPitch.whip.toFixed(2)} />
                <Stat label="K" value={String(data.seasonPitch.strikeOuts)} />
                <Stat label="IP" value={fmtIp(data.seasonPitch.innings)} />
              </div>
            </section>
          ) : null}

          {data.lastHitGames.length ? (
            <section className="section">
              <h2>Game log</h2>
              <div className="log">
                {data.lastHitGames.map((g) => (
                  <div className="log-row" key={`${g.date}-${g.opponent}`}>
                    <div className="muted">{prettyDate(g.date)}</div>
                    <div>{g.isHome ? "vs" : "@"} {g.opponent}</div>
                    <div>{g.summary || `${g.hits}-${g.atBats}`}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {others.length ? (
            <section className="section">
              <h2>More takes</h2>
              {others.map((stat) => (
                <button
                  key={stat.id}
                  className="more-take"
                  type="button"
                  onClick={() => {
                    const idx = data.crazy.findIndex((s) => s.id === stat.id);
                    if (idx >= 0) setTakeIndex(idx);
                  }}
                  style={{ width: "100%", textAlign: "left", color: "inherit", cursor: "pointer" }}
                >
                  <strong>{stat.headline}</strong>
                  {stat.body}
                </button>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
