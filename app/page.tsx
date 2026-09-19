import { Slate } from "@/components/Slate";
import { TopStatBoard } from "@/components/TopStatBoard";
import { getHome } from "@/lib/mlb";

export const revalidate = 30;

export default async function HomePage() {
  const data = await getHome();

  return (
    <>
      <TopStatBoard cards={data.top} />

      {data.blocks.length === 0 ? (
        <p className="hint">No games on the board. Search a player.</p>
      ) : (
        <Slate blocks={data.blocks} />
      )}
    </>
  );
}
