/**
 * Franchise-first tables for live 2026 joins.
 * Regular season, current 30 clubs (Expos → Nationals, Browns → Orioles,
 * Senators 1901–60 → Twins, Senators 1961–71 → Rangers, etc.).
 *
 * Baseline is through 2025. 2026 rows are completed marks as of 2026-09-19.
 *
 * Sources (fetched):
 * - https://en.wikipedia.org/wiki/40–40_club
 * - https://www.baseball-almanac.com/hitting/hi4040c.shtml
 * - https://www.baseball-reference.com/bullpen/40-40_club
 * - https://www.mlb.com/news/40-40-club-c265378902
 * - https://en.wikipedia.org/wiki/30–30_club
 * - https://www.baseball-almanac.com/hitting/hi3030c.shtml
 * - https://www.mlb.com/news/30-30-club-broken-down-by-team-c290480838
 * - https://en.wikipedia.org/wiki/50_home_run_club
 * - https://www.baseball-reference.com/leaders/HR_season.shtml
 * - https://www.baseball-almanac.com/hitting/hihr4.shtml
 * - https://mlbdailydingers.substack.com/p/367-occurrences-of-40-homer-seasons (through 2024)
 * - https://en.wikipedia.org/wiki/List_of_Major_League_Baseball_players_to_hit_for_the_cycle
 * - https://www.baseball-almanac.com/hitting/Major_League_Baseball_Players_to_hit_for_the_cycle.shtml
 * - https://mlbdailydingers.com/2023/04/3-home-runs-in-a-game/ (updated 2026-08-15)
 */

import { teamAbbrFromName } from "./format";

export const HISTORIC_AS_OF = "2026-09-19";
export const SEASON = 2026;

export type HistoricLine = {
  player: string;
  year: number;
  teamAbbr: string;
  hr?: number;
  sb?: number;
  date?: string;
  notes?: string;
  uncertain?: boolean;
};

export type FranchiseMark = {
  first: HistoricLine | null;
  recentBefore2026: HistoricLine | null;
};

export type SeasonJoin = {
  id: string;
  stamp: string;
  headline: string;
  body: string;
  receipts: { label: string; value: string }[];
};

const TEAMS = [
  "AZ",
  "ATL",
  "BAL",
  "BOS",
  "CHC",
  "CWS",
  "CIN",
  "CLE",
  "COL",
  "DET",
  "HOU",
  "KC",
  "LAA",
  "LAD",
  "MIA",
  "MIL",
  "MIN",
  "NYM",
  "NYY",
  "ATH",
  "PHI",
  "PIT",
  "SD",
  "SF",
  "SEA",
  "STL",
  "TB",
  "TEX",
  "TOR",
  "WSH",
] as const;

export type TeamAbbr = (typeof TEAMS)[number];

function line(
  player: string,
  year: number,
  teamAbbr: string,
  extra: Partial<HistoricLine> = {},
): HistoricLine {
  return { player, year, teamAbbr, ...extra };
}

function clubMark(rows: HistoricLine[]): FranchiseMark {
  const sorted = [...rows].sort((a, b) => a.year - b.year || a.player.localeCompare(b.player));
  const first = sorted[0] ?? null;
  const recent = [...sorted].filter((r) => r.year < SEASON).at(-1) ?? null;
  return { first, recentBefore2026: recent };
}

function byTeam(rows: HistoricLine[]): Record<string, HistoricLine[]> {
  const out: Record<string, HistoricLine[]> = {};
  for (const row of rows) {
    (out[row.teamAbbr] ??= []).push(row);
  }
  return out;
}

/** Split-season combined totals. Not credited to either current franchise. */
export const SPLIT_ONLY: HistoricLine[] = [
  line("Bobby Bonds", 1978, "CWS", {
    hr: 31,
    sb: 43,
    notes: "CWS 2 HR / 6 SB, then TEX 29 HR / 37 SB. Neither club gets a 30-30.",
    uncertain: true,
  }),
  line("Carlos Beltrán", 2004, "KC", {
    hr: 38,
    sb: 42,
    notes: "KC 15 HR / 14 SB, then HOU 23 HR / 28 SB. Neither club gets a 30-30.",
    uncertain: true,
  }),
  line("Mark McGwire", 1997, "ATH", {
    hr: 58,
    notes: "58 HR combined ATH/STL. Neither club gets a 50-HR season.",
    uncertain: true,
  }),
];

/** Every 40-40 season in MLB history. Six, none repeated, none in 2026 through Sep 19. */
export const CLUB_40_40: HistoricLine[] = [
  line("Jose Canseco", 1988, "ATH", { hr: 42, sb: 40, notes: "first ever; first Athletics" }),
  line("Barry Bonds", 1996, "SF", { hr: 42, sb: 40, notes: "first Giants" }),
  line("Alex Rodriguez", 1998, "SEA", { hr: 42, sb: 46, notes: "first Mariners" }),
  line("Alfonso Soriano", 2006, "WSH", { hr: 46, sb: 41, notes: "first Nationals" }),
  line("Ronald Acuña Jr.", 2023, "ATL", { hr: 41, sb: 73, notes: "first Braves; 40-70" }),
  line("Shohei Ohtani", 2024, "LAD", { hr: 54, sb: 59, notes: "first Dodgers; only 50-50" }),
];

/** Single-team 30-30 seasons, current franchise abbr. Includes 2026 PCA and Abrams. */
export const CLUB_30_30: HistoricLine[] = [
  line("Ken Williams", 1922, "BAL", { hr: 39, sb: 37, notes: "first ever; St. Louis Browns" }),
  line("Willie Mays", 1956, "SF", { hr: 36, sb: 40, notes: "New York Giants" }),
  line("Willie Mays", 1957, "SF", { hr: 35, sb: 38 }),
  line("Hank Aaron", 1963, "ATL", { hr: 44, sb: 31, notes: "Milwaukee Braves" }),
  line("Bobby Bonds", 1969, "SF", { hr: 32, sb: 45 }),
  line("Tommy Harper", 1970, "MIL", { hr: 31, sb: 38 }),
  line("Bobby Bonds", 1973, "SF", { hr: 39, sb: 43 }),
  line("Bobby Bonds", 1975, "NYY", { hr: 32, sb: 30 }),
  line("Bobby Bonds", 1977, "LAA", { hr: 37, sb: 41, notes: "California Angels" }),
  line("Dale Murphy", 1983, "ATL", { hr: 36, sb: 30 }),
  line("Joe Carter", 1987, "CLE", { hr: 32, sb: 31, notes: "Cleveland Indians" }),
  line("Eric Davis", 1987, "CIN", { hr: 37, sb: 50 }),
  line("Howard Johnson", 1987, "NYM", { hr: 36, sb: 32 }),
  line("Darryl Strawberry", 1987, "NYM", { hr: 39, sb: 36 }),
  line("Jose Canseco", 1988, "ATH", { hr: 42, sb: 40 }),
  line("Howard Johnson", 1989, "NYM", { hr: 36, sb: 41 }),
  line("Barry Bonds", 1990, "PIT", { hr: 33, sb: 52 }),
  line("Ron Gant", 1990, "ATL", { hr: 32, sb: 33 }),
  line("Ron Gant", 1991, "ATL", { hr: 32, sb: 34 }),
  line("Howard Johnson", 1991, "NYM", { hr: 38, sb: 30 }),
  line("Barry Bonds", 1992, "PIT", { hr: 34, sb: 39 }),
  line("Sammy Sosa", 1993, "CHC", { hr: 33, sb: 36 }),
  line("Barry Bonds", 1995, "SF", { hr: 33, sb: 31 }),
  line("Sammy Sosa", 1995, "CHC", { hr: 36, sb: 34 }),
  line("Dante Bichette", 1996, "COL", { hr: 31, sb: 31 }),
  line("Barry Bonds", 1996, "SF", { hr: 42, sb: 40 }),
  line("Ellis Burks", 1996, "COL", { hr: 40, sb: 32 }),
  line("Barry Larkin", 1996, "CIN", { hr: 33, sb: 36 }),
  line("Jeff Bagwell", 1997, "HOU", { hr: 43, sb: 31 }),
  line("Barry Bonds", 1997, "SF", { hr: 40, sb: 37 }),
  line("Raúl Mondesí", 1997, "LAD", { hr: 30, sb: 32 }),
  line("Larry Walker", 1997, "COL", { hr: 49, sb: 33 }),
  line("Shawn Green", 1998, "TOR", { hr: 35, sb: 35 }),
  line("Alex Rodriguez", 1998, "SEA", { hr: 42, sb: 46 }),
  line("Jeff Bagwell", 1999, "HOU", { hr: 42, sb: 30 }),
  line("Raúl Mondesí", 1999, "LAD", { hr: 33, sb: 36 }),
  line("Preston Wilson", 2000, "MIA", { hr: 31, sb: 36, notes: "Florida Marlins" }),
  line("Bobby Abreu", 2001, "PHI", { hr: 31, sb: 36 }),
  line("José Cruz Jr.", 2001, "TOR", { hr: 34, sb: 32 }),
  line("Vladimir Guerrero", 2001, "WSH", { hr: 34, sb: 37, notes: "Montreal Expos" }),
  line("Vladimir Guerrero", 2002, "WSH", { hr: 39, sb: 40, notes: "Montreal Expos" }),
  line("Alfonso Soriano", 2002, "NYY", { hr: 39, sb: 41 }),
  line("Alfonso Soriano", 2003, "NYY", { hr: 38, sb: 35 }),
  line("Bobby Abreu", 2004, "PHI", { hr: 30, sb: 40 }),
  line("Alfonso Soriano", 2005, "TEX", { hr: 36, sb: 30 }),
  line("Alfonso Soriano", 2006, "WSH", { hr: 46, sb: 41 }),
  line("Brandon Phillips", 2007, "CIN", { hr: 30, sb: 32 }),
  line("Jimmy Rollins", 2007, "PHI", { hr: 30, sb: 41 }),
  line("David Wright", 2007, "NYM", { hr: 30, sb: 34 }),
  line("Hanley Ramírez", 2008, "MIA", { hr: 33, sb: 35, notes: "Florida Marlins" }),
  line("Grady Sizemore", 2008, "CLE", { hr: 33, sb: 38 }),
  line("Ian Kinsler", 2009, "TEX", { hr: 31, sb: 30 }),
  line("Ryan Braun", 2011, "MIL", { hr: 33, sb: 33 }),
  line("Jacoby Ellsbury", 2011, "BOS", { hr: 32, sb: 39 }),
  line("Matt Kemp", 2011, "LAD", { hr: 39, sb: 40 }),
  line("Ian Kinsler", 2011, "TEX", { hr: 32, sb: 30 }),
  line("Ryan Braun", 2012, "MIL", { hr: 41, sb: 30 }),
  line("Mike Trout", 2012, "LAA", { hr: 30, sb: 49 }),
  line("Mookie Betts", 2018, "BOS", { hr: 32, sb: 30 }),
  line("José Ramírez", 2018, "CLE", { hr: 39, sb: 34 }),
  line("Ronald Acuña Jr.", 2019, "ATL", { hr: 41, sb: 37 }),
  line("Christian Yelich", 2019, "MIL", { hr: 44, sb: 30 }),
  line("Cedric Mullins", 2021, "BAL", { hr: 30, sb: 30 }),
  line("Ronald Acuña Jr.", 2023, "ATL", { hr: 41, sb: 73 }),
  line("Francisco Lindor", 2023, "NYM", { hr: 31, sb: 31 }),
  line("Julio Rodríguez", 2023, "SEA", { hr: 32, sb: 37 }),
  line("Bobby Witt Jr.", 2023, "KC", { hr: 30, sb: 49 }),
  line("Shohei Ohtani", 2024, "LAD", { hr: 54, sb: 59 }),
  line("José Ramírez", 2024, "CLE", { hr: 39, sb: 41 }),
  line("Bobby Witt Jr.", 2024, "KC", { hr: 32, sb: 31 }),
  line("Corbin Carroll", 2025, "AZ", { hr: 31, sb: 32 }),
  line("Jazz Chisholm Jr.", 2025, "NYY", { hr: 31, sb: 31 }),
  line("Pete Crow-Armstrong", 2025, "CHC", { hr: 31, sb: 35 }),
  line("Francisco Lindor", 2025, "NYM", { hr: 31, sb: 31 }),
  line("José Ramírez", 2025, "CLE", { hr: 30, sb: 44 }),
  line("Julio Rodríguez", 2025, "SEA", { hr: 32, sb: 30 }),
  line("Juan Soto", 2025, "NYM", { hr: 43, sb: 38 }),
  line("Pete Crow-Armstrong", 2026, "CHC", { hr: 44, sb: 37, notes: "reached 2026-09-19; not a franchise first" }),
  line("CJ Abrams", 2026, "WSH", { hr: 30, sb: 30, notes: "reached 2026-09-19; first Nats 30-30 since 2006" }),
];

export const NEVER_30_30: TeamAbbr[] = ["STL", "SD", "TB", "DET", "MIN", "CWS"];

/** Single-team 50-HR seasons. McGwire 1997 split omitted. */
export const CLUB_50_HR: HistoricLine[] = [
  line("Babe Ruth", 1920, "NYY", { hr: 54, notes: "first 50-HR season in MLB" }),
  line("Babe Ruth", 1921, "NYY", { hr: 59 }),
  line("Babe Ruth", 1927, "NYY", { hr: 60 }),
  line("Babe Ruth", 1928, "NYY", { hr: 54 }),
  line("Hack Wilson", 1930, "CHC", { hr: 56 }),
  line("Jimmie Foxx", 1932, "ATH", { hr: 58, notes: "Philadelphia Athletics" }),
  line("Jimmie Foxx", 1938, "BOS", { hr: 50 }),
  line("Hank Greenberg", 1938, "DET", { hr: 58 }),
  line("Johnny Mize", 1947, "SF", { hr: 51, notes: "New York Giants" }),
  line("Ralph Kiner", 1947, "PIT", { hr: 51 }),
  line("Ralph Kiner", 1949, "PIT", { hr: 54 }),
  line("Willie Mays", 1955, "SF", { hr: 51, notes: "New York Giants" }),
  line("Mickey Mantle", 1956, "NYY", { hr: 52 }),
  line("Mickey Mantle", 1961, "NYY", { hr: 54 }),
  line("Roger Maris", 1961, "NYY", { hr: 61 }),
  line("Willie Mays", 1965, "SF", { hr: 52 }),
  line("George Foster", 1977, "CIN", { hr: 52 }),
  line("Cecil Fielder", 1990, "DET", { hr: 51 }),
  line("Albert Belle", 1995, "CLE", { hr: 50, notes: "Cleveland Indians" }),
  line("Brady Anderson", 1996, "BAL", { hr: 50 }),
  line("Mark McGwire", 1996, "ATH", { hr: 52 }),
  line("Ken Griffey Jr.", 1997, "SEA", { hr: 56 }),
  line("Greg Vaughn", 1998, "SD", { hr: 50 }),
  line("Ken Griffey Jr.", 1998, "SEA", { hr: 56 }),
  line("Sammy Sosa", 1998, "CHC", { hr: 66 }),
  line("Mark McGwire", 1998, "STL", { hr: 70 }),
  line("Sammy Sosa", 1999, "CHC", { hr: 63 }),
  line("Mark McGwire", 1999, "STL", { hr: 65 }),
  line("Sammy Sosa", 2000, "CHC", { hr: 50 }),
  line("Alex Rodriguez", 2001, "TEX", { hr: 52 }),
  line("Luis Gonzalez", 2001, "AZ", { hr: 57 }),
  line("Sammy Sosa", 2001, "CHC", { hr: 64 }),
  line("Barry Bonds", 2001, "SF", { hr: 73 }),
  line("Jim Thome", 2002, "CLE", { hr: 52 }),
  line("Alex Rodriguez", 2002, "TEX", { hr: 57 }),
  line("Andruw Jones", 2005, "ATL", { hr: 51 }),
  line("Ryan Howard", 2006, "PHI", { hr: 58 }),
  line("David Ortiz", 2006, "BOS", { hr: 54 }),
  line("Alex Rodriguez", 2007, "NYY", { hr: 54 }),
  line("Prince Fielder", 2007, "MIL", { hr: 50 }),
  line("José Bautista", 2010, "TOR", { hr: 54 }),
  line("Chris Davis", 2013, "BAL", { hr: 53 }),
  line("Giancarlo Stanton", 2017, "MIA", { hr: 59 }),
  line("Aaron Judge", 2017, "NYY", { hr: 52 }),
  line("Pete Alonso", 2019, "NYM", { hr: 53 }),
  line("Aaron Judge", 2022, "NYY", { hr: 62 }),
  line("Matt Olson", 2023, "ATL", { hr: 54 }),
  line("Aaron Judge", 2024, "NYY", { hr: 58 }),
  line("Shohei Ohtani", 2024, "LAD", { hr: 54 }),
  line("Cal Raleigh", 2025, "SEA", { hr: 60 }),
  line("Kyle Schwarber", 2025, "PHI", { hr: 56 }),
  line("Shohei Ohtani", 2025, "LAD", { hr: 55 }),
  line("Aaron Judge", 2025, "NYY", { hr: 53 }),
];

export const NEVER_50_HR: TeamAbbr[] = ["CWS", "COL", "HOU", "KC", "LAA", "MIN", "TB", "WSH"];

/** First 40-HR season per current franchise. None of the 30 is still waiting. */
export const FIRST_40_HR: HistoricLine[] = [
  line("Luis Gonzalez", 2001, "AZ", { hr: 57 }),
  line("Eddie Mathews", 1953, "ATL", { hr: 47, notes: "Milwaukee Braves" }),
  line("Jim Gentile", 1961, "BAL", { hr: 46, notes: "Browns never had 40" }),
  line("Jimmie Foxx", 1936, "BOS", { hr: 41 }),
  line("Hack Wilson", 1930, "CHC", { hr: 56 }),
  line("Frank Thomas", 1993, "CWS", { hr: 41 }),
  line("Ted Kluszewski", 1953, "CIN", { hr: 40 }),
  line("Hal Trosky", 1936, "CLE", { hr: 42 }),
  line("Dante Bichette", 1995, "COL", { hr: 40 }),
  line("Hank Greenberg", 1937, "DET", { hr: 40 }),
  line("Jeff Bagwell", 1997, "HOU", { hr: 43 }),
  line("Jorge Soler", 2019, "KC", { hr: 48 }),
  line("Troy Glaus", 2000, "LAA", { hr: 47, notes: "Anaheim Angels" }),
  line("Gil Hodges", 1951, "LAD", { hr: 40, notes: "Brooklyn Dodgers" }),
  line("Gary Sheffield", 1996, "MIA", { hr: 42, notes: "Florida Marlins" }),
  line("Gorman Thomas", 1979, "MIL", { hr: 45 }),
  line("Roy Sievers", 1957, "MIN", { hr: 42, notes: "Washington Senators" }),
  line("Todd Hundley", 1996, "NYM", { hr: 41 }),
  line("Babe Ruth", 1920, "NYY", { hr: 54 }),
  line("Jimmie Foxx", 1932, "ATH", { hr: 58, notes: "Philadelphia Athletics" }),
  line("Cy Williams", 1923, "PHI", { hr: 41 }),
  line("Ralph Kiner", 1947, "PIT", { hr: 51 }),
  line("Ken Caminiti", 1996, "SD", { hr: 40 }),
  line("Mel Ott", 1929, "SF", { hr: 42, notes: "New York Giants" }),
  line("Ken Griffey Jr.", 1993, "SEA", { hr: 45 }),
  line("Rogers Hornsby", 1922, "STL", { hr: 42 }),
  line("Carlos Peña", 2007, "TB", { hr: 46 }),
  line("Frank Howard", 1968, "TEX", { hr: 44, notes: "Washington Senators" }),
  line("Jesse Barfield", 1986, "TOR", { hr: 40 }),
  line("Vladimir Guerrero", 1999, "WSH", { hr: 42, notes: "Montreal Expos" }),
];

/**
 * First regular-season cycle per current franchise.
 * 1891 AA Milwaukee Brewers and 1889 Cleveland Spiders are not current clubs.
 * ATH first is Harry Davis (Almanac); Wikipedia's chronological table skips him.
 */
export const FIRST_CYCLE: HistoricLine[] = [
  line("Luis Gonzalez", 2000, "AZ", { date: "2000-07-05" }),
  line("Herman Long", 1896, "ATL", { date: "1896-05-09", notes: "Boston Beaneaters" }),
  line("George Sisler", 1920, "BAL", { date: "1920-08-08", notes: "St. Louis Browns" }),
  line("Buck Freeman", 1903, "BOS", { date: "1903-06-21", notes: "Boston Americans" }),
  line("Jimmy Ryan", 1888, "CHC", { date: "1888-07-28", notes: "Chicago White Stockings" }),
  line("Ray Schalk", 1922, "CWS", { date: "1922-06-27" }),
  line("John Reilly", 1883, "CIN", { date: "1883-09-12", notes: "Cincinnati Red Stockings (AA)" }),
  line("Bill Bradley", 1903, "CLE", { date: "1903-09-24", notes: "Cleveland Naps" }),
  line("Dante Bichette", 1998, "COL", { date: "1998-06-10" }),
  line("Bobby Veach", 1920, "DET", { date: "1920-09-17" }),
  line("César Cedeño", 1972, "HOU", { date: "1972-08-02" }),
  line("Freddie Patek", 1971, "KC", { date: "1971-07-09" }),
  line("Jim Fregosi", 1964, "LAA", { date: "1964-07-28" }),
  line("Oyster Burns", 1890, "LAD", { date: "1890-08-01", notes: "Brooklyn Bridegrooms" }),
  line("Luis Arráez", 2023, "MIA", { date: "2023-04-11" }),
  line("Mike Hegan", 1976, "MIL", { date: "1976-09-03", notes: "not 1891 AA Brewers" }),
  line("Otis Clymer", 1908, "MIN", { date: "1908-10-02", notes: "Washington Senators" }),
  line("Jim Hickman", 1963, "NYM", { date: "1963-08-07" }),
  line("Bert Daniels", 1912, "NYY", { date: "1912-07-25", notes: "New York Highlanders" }),
  line("Harry Davis", 1901, "ATH", {
    date: "1901-07-10",
    notes: "first AL cycle (Almanac). Wikipedia chronological table starts ATH at Lajoie 1901-07-30.",
    uncertain: true,
  }),
  line("Lave Cross", 1894, "PHI", { date: "1894-04-24" }),
  line("Fred Carroll", 1887, "PIT", { date: "1887-05-02", notes: "Pittsburgh Alleghenys" }),
  line("Matt Kemp", 2015, "SD", { date: "2015-08-14" }),
  line("Mike Tiernan", 1888, "SF", { date: "1888-08-25", notes: "New York Giants" }),
  line("Jay Buhner", 1993, "SEA", { date: "1993-06-23" }),
  line("Tip O'Neill", 1887, "STL", { date: "1887-04-30", notes: "AA St. Louis Browns → Cardinals" }),
  line("B. J. Upton", 2009, "TB", { date: "2009-10-02" }),
  line("Jim King", 1964, "TEX", { date: "1964-05-26", notes: "Washington Senators" }),
  line("Kelly Gruber", 1989, "TOR", { date: "1989-04-16" }),
  line("Tim Foli", 1976, "WSH", { date: "1976-04-22", notes: "Montreal Expos" }),
];

/** Most recent regular-season cycle before 2026. Brock Holt 2018 ALDS excluded. */
export const RECENT_CYCLE_BEFORE_2026: HistoricLine[] = [
  line("Aaron Hill", 2012, "AZ", { date: "2012-06-29" }),
  line("Eddie Rosario", 2021, "ATL", { date: "2021-09-19" }),
  line("Cedric Mullins", 2023, "BAL", { date: "2023-05-12" }),
  line("Mookie Betts", 2018, "BOS", { date: "2018-08-09", notes: "Holt 2018-10-08 is postseason only" }),
  line("Carson Kelly", 2025, "CHC", { date: "2025-03-31" }),
  line("José Abreu", 2017, "CWS", { date: "2017-09-09" }),
  line("Elly De La Cruz", 2023, "CIN", { date: "2023-06-23" }),
  line("Jake Bauers", 2019, "CLE", { date: "2019-06-14" }),
  line("Charlie Blackmon", 2018, "COL", { date: "2018-09-30" }),
  line("Carlos Guillén", 2006, "DET", { date: "2006-08-01" }),
  line("Yordan Alvarez", 2024, "HOU", { date: "2024-07-21" }),
  line("George Brett", 1990, "KC", { date: "1990-07-25" }),
  line("Jared Walsh", 2022, "LAA", { date: "2022-06-11" }),
  line("Cody Bellinger", 2017, "LAD", { date: "2017-07-15" }),
  line("Xavier Edwards", 2024, "MIA", { date: "2024-07-28" }),
  line("Christian Yelich", 2022, "MIL", { date: "2022-05-11" }),
  line("Byron Buxton", 2025, "MIN", { date: "2025-07-12" }),
  line("Eduardo Escobar", 2022, "NYM", { date: "2022-06-06" }),
  line("Melky Cabrera", 2009, "NYY", { date: "2009-08-02" }),
  line("Mark Ellis", 2007, "ATH", { date: "2007-06-04" }),
  line("Weston Wilson", 2024, "PHI", { date: "2024-08-15" }),
  line("John Jaso", 2016, "PIT", { date: "2016-09-28" }),
  line("Jake Cronenworth", 2021, "SD", { date: "2021-07-16" }),
  line("Pablo Sandoval", 2011, "SF", { date: "2011-09-15" }),
  line("Adrián Beltré", 2008, "SEA", { date: "2008-09-01" }),
  line("Nolan Arenado", 2022, "STL", { date: "2022-07-01" }),
  line("Evan Longoria", 2017, "TB", { date: "2017-08-01" }),
  line("Wyatt Langford", 2024, "TEX", { date: "2024-06-30" }),
  line("Cavan Biggio", 2019, "TOR", { date: "2019-09-17" }),
  line("Trea Turner", 2021, "WSH", { date: "2021-06-30" }),
];

/** 2026 regular-season cycles through Sep 19. None is a franchise first. */
export const CYCLES_2026: HistoricLine[] = [
  line("Pete Crow-Armstrong", 2026, "CHC", { date: "2026-06-15" }),
  line("Bryce Harper", 2026, "PHI", { date: "2026-06-20" }),
  line("Tristan Peters", 2026, "CWS", { date: "2026-07-10" }),
  line("JJ Bleday", 2026, "CIN", { date: "2026-08-22" }),
];

/**
 * Last known 3-HR game per current franchise.
 * All 30 clubs have had at least one. Verified to 2026-08-15 (Daily Dingers);
 * WSH heading on that page is stale — body names Luis García Jr. 2025-09-26.
 */
export const LAST_3_HR: HistoricLine[] = [
  line("Eugenio Suárez", 2025, "AZ", { date: "2025-04-26", notes: "four-HR game" }),
  line("Travis d'Arnaud", 2024, "ATL", { date: "2024-04-19" }),
  line("Ryan Mountcastle", 2021, "BAL", { date: "2021-06-19", uncertain: true, notes: "heading as of 2026-08-15" }),
  line("Triston Casas", 2024, "BOS", { date: "2024-09-22" }),
  line("Alex Bregman", 2026, "CHC", { date: "2026-08-12" }),
  line("Seby Zavala", 2021, "CWS", { date: "2021-07-31", uncertain: true }),
  line("Spencer Steer", 2025, "CIN", { date: "2025-06-27" }),
  line("José Ramírez", 2025, "CLE", { date: "2025-04-04" }),
  line("Hunter Goodman", 2026, "COL", { date: "2026-07-19" }),
  line("Colt Keith", 2026, "DET", { date: "2026-06-15" }),
  line("Yordan Alvarez", 2024, "HOU", { date: "2024-08-28" }),
  line("Lorenzo Cain", 2016, "KC", { date: "2016-05-10", uncertain: true }),
  line("Torii Hunter", 2009, "LAA", { date: "2009-06-13", uncertain: true }),
  line("Andy Pages", 2026, "LAD", { date: "2026-05-06", notes: "after Max Muncy 2026-04-10" }),
  line("Kyle Stowers", 2025, "MIA", { date: "2025-07-13" }),
  line("Kolten Wong", 2022, "MIL", { date: "2022-09-22", uncertain: true }),
  line("Kody Clemens", 2025, "MIN", { date: "2025-09-12" }),
  line("Francisco Lindor", 2021, "NYM", { date: "2021-09-12" }),
  line("Cody Bellinger", 2025, "NYY", { date: "2025-07-11" }),
  line("Shea Langeliers", 2025, "ATH", { date: "2025-08-05" }),
  line("Kyle Schwarber", 2026, "PHI", { date: "2026-06-20" }),
  line("Ryan O'Hearn", 2026, "PIT", { date: "2026-07-07" }),
  line("Fernando Tatis Jr.", 2021, "SD", { date: "2021-06-25" }),
  line("Wilmer Flores", 2025, "SF", { date: "2025-05-16" }),
  line("Dominic Canzone", 2025, "SEA", { date: "2025-09-16" }),
  line("Joshua Báez", 2026, "STL", { date: "2026-08-15", notes: "MLB debut" }),
  line("Junior Caminero", 2026, "TB", { date: "2026-06-25" }),
  line("Adolis García", 2023, "TEX", { date: "2023-04-22", uncertain: true }),
  line("Bo Bichette", 2022, "TOR", { date: "2022-09-05", uncertain: true }),
  line("Luis García Jr.", 2025, "WSH", { date: "2025-09-26" }),
];

export const NEVER_3_HR: TeamAbbr[] = [];

/** Last 40-HR season before 2026, from MLB statsSingleSeason (HR desc, season < 2026). */
export const LAST_40_HR: HistoricLine[] = [
  line("Mark Reynolds", 2009, "AZ", { hr: 44, sb: 24 }),
  line("Ronald Acuña Jr.", 2023, "ATL", { hr: 41, sb: 73 }),
  line("Anthony Santander", 2024, "BAL", { hr: 44, sb: 2 }),
  line("J.D. Martinez", 2018, "BOS", { hr: 43, sb: 6 }),
  line("Derrek Lee", 2005, "CHC", { hr: 46, sb: 15 }),
  line("Todd Frazier", 2016, "CWS", { hr: 40, sb: 15 }),
  line("Eugenio Suárez", 2019, "CIN", { hr: 49, sb: 3 }),
  line("Travis Hafner", 2006, "CLE", { hr: 42, sb: 0 }),
  line("Nolan Arenado", 2019, "COL", { hr: 41, sb: 3 }),
  line("Miguel Cabrera", 2013, "DET", { hr: 44, sb: 3 }),
  line("Alex Bregman", 2019, "HOU", { hr: 41, sb: 5 }),
  line("Salvador Perez", 2021, "KC", { hr: 48, sb: 1 }),
  line("Shohei Ohtani", 2023, "LAA", { hr: 44, sb: 20 }),
  line("Shohei Ohtani", 2025, "LAD", { hr: 55, sb: 20 }),
  line("Giancarlo Stanton", 2017, "MIA", { hr: 59, sb: 2 }),
  line("Christian Yelich", 2019, "MIL", { hr: 44, sb: 30 }),
  line("Nelson Cruz", 2019, "MIN", { hr: 41, sb: 0 }),
  line("Juan Soto", 2025, "NYM", { hr: 43, sb: 38 }),
  line("Aaron Judge", 2025, "NYY", { hr: 53, sb: 12 }),
  line("Khris Davis", 2018, "ATH", { hr: 48, sb: 0 }),
  line("Kyle Schwarber", 2025, "PHI", { hr: 56, sb: 10 }),
  line("Willie Stargell", 1973, "PIT", { hr: 44, sb: 0 }),
  line("Fernando Tatis Jr.", 2021, "SD", { hr: 42, sb: 25 }),
  line("Barry Bonds", 2004, "SF", { hr: 45, sb: 6 }),
  line("Cal Raleigh", 2025, "SEA", { hr: 60, sb: 14 }),
  line("Albert Pujols", 2010, "STL", { hr: 42, sb: 14 }),
  line("Junior Caminero", 2025, "TB", { hr: 45, sb: 7 }),
  line("Joey Gallo", 2018, "TEX", { hr: 40, sb: 3 }),
  line("Vladimir Guerrero Jr.", 2021, "TOR", { hr: 48, sb: 4 }),
  line("Bryce Harper", 2015, "WSH", { hr: 42, sb: 6 }),
];

/** Last 40-HR / 30-SB season before 2026. Null clubs have never had one. */
export const LAST_40_30: HistoricLine[] = [
  line("Ronald Acuña Jr.", 2023, "ATL", { hr: 41, sb: 73 }),
  line("Larry Walker", 1997, "COL", { hr: 49, sb: 33 }),
  line("Jeff Bagwell", 1999, "HOU", { hr: 42, sb: 30 }),
  line("Shohei Ohtani", 2024, "LAD", { hr: 54, sb: 59 }),
  line("Christian Yelich", 2019, "MIL", { hr: 44, sb: 30 }),
  line("Juan Soto", 2025, "NYM", { hr: 43, sb: 38 }),
  line("Jose Canseco", 1988, "ATH", { hr: 42, sb: 40 }),
  line("Barry Bonds", 1997, "SF", { hr: 40, sb: 37 }),
  line("Alex Rodriguez", 1998, "SEA", { hr: 42, sb: 46 }),
  line("Alfonso Soriano", 2006, "WSH", { hr: 46, sb: 41 }),
];

export const NEVER_40_30: TeamAbbr[] = [
  "AZ",
  "BAL",
  "BOS",
  "CHC",
  "CWS",
  "CIN",
  "CLE",
  "DET",
  "KC",
  "LAA",
  "MIA",
  "MIN",
  "NYY",
  "PHI",
  "PIT",
  "SD",
  "STL",
  "TB",
  "TEX",
  "TOR",
];

export const LAST_3_HR_WATCH: TeamAbbr[] = [
  "CHC",
  "ATL",
  "PHI",
  "NYM",
  "SD",
  "TB",
  "HOU",
  "LAD",
  "NYY",
  "BOS",
];

const club30ByTeam = byTeam(CLUB_30_30);
const club40ByTeam = byTeam(CLUB_40_40);
const club50ByTeam = byTeam(CLUB_50_HR);

export function franchise30_30(teamAbbr: string): FranchiseMark {
  if (NEVER_30_30.includes(teamAbbr as TeamAbbr)) return { first: null, recentBefore2026: null };
  return clubMark(club30ByTeam[teamAbbr] ?? []);
}

export function franchise40_40(teamAbbr: string): FranchiseMark {
  return clubMark(club40ByTeam[teamAbbr] ?? []);
}

export function franchise50Hr(teamAbbr: string): FranchiseMark {
  if (NEVER_50_HR.includes(teamAbbr as TeamAbbr)) return { first: null, recentBefore2026: null };
  return clubMark(club50ByTeam[teamAbbr] ?? []);
}

export function franchiseFirst40Hr(teamAbbr: string): HistoricLine | null {
  return FIRST_40_HR.find((r) => r.teamAbbr === teamAbbr) ?? null;
}

export function franchiseCycle(teamAbbr: string): FranchiseMark {
  const first = FIRST_CYCLE.find((r) => r.teamAbbr === teamAbbr) ?? null;
  const recent = RECENT_CYCLE_BEFORE_2026.find((r) => r.teamAbbr === teamAbbr) ?? null;
  return { first, recentBefore2026: recent };
}

export function last3Hr(teamAbbr: string): HistoricLine | null {
  return LAST_3_HR.find((r) => r.teamAbbr === teamAbbr) ?? null;
}

export function resolveTeamAbbr(team?: string, teamAbbr?: string): string | undefined {
  if (teamAbbr && TEAMS.includes(teamAbbr as TeamAbbr)) return teamAbbr;
  if (!team) return undefined;
  const abbr = teamAbbrFromName(team);
  return TEAMS.includes(abbr as TeamAbbr) ? abbr : undefined;
}

function named(row: HistoricLine, withDate = false): string {
  const when = withDate && row.date ? prettyIso(row.date) : String(row.year);
  return `${row.player} (${when})`;
}

function prettyIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function droughtJoin(
  id: string,
  stamp: string,
  headline: string,
  prior: HistoricLine | null,
  feat: string,
  receipts: { label: string; value: string }[],
): SeasonJoin {
  const body = prior
    ? `First ${feat} since ${named(prior)}.`
    : `First ${feat} in franchise history.`;
  return { id, stamp, headline, body, receipts };
}

export function last40Hr(teamAbbr: string): HistoricLine | null {
  return LAST_40_HR.find((r) => r.teamAbbr === teamAbbr) ?? null;
}

export function last40_30(teamAbbr: string): HistoricLine | null {
  if (NEVER_40_30.includes(teamAbbr as TeamAbbr)) return null;
  return LAST_40_30.find((r) => r.teamAbbr === teamAbbr) ?? null;
}

function hadConsecutive30_30(teamAbbr: string): boolean {
  const years = [
    ...new Set((club30ByTeam[teamAbbr] ?? []).filter((r) => r.year < SEASON).map((r) => r.year)),
  ].sort((a, b) => a - b);
  return years.some((year, i) => i > 0 && year === years[i - 1]! + 1);
}

/** Join a live season line against historic franchise firsts. */
export function joinSeasonLine(
  teamAbbr: string,
  hr: number,
  sb: number,
  extra: { lastYear?: { homeRuns: number; stolenBases: number }; club?: string } = {},
): SeasonJoin[] {
  const out: SeasonJoin[] = [];
  const club = extra.club ?? "franchise";
  const receipts = [
    { label: "HR", value: String(hr) },
    { label: "SB", value: String(sb) },
  ];

  if (hr >= 40 && sb >= 40) {
    const mark = franchise40_40(teamAbbr);
    const prior = mark.recentBefore2026;
    if (!prior) {
      out.push(
        droughtJoin(
          "franchise-first-40-40",
          "FIRST 40-40",
          `First 40-40 season for the ${club}`,
          null,
          "40-40",
          receipts,
        ),
      );
    } else {
      out.push(
        droughtJoin(
          "franchise-since-40-40",
          "40-40",
          `${hr} HR and ${sb} SB this season`,
          prior,
          `${club} 40-40`,
          receipts,
        ),
      );
    }
  } else if (hr >= 40 && sb >= 30) {
    const prior = last40_30(teamAbbr);
    if (!prior) {
      out.push({
        id: "franchise-first-40-30",
        stamp: "40-30",
        headline: `First 40-HR / 30-SB season for the ${club}`,
        body: "",
        receipts,
      });
    } else if (prior.year <= SEASON - 2) {
      out.push({
        id: "franchise-since-40-30",
        stamp: "40-30",
        headline: `${hr} HR and ${sb} SB this season`,
        body: `First ${club} 40-HR / 30-SB since ${named(prior)}.`,
        receipts,
      });
    }
  }

  if (hr >= 30 && sb >= 30) {
    const mark = franchise30_30(teamAbbr);
    const prior = mark.recentBefore2026;
    if (!prior) {
      out.push(
        droughtJoin(
          "franchise-first-30-30",
          "FIRST 30-30",
          `First 30-30 season for the ${club}`,
          null,
          "30-30",
          receipts,
        ),
      );
    } else if (prior.year <= SEASON - 2) {
      out.push(
        droughtJoin(
          "franchise-since-30-30",
          "30-30",
          `${hr} HR and ${sb} SB this season`,
          prior,
          `${club} 30-30`,
          receipts,
        ),
      );
    }
    const last = extra.lastYear;
    if (last && last.homeRuns >= 30 && last.stolenBases >= 30 && !hadConsecutive30_30(teamAbbr)) {
      out.push({
        id: "franchise-first-consecutive-30-30",
        stamp: "30-30",
        headline: `First consecutive 30-30 seasons for the ${club}`,
        body: `${last.homeRuns} HR, ${last.stolenBases} SB last year.`,
        receipts,
      });
    }
  }

  if (hr >= 50) {
    const mark = franchise50Hr(teamAbbr);
    const prior = mark.recentBefore2026;
    if (!prior) {
      out.push({
        id: "franchise-first-50-hr",
        stamp: "FIRST 50 HR",
        headline: `First 50-HR season for the ${club}`,
        body: `${hr} home runs.`,
        receipts: [{ label: "HR", value: String(hr) }],
      });
    } else if (prior.year <= SEASON - 2) {
      out.push({
        id: "franchise-since-50-hr",
        stamp: "50 HR",
        headline: `${hr} HR this season`,
        body: `First ${club} 50-HR season since ${named(prior)}.`,
        receipts: [{ label: "HR", value: String(hr) }],
      });
    }
  }

  if (hr >= 40) {
    const first = franchiseFirst40Hr(teamAbbr);
    if (!first) {
      out.push({
        id: "franchise-first-40-hr",
        stamp: "FIRST 40 HR",
        headline: `First 40-HR season for the ${club}`,
        body: `${hr} home runs.`,
        receipts: [{ label: "HR", value: String(hr) }],
      });
    } else {
      const prior = last40Hr(teamAbbr);
      if (prior && prior.year <= SEASON - 5) {
        out.push({
          id: "franchise-since-40-hr",
          stamp: "40 HR",
          headline: `${hr} HR this season`,
          body: `First ${club} 40-HR season since ${named(prior)}.`,
          receipts: [{ label: "HR", value: String(hr) }, { label: "Since", value: String(prior.year) }],
        });
      }
    }
  }

  return out;
}

export function joinCycle(teamAbbr: string): SeasonJoin | null {
  const mark = franchiseCycle(teamAbbr);
  if (!mark.first) {
    return {
      id: "franchise-first-cycle",
      stamp: "CYCLE",
      headline: "Hit for the cycle",
      body: "First cycle in franchise history.",
      receipts: [],
    };
  }
  const prior = mark.recentBefore2026 ?? mark.first;
  return {
    id: "franchise-since-cycle",
    stamp: "CYCLE",
    headline: "Hit for the cycle",
    body: `First franchise cycle since ${named(prior, true)}.`,
    receipts: prior.date ? [{ label: "Prev", value: prior.date }] : [],
  };
}

export function join3Hr(teamAbbr: string): SeasonJoin | null {
  const prior = last3Hr(teamAbbr);
  if (!prior) {
    return {
      id: "franchise-first-3hr",
      stamp: "3 HR",
      headline: "3 home runs",
      body: "First 3-HR game in franchise history.",
      receipts: [],
    };
  }
  if (prior.year === SEASON) return null;
  return {
    id: "franchise-since-3hr",
    stamp: "3 HR",
    headline: "3 home runs",
    body: `First franchise 3-HR game since ${named(prior, true)}.`,
    receipts: prior.date ? [{ label: "Prev", value: prior.date }] : [],
  };
}

export function newFranchiseFirsts2026(live: { teamAbbr: string; hr: number; sb: number }[]): string[] {
  const notes: string[] = [];
  for (const row of live) {
    for (const join of joinSeasonLine(row.teamAbbr, row.hr, row.sb)) {
      if (join.id.startsWith("franchise-first-")) {
        notes.push(`${row.teamAbbr}: ${join.headline} (${row.hr} HR, ${row.sb} SB)`);
      }
    }
  }
  return notes;
}
