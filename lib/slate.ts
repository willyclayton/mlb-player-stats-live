import type { HomeGame } from "./types";

export function sortGames(games: HomeGame[]): HomeGame[] {
  const rank = (state: string) => {
    if (state === "Live") return 0;
    if (state === "Preview") return 1;
    if (state === "Final") return 2;
    return 3;
  };
  return [...games].sort((a, b) => rank(a.abstractState) - rank(b.abstractState));
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
