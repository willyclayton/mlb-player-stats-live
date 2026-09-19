export type JudgePair = {
  id: number;
  a: { who?: string; fact: string; note?: string };
  b: { who?: string; fact: string; note?: string };
};

export const JUDGE_PAIRS: JudgePair[] = [
  {
    id: 1,
    a: { who: "Olson", fact: "40 HR, 2nd-most of his career", note: "54 in 2023" },
    b: { who: "Olson", fact: "Leads the Braves in HR", note: "Harris is 14 back" },
  },
  {
    id: 2,
    a: { who: "Ohtani", fact: "Career-best 1.79 ERA", note: "Previous best: 2.33 in 2022" },
    b: { who: "Ohtani", fact: "30 HR and 85.2 IP, 95 K", note: "Two-way line" },
  },
  {
    id: 3,
    a: { who: "Olson", fact: "HR @ Astros. First since Sep 13", note: "vs Phillies, 3-5 | HR" },
    b: { who: "Olson", fact: "40 HR, 2nd-most of his career", note: "54 in 2023" },
  },
  {
    id: 4,
    a: { who: "Betts", fact: "2 HR vs Giants. First since Jul 20", note: "Last: 4-5 | 2 HR @ Phillies" },
    b: { who: "Rookie", fact: "First 20-HR season of his career", note: "Previous high: 9 in 2025" },
  },
  {
    id: 5,
    a: { fact: "Most doubles of his career", note: "44 this year. Previous: 36 in 2025" },
    b: { fact: "Career-high 28 HR", note: "Previous high: 22 in 2024" },
  },
  {
    id: 6,
    a: { fact: "5 hits and a steal", note: "First since Jul 4, 2025" },
    b: { fact: "Hit for the cycle", note: "First in the last two seasons" },
  },
  {
    id: 7,
    a: { fact: "Only Braves steal tonight", note: "First SB since Aug 3" },
    b: { fact: "Tied with Harris for the Braves hit lead", note: "Both 3 hits" },
  },
  {
    id: 8,
    a: { fact: "Last 15: .356/.457/.729", note: "OPS +420 vs season" },
    b: { fact: "Hit in 11 straight games", note: "Since Aug 28 vs Mets" },
  },
  {
    id: 9,
    a: { fact: "0-for-5, 3 K", note: "Last multi-hit: Sep 14 (4-5 | HR)" },
    b: { fact: "Last HR Aug 18 @ Rockies", note: "He went 0-3 tonight" },
  },
  {
    id: 10,
    a: { fact: "32 HR and 31 SB", note: "Only Yankees 30-30 this year" },
    b: { fact: "Career-best 1.79 ERA", note: "Previous best: 2.33 in 2022" },
  },
];
