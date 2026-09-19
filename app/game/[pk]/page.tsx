import Link from "next/link";
import { notFound } from "next/navigation";
import { Headshot } from "@/components/Headshot";
import { Matchup, TeamLabel } from "@/components/TeamLabel";
import { playerHref } from "@/lib/href";
import { getGame } from "@/lib/mlb";
import { isLive } from "@/lib/slate";
import type { GameSide } from "@/lib/types";

export const revalidate = 30;

function Lineup({ side, gamePk }: { side: GameSide; gamePk: number }) {
  return (
    <section className="section">
      <h2>
        <TeamLabel abbr={side.abbr} name={side.name} />
        {side.score != null ? ` ${side.score}` : ""}
      </h2>
      <p className="hint">{side.name}</p>
      <div className="lineup">
        {side.players.map((player, i) => (
          <Link
            key={player.id}
            className={`lineup-row${player.topStat ? " top" : ""}`}
            href={playerHref(player, gamePk)}
          >
            <span className="muted">{i + 1}</span>
            <Headshot id={player.id} name={player.name} size={80} />
            <div>
              <div className="name">{player.name}</div>
              <div className="muted">
                {player.topStat || player.position || "—"}
              </div>
            </div>
            {player.topStat ? <span className="top-tag">Top stat</span> : <span className="chev">→</span>}
          </Link>
        ))}
        {side.players.length === 0 ? (
          <p className="hint">Lineup not posted yet.</p>
        ) : null}
      </div>
    </section>
  );
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ pk: string }>;
}) {
  const pk = Number((await params).pk);
  if (!Number.isFinite(pk)) notFound();

  let game;
  try {
    game = await getGame(pk);
  } catch {
    notFound();
  }

  const flagged = [...game.away.players, ...game.home.players].find((p) => p.topStat);

  return (
    <>
      <nav className="crumb">
        <Link href="/">Games</Link>
        <span>/</span>
        <span>
          <Matchup away={game.away} home={game.home} />
        </span>
      </nav>

      <div className="game-hero">
        <div>
          {isLive(game) ? (
            <div className="live-tag">Live</div>
          ) : (
            <div className="kicker">{game.status}</div>
          )}
          <h1 className="match">
            <TeamLabel abbr={game.away.abbr} name={game.away.name} />{" "}
            {game.away.score ?? ""}
            <span className="at"> @ </span>
            <TeamLabel abbr={game.home.abbr} name={game.home.name} />{" "}
            {game.home.score ?? ""}
          </h1>
          {game.venue ? <p className="hint">{game.venue}</p> : null}
        </div>
      </div>

      {flagged ? (
        <p className="lede">
          <span className="top-tag">Top stat</span> {flagged.name} · {flagged.topStat}
        </p>
      ) : (
        <p className="lede">Tap a name.</p>
      )}

      <Lineup side={game.away} gamePk={game.gamePk} />
      <Lineup side={game.home} gamePk={game.gamePk} />
    </>
  );
}
