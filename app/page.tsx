import { LeaderCard, PlayerCard } from "@/components/PlayerCard";
import { SearchBox } from "@/components/SearchBox";
import { getHome } from "@/lib/mlb";

export const revalidate = 60;

export default async function HomePage() {
  const data = await getHome();

  return (
    <>
      <header className="topbar">
        <div>
          <div className="kicker">MLB 2026 · {data.slateLabel}</div>
          <h1 className="brand">Crazy Stats</h1>
          <p className="lede">Tap a player. Live numbers. One insane stat.</p>
        </div>
        <div className="live-dot">Live</div>
      </header>

      <SearchBox />

      {data.games.length ? (
        <div className="row-scroll">
          {data.games.map((game) => (
            <div className="game-chip" key={game.gamePk}>
              <div className="meta">{game.status}</div>
              <div className="score">
                {game.away.abbr} {game.away.score ?? ""}
              </div>
              <div className="score">
                {game.home.abbr} {game.home.score ?? ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {data.players.length ? (
        <section className="section">
          <h2>Tap someone</h2>
          <div className="row-scroll">
            {data.players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>Heaters</h2>
        <div className="grid">
          {data.heaters.map((player) => (
            <LeaderCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <p className="footer">MLB Stats API · {data.asOf}</p>
    </>
  );
}
