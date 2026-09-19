import { HomeClient } from "@/components/HomeClient";
import { getHomeCached } from "@/lib/mlb";

export const revalidate = 60;

export default async function HomePage() {
  const initial = await getHomeCached();
  return <HomeClient initial={initial} />;
}
