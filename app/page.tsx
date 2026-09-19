import { LeaderCard, TopCard } from "@/components/PlayerCard";
import { Scoreboard } from "@/components/Scoreboard";
import { getHome } from "@/lib/mlb";

export const revalidate = 30;

export default async function HomePage() {
  const data = await getHome();

  return (
    <>
      {data.top ? (
        <section className="section">
          <h2>Top stat</h2>
          <TopCard player={data.top} />
        </section>
      ) : null}

      {data.blocks.length === 0 ? (
        <p className="hint">No games on the board. Search a player.</p>
      ) : (
        data.blocks.map((block) => (
          <section className="section" key={block.label}>
            <h2>{block.label}</h2>
            <Scoreboard games={block.games} />
          </section>
        ))
      )}

      {data.heaters.length ? (
        <section className="section">
          <h2>Leaders</h2>
          <div className="grid">
            {data.heaters.map((player) => (
              <LeaderCard key={`${player.id}-${player.label}`} player={player} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
