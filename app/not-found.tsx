import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="match">Not in the feed</h1>
      <p className="lede">That player or game isn’t in the live MLB file.</p>
      <p className="hint">
        <Link href="/">Back to today’s games</Link>
      </p>
    </div>
  );
}
