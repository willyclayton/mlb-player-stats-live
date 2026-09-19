import Link from "next/link";
import { gameHref } from "@/lib/href";
import type { HomeGame } from "@/lib/types";

export function Scoreboard({ games }: { games: HomeGame[] }) {
  if (games.length === 0) {
    return <p className="hint">No games here.</p>;
  }

  return (
    <div className="scoreboard">
      {games.map((game) => {
        const preview = game.abstractState === "Preview";
        return (
          <Link className="score-row" key={game.gamePk} href={gameHref(game.gamePk)}>
            <div className="score-teams">
              <div>
                <span className="abbr">{game.away.abbr}</span>
                <span className="pts">{preview ? "" : (game.away.score ?? "—")}</span>
              </div>
              <div>
                <span className="abbr">{game.home.abbr}</span>
                <span className="pts">{preview ? "" : (game.home.score ?? "—")}</span>
              </div>
            </div>
            <div className="score-meta">
              <span>{preview && game.start ? game.start : game.status}</span>
              <span className="chev">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
