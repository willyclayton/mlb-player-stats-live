import Link from "next/link";
import { gameHref } from "@/lib/href";
import type { HomeGame } from "@/lib/types";

export function Scoreboard({ games }: { games: HomeGame[] }) {
  return (
    <div className="scoreboard">
      {games.map((game) => (
        <Link className="score-row" key={game.gamePk} href={gameHref(game.gamePk)}>
          <div className="score-teams">
            <div>
              <span className="abbr">{game.away.abbr}</span>
              <span className="pts">{game.away.score ?? "—"}</span>
            </div>
            <div>
              <span className="abbr">{game.home.abbr}</span>
              <span className="pts">{game.home.score ?? "—"}</span>
            </div>
          </div>
          <div className="score-meta">
            <span>{game.status}</span>
            <span className="chev">Lineup →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
