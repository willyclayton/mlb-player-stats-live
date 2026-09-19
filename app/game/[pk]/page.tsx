import Link from "next/link";
import { notFound } from "next/navigation";
import { Headshot } from "@/components/Headshot";
import { playerHref } from "@/lib/href";
import { getGame } from "@/lib/mlb";
import type { GameSide } from "@/lib/types";

export const revalidate = 30;

function Lineup({ side, gamePk }: { side: GameSide; gamePk: number }) {
  return (
    <section className="section">
      <h2>
        {side.abbr}
        {side.score != null ? ` ${side.score}` : ""}
      </h2>
      <p className="hint">{side.name}</p>
      <div className="lineup">
        {side.players.map((player, i) => (
          <Link
            key={player.id}
            className="lineup-row"
            href={playerHref(player, gamePk)}
          >
            <span className="muted">{i + 1}</span>
            <Headshot id={player.id} name={player.name} size={80} />
            <div>
              <div className="name">{player.name}</div>
              <div className="muted">{player.position || "—"}</div>
            </div>
            <span className="chev">→</span>
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

  return (
    <>
      <nav className="crumb">
        <Link href="/">Games</Link>
        <span>/</span>
        <span>
          {game.away.abbr} @ {game.home.abbr}
        </span>
      </nav>

      <div className="game-hero">
        <div>
          <div className="kicker">{game.status}</div>
          <h1 className="match">
            {game.away.abbr} {game.away.score ?? ""}
            <span> @ </span>
            {game.home.abbr} {game.home.score ?? ""}
          </h1>
          {game.venue ? <p className="hint">{game.venue}</p> : null}
        </div>
      </div>

      <p className="lede">Tap a name for the live line and a fact.</p>

      <Lineup side={game.away} gamePk={game.gamePk} />
      <Lineup side={game.home} gamePk={game.gamePk} />
    </>
  );
}
