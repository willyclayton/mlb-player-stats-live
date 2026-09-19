import { TopCard } from "@/components/PlayerCard";
import { Slate } from "@/components/Slate";
import { getHome } from "@/lib/mlb";

export const revalidate = 30;

export default async function HomePage() {
  const data = await getHome();

  return (
    <>
      {data.top.length ? (
        <section className="section">
          <h2>Top stat</h2>
          <div className="top-list">
            {data.top.map((player) => (
              <TopCard key={`${player.id}-${player.feat}-${player.gamePk ?? "szn"}`} player={player} />
            ))}
          </div>
        </section>
      ) : null}

      {data.blocks.length === 0 ? (
        <p className="hint">No games on the board. Search a player.</p>
      ) : (
        <Slate blocks={data.blocks} />
      )}
    </>
  );
}
