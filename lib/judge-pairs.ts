export type JudgeSide = {
  scope: "Season" | "Game" | "Short" | "Long";
  fact: string;
  note?: string;
};

export type JudgePair = {
  id: string;
  section: "stat" | "word";
  a: JudgeSide;
  b: JudgeSide;
};

/** Quiet-night leftovers, last HR, 0-fer — the screenshot. */
export const STAT_PAIRS: JudgePair[] = [
  {
    id: "1",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit: Sep 11 vs Phillies (3-3 | BB). Olson went 3-for-5." },
  },
  {
    id: "2",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Season", fact: "Last multi-hit Sep 11 vs Phillies", note: "3-3 | BB" },
  },
  {
    id: "3",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit: Sep 11." },
    b: { scope: "Game", fact: "Last HR Sep 14 @ Cubs", note: "He went 0-for-4 tonight." },
  },
  {
    id: "4",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit Sep 11. Olson went 3-for-5." },
    b: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Olson went 3-for-5." },
  },
  {
    id: "5",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Season", fact: "Nothing", note: "Hide last-HR when that’s all we have." },
  },
  {
    id: "6",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4 @ Astros", note: "Show the 0-fer." },
    b: { scope: "Game", fact: "Nothing", note: "Skip the 0-fer. Don’t lead a bad night." },
  },
  {
    id: "7",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs" },
    b: { scope: "Game", fact: "Last multi-hit Sep 11 vs Phillies", note: "3-3 | BB" },
  },
  {
    id: "8",
    section: "stat",
    a: { scope: "Game", fact: "Last multi-hit Sep 11 vs Phillies", note: "3-3 | BB" },
    b: { scope: "Game", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
  },
  {
    id: "9",
    section: "stat",
    a: { scope: "Season", fact: "Last 15: .224/.270/.379", note: "OPS .649 vs season .834" },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR" },
  },
  {
    id: "10",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit Sep 11 (3-3)." },
    b: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "No second sentence." },
  },
  {
    id: "11",
    section: "stat",
    a: { scope: "Season", fact: ".276/.318/.429, 12 HR, 48 RBI", note: "The slash they already see." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
  },
  {
    id: "12",
    section: "stat",
    a: { scope: "Game", fact: "Olson went 3-for-5", note: "Teammate only. No 0-fer." },
    b: { scope: "Game", fact: "0-for-4, 2 K", note: "Own line only. No Olson." },
  },
  {
    id: "13",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "Four days ago." },
    b: { scope: "Season", fact: "Last HR Aug 3 @ Mets", note: "Six weeks ago." },
  },
  {
    id: "14",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit: Sep 11 vs Phillies (3-3 | BB). Olson went 3-for-5." },
    b: { scope: "Game", fact: "0-for-4 @ Astros", note: "Last hit: Sep 11." },
  },
  {
    id: "15",
    section: "stat",
    a: { scope: "Season", fact: "2nd on the Braves in SB", note: "Acuña is 8 ahead." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs" },
  },
  {
    id: "16",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K", note: "Last HR: Sep 14 @ Cubs." },
    b: { scope: "Game", fact: "0-for-4, 2 K", note: "Last multi-hit: Sep 11 vs Phillies." },
  },
  {
    id: "17",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "Put this in Another, not first." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "Show this first when it’s all we have." },
  },
  {
    id: "18",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "And Olson went 3-for-5." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
  },
  {
    id: "19",
    section: "stat",
    a: { scope: "Season", fact: "3 multi-homer games this season", note: "Last: Jul 6 vs Mets." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs" },
  },
  {
    id: "20",
    section: "stat",
    a: { scope: "Game", fact: "Tied with Olson for the Braves hit lead", note: "Both 0. Nobody had a hit." },
    b: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit Sep 11." },
  },
  {
    id: "21",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Game", fact: "First 0-for-4 in the last two weeks" },
  },
  {
    id: "22",
    section: "stat",
    a: { scope: "Game", fact: "0-for-4, 2 K @ Astros" },
    b: { scope: "Game", fact: "0-for-4, 2 K, 0 RBI, 0 SB @ Astros" },
  },
  {
    id: "23",
    section: "stat",
    a: { scope: "Season", fact: "Last HR @ Cubs", note: "Drop the date." },
    b: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "Keep the date." },
  },
  {
    id: "24",
    section: "stat",
    a: { scope: "Game", fact: "Last multi-hit Sep 11 vs Phillies (3-3 | BB)", note: "Don’t mention tonight’s 0-fer." },
    b: { scope: "Game", fact: "0-for-4 tonight", note: "Don’t mention the last multi-hit." },
  },
  {
    id: "25",
    section: "stat",
    a: { scope: "Season", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Game", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit Sep 11 (3-3). Olson 3-5." },
  },
];

/** Same fact, two cuts. Short vs the overkill. */
export const WORD_PAIRS: JudgePair[] = [
  {
    id: "W1",
    section: "word",
    a: {
      scope: "Long",
      fact: "Last multi-hit: Sep 11 vs Phillies (3-3 | BB). Olson went 3-for-5.",
    },
    b: { scope: "Short", fact: "Last multi-hit: Sep 11 (3-3)." },
  },
  {
    id: "W2",
    section: "word",
    a: { scope: "Long", fact: "Last HR Sep 14 @ Cubs", note: "1-1 | HR, BB, 2 RBI" },
    b: { scope: "Short", fact: "Last HR Sep 14 @ Cubs" },
  },
  {
    id: "W3",
    section: "word",
    a: { scope: "Long", fact: "First since Sep 13 vs Phillies (3-5 | HR, 3 RBI, R)." },
    b: { scope: "Short", fact: "First since Sep 13." },
  },
  {
    id: "W4",
    section: "word",
    a: { scope: "Long", fact: "Leads the Braves in HR and RBI. Harris is 14 back in HR." },
    b: { scope: "Short", fact: "Harris is 14 back in HR." },
  },
  {
    id: "W5",
    section: "word",
    a: { scope: "Long", fact: "Last multi-hit: Sep 11 vs Phillies (3-3 | BB). Olson went 3-for-5." },
    b: { scope: "Short", fact: "Olson went 3-for-5." },
  },
  {
    id: "W6",
    section: "word",
    a: { scope: "Long", fact: "0-for-4, 2 K @ Astros", note: "Last multi-hit: Sep 11 vs Phillies (3-3 | BB). Olson went 3-for-5." },
    b: { scope: "Short", fact: "0-for-4, 2 K", note: "Last multi-hit Sep 11." },
  },
  {
    id: "W7",
    section: "word",
    a: { scope: "Long", fact: "40 home runs, 2nd-most of his career", note: "54 in 2023." },
    b: { scope: "Short", fact: "40 HR, 2nd-most of his career", note: "54 in 2023." },
  },
  {
    id: "W8",
    section: "word",
    a: { scope: "Long", fact: "Career-best 1.79 ERA", note: "Previous best: 2.33 in 2022." },
    b: { scope: "Short", fact: "Career-best 1.79 ERA", note: "2.33 in 2022." },
  },
  {
    id: "W9",
    section: "word",
    a: { scope: "Long", fact: "Home run @ Astros", note: "First since Sep 13 vs Phillies (3-5 | HR, 3 RBI, R)." },
    b: { scope: "Short", fact: "HR @ Astros", note: "First since Sep 13." },
  },
  {
    id: "W10",
    section: "word",
    a: { scope: "Long", fact: "Last 15: .224/.270/.379", note: "OPS 0.649 vs season 0.834 (-185)." },
    b: { scope: "Short", fact: "Last 15 OPS .649", note: "Season .834." },
  },
];

export const JUDGE_PAIRS: JudgePair[] = [...STAT_PAIRS, ...WORD_PAIRS];
