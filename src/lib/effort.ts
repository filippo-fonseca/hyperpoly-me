export type Effort = 1 | 2 | 3 | 4 | 5;

export const effortLabel: Record<Effort, string> = {
  1: "Passive",
  2: "Light",
  3: "Focused",
  4: "Intense",
  5: "Deep",
};

export const effortHelp: Record<Effort, string> = {
  1: "Passive: podcasts, YouTube, background listening, etc.",
  2: "Light: low-friction input or short practice.",
  3: "Focused: deliberate practice with attention.",
  4: "Intense: challenging drills, output-heavy work.",
  5: "Deep: long, immersive, highly demanding session.",
};

export function effortBg(e: Effort) {
  // soft, readable backgrounds (works in light & dark)
  switch (e) {
    case 1: return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case 2: return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case 3: return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case 4: return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case 5: return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  }
}
