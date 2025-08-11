"use client";

import { effortLabel, effortHelp } from "@/lib/effort";
import { Info } from "lucide-react";
import { useState } from "react";

export default function EffortScale({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background/70">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        aria-expanded={open}
      >
        <div className="text-sm font-medium">Effort scale (1–5)</div>
        <Info className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Lower effort ≠ worse. It just describes the <strong>type</strong> of
            session. They're all important!
          </p>
          <ul
            className={`grid ${
              compact ? "sm:grid-cols-2" : "sm:grid-cols-3"
            } gap-2`}
          >
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <li
                key={n}
                className="rounded-md border border-border/70 p-2 text-sm"
              >
                <div className="flex items-center gap-2 font-medium">
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: dot(n) }}
                  />
                  {n} — {effortLabel[n]}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {effortHelp[n]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function dot(n: 1 | 2 | 3 | 4 | 5) {
  // readable dots that roughly match the badge hues
  return (
    {
      1: "#10B981", // emerald
      2: "#0EA5E9", // sky
      3: "#8B5CF6", // violet
      4: "#F59E0B", // amber
      5: "#F43F5E", // rose
    } as const
  )[n];
}
