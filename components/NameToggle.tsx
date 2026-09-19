"use client";

import { useEffect, useState } from "react";

type Names = "full" | "abbr";

function readNames(): Names {
  if (typeof document === "undefined") return "full";
  return document.documentElement.getAttribute("data-names") === "abbr" ? "abbr" : "full";
}

export function NameToggle() {
  const [names, setNames] = useState<Names>("full");

  useEffect(() => {
    setNames(readNames());
  }, []);

  function toggle() {
    const next: Names = names === "full" ? "abbr" : "full";
    setNames(next);
    document.documentElement.setAttribute("data-names", next);
    try {
      localStorage.setItem("names", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      className={`theme-toggle${names === "full" ? " on" : ""}`}
      type="button"
      onClick={toggle}
      aria-pressed={names === "full"}
    >
      Names
    </button>
  );
}
