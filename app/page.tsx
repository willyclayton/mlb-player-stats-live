import { HomeClient } from "@/components/HomeClient";
import { getHome } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initial = await getHome();
  return <HomeClient initial={initial} />;
}
