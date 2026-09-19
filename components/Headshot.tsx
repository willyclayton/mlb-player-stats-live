"use client";

import { useState } from "react";
import { headshotUrl } from "@/lib/format";

export function Headshot({
  id,
  name,
  size = 213,
  className,
}: {
  id: number;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <div
        className={className}
        aria-hidden
        style={{
          display: "grid",
          placeItems: "center",
          width: size > 200 ? 108 : 56,
          height: size > 200 ? 108 : 56,
          borderRadius: "50%",
          background: "#1a2234",
          color: "#f0c14b",
          fontFamily: "var(--font-display)",
          fontSize: size > 200 ? 32 : 18,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={headshotUrl(id, size)}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
