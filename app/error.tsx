"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <div className="kicker">Live feed hiccup</div>
      <h1 className="brand">Couldn’t load the slate</h1>
      <p className="lede">{error.message}</p>
      <div className="actions">
        <button className="btn" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
