import Link from "next/link";
import { notFound } from "next/navigation";
import { Headshot } from "@/components/Headshot";
import { PlayerTake } from "@/components/PlayerTake";
import { Matchup } from "@/components/TeamLabel";
import { fmtAvg, fmtEra, fmtIp, fmtOps, prettyDate, shortTeamName } from "@/lib/format";
import { gameHref } from "@/lib/href";
import { getGame, getPlayer } from "@/lib/mlb";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ game?: string }>;
}) {
  const id = Number((await params).id);
  const gamePk = Number((await searchParams).game);
  if (!Number.isFinite(id)) notFound();

  let data;
  try {
    data = await getPlayer(id, Number.isFinite(gamePk) ? gamePk : undefined);
  } catch {
    notFound();
  }

  const game = Number.isFinite(gamePk)
    ? await getGame(gamePk).catch(() => null)
    : null;
  const inGame = game
    ? [...game.away.players, ...game.home.players].some((p) => p.id === id)
    : false;
  const { player } = data;

  return (
    <>
      <nav className="crumb">
        <Link href="/">Games</Link>
        {game && inGame ? (
          <>
            <span>/</span>
            <Link href={gameHref(game.gamePk)}>
              <Matchup away={game.away} home={game.home} />
            </Link>
          </>
        ) : null}
      </nav>

      <div className={`hero${player.topStat ? " top" : ""}`}>
        <Headshot id={player.id} name={player.name} size={240} />
        <div>
          {player.topStat ? <div className="top-tag">Top stat</div> : null}
          <div className="kicker">{player.team || "MLB"}</div>
          <h1>{player.name}</h1>
        </div>
      </div>

      {data.seasonHit ? (
        <div className="strip live-strip">
          <Stat label="AVG" value={fmtAvg(data.seasonHit.avg)} />
          <Stat label="OPS" value={fmtOps(data.seasonHit.ops)} />
          <Stat label="HR" value={String(data.seasonHit.homeRuns)} />
          <Stat label="SB" value={String(data.seasonHit.stolenBases)} />
        </div>
      ) : null}

      {data.seasonPitch ? (
        <div className="strip live-strip">
          <Stat label="ERA" value={fmtEra(data.seasonPitch.era)} />
          <Stat label="WHIP" value={data.seasonPitch.whip.toFixed(2)} />
          <Stat label="K" value={String(data.seasonPitch.strikeOuts)} />
          <Stat label="IP" value={fmtIp(data.seasonPitch.innings)} />
        </div>
      ) : null}

      <PlayerTake
        season={data.seasonTakes}
        game={data.gameTakes}
        gameLabel={data.gameLabel}
      />

      {data.lastHitGames.length ? (
        <section className="section">
          <h2>Last 5</h2>
          <div className="log">
            {data.lastHitGames.map((g) => (
              <div className="log-row" key={`${g.date}-${g.opponent}`}>
                <div className="muted">{prettyDate(g.date)}</div>
                <div>
                  {g.isHome ? "vs" : "@"} {shortTeamName(g.opponent) || g.opponent}
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
