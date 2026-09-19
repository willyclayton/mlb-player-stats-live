import type { HomeGame } from "./types";

export function isLive(game: { abstractState: string; status: string }): boolean {
  if (game.abstractState === "Live") return true;
  return /in progress|warmup|delayed|challenge|review/i.test(game.status);
}

export function sortGames(games: HomeGame[]): HomeGame[] {
  const rank = (game: HomeGame) => {
    if (isLive(game)) return 0;
    if (game.abstractState === "Preview") return 1;
    if (game.abstractState === "Final") return 2;
    return 3;
  };
  return [...games].sort((a, b) => rank(a) - rank(b));
}

export function slateBlocks(input: {
  yesterday: HomeGame[];
  today: HomeGame[];
  tomorrow: HomeGame[];
}): { label: string; games: HomeGame[] }[] {
  const { yesterday, today, tomorrow } = input;
  const todayLive = today.some((g) => g.abstractState === "Live");
  const todayStarted = today.some(
    (g) => g.abstractState === "Live" || g.abstractState === "Final",
  );

  const blocks: { label: string; games: HomeGame[] }[] = [];

  if (todayLive) {
    blocks.push({ label: "Live", games: sortGames(today) });
    return blocks;
  }

  if (todayStarted) {
    blocks.push({ label: "Today", games: sortGames(today) });
    return blocks;
  }

  if (yesterday.length) {
    blocks.push({ label: "Last night", games: sortGames(yesterday) });
  }
  if (today.length) {
    blocks.push({ label: "Today", games: sortGames(today) });
  }
  if (!yesterday.length && !today.length && tomorrow.length) {
    blocks.push({ label: "Tomorrow", games: sortGames(tomorrow) });
  }
  return blocks;
}
