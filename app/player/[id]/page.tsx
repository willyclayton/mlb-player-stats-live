import Link from "next/link";
import { notFound } from "next/navigation";
import { Headshot } from "@/components/Headshot";
import { PlayerTake } from "@/components/PlayerTake";
import { fmtAvg, fmtEra, fmtIp, fmtOps, prettyDate, slash } from "@/lib/format";
import { getPlayer } from "@/lib/mlb";

export const revalidate = 45;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  let data;
  try {
    data = await getPlayer(id);
  } catch {
    notFound();
  }

  const { player } = data;

  return (
    <>
      <div className="topbar">
        <Link className="back" href="/">
          ← Players
        </Link>
        <div className="live-dot">Live</div>
      </div>

      <div className="hero">
        <Headshot id={player.id} name={player.name} size={360} />
        <div>
          <div className="kicker">{player.team || "MLB"}</div>
          <h1>{player.name}</h1>
          <div className="pills">
            {player.position ? <span className="pill">{player.position}</span> : null}
            {player.number ? <span className="pill">#{player.number}</span> : null}
            {player.bats ? <span className="pill">B {player.bats[0]}</span> : null}
            {player.throws ? <span className="pill">T {player.throws[0]}</span> : null}
          </div>
        </div>
      </div>

      <PlayerTake crazy={data.crazy} liveNote={data.liveNote} />

      {data.seasonHit ? (
        <section className="section">
          <h2>Season</h2>
          <div className="strip">
            <Stat label="AVG" value={fmtAvg(data.seasonHit.avg)} />
            <Stat label="OPS" value={fmtOps(data.seasonHit.ops)} />
            <Stat label="HR" value={String(data.seasonHit.homeRuns)} />
            <Stat label="SB" value={String(data.seasonHit.stolenBases)} />
          </div>
          <p className="hint">
            {slash(data.seasonHit)} · {data.seasonHit.rbi} RBI
            {data.recentHit.last15 ? ` · L15 OPS ${fmtOps(data.recentHit.last15.ops)}` : ""}
          </p>
        </section>
      ) : null}

      {data.seasonPitch ? (
        <section className="section">
          <h2>Pitching</h2>
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
          <h2>Last 5</h2>
          <div className="log">
            {data.lastHitGames.map((g) => (
              <div className="log-row" key={`${g.date}-${g.opponent}`}>
                <div className="muted">{prettyDate(g.date)}</div>
                <div>
                  {g.isHome ? "vs" : "@"} {g.opponent}
                </div>
                <div>{g.line}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
