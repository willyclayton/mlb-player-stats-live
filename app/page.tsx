import { LeaderCard } from "@/components/PlayerCard";
import { Scoreboard } from "@/components/Scoreboard";
import { getHome } from "@/lib/mlb";

export const revalidate = 60;

export default async function HomePage() {
  const data = await getHome();

  return (
    <>
      <p className="lede">
        Pick a game, then a player. Live numbers, then a fact.
      </p>

      <section className="section">
        <h2>{data.slateLabel}</h2>
        <Scoreboard games={data.games} />
      </section>

      <section className="section">
        <h2>Leaders</h2>
        <div className="grid">
          {data.heaters.map((player) => (
            <LeaderCard key={`${player.id}-${player.label}`} player={player} />
          ))}
        </div>
      </section>

      <p className="footer">Official MLB Stats API · {data.asOf}</p>
    </>
  );
}
