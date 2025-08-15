"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Rocket, ChevronRight, Map, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Polyglot Roadmap Blueprint (through Aug 2028)
 * Pillars per block:
 *  - Active Pool: 2–3 languages (no mid‑block graduations)
 *  - Passive Incubation: exactly 1 seed language per block
 *  - Maintenance Pool: B2+ languages inducted only AFTER the block
 *
 * Drop this component anywhere (e.g. under the About section in PublicIntro):
 *
 *    <div className="mt-8">
 *      <RoadmapBlueprint />
 *    </div>
 */

// --- Types
interface LangItem {
  name: string;
  note?: string; // e.g., level trajectory ("A2→B2"), or flags like "→ Maintenance"
  graduateAtEnd?: boolean;
}

interface Block {
  id: string; // machine id
  title: string; // human label
  range: string; // date range label
  active: LangItem[]; // 2–3 items
  passive: LangItem; // 1 item
  maintenance: string[]; // the pool DURING this block
  isCurrent?: boolean;
}

// --- Flag map (extend as needed)
const FLAG_MAP: Record<string, string> = {
  French: "🇫🇷",
  Bulgarian: "🇧🇬",
  Norwegian: "🇳🇴",
  Portuguese: "🇧🇷",
  Romanian: "🇷🇴",
  Swedish: "🇸🇪",
  Russian: "🇷🇺",
  Dutch: "🇳🇱",
  Polish: "🇵🇱",
  Italian: "🇮🇹",
  English: "🇬🇧",
  Spanish: "🇪🇸",
};

const BLOCKS: Block[] = [
  {
    id: "2025-2026",
    title: "Block 1",
    isCurrent: true,
    range: "Now → Aug 2026",
    active: [
      { name: "Bulgarian", note: "A2→B2", graduateAtEnd: true },
      { name: "Norwegian", note: "A1→B1" },
      { name: "Portuguese", note: "B1→C1", graduateAtEnd: true },
    ],
    passive: { name: "Romanian", note: "A0 (exposure only)" },
    maintenance: ["French"],
  },
  {
    id: "2026-2027",
    title: "Block 2",
    range: "Sep 2026 → Aug 2027",
    active: [
      { name: "Norwegian", note: "B1→B2", graduateAtEnd: true },
      { name: "Romanian", note: "A0/A2→B2", graduateAtEnd: true },
      { name: "Swedish", note: "A0→B1" },
    ],
    passive: { name: "Russian", note: "A0 (seed)" },
    maintenance: ["French", "Bulgarian", "Portuguese"],
  },
  {
    id: "2027-2028",
    title: "Block 3",
    range: "Sep 2027 → Aug 2028",
    active: [
      { name: "Russian", note: "A0→A2/B1 (Slavic pace; likely B1 max)" },
      { name: "Swedish", note: "B1→B2", graduateAtEnd: true },
      { name: "Dutch", note: "A0→A2/B1" },
    ],
    passive: { name: "Polish", note: "A0 (seed)" },
    maintenance: ["French", "Bulgarian", "Portuguese", "Norwegian", "Romanian"],
  },
];

// --- Visual atoms
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] md:text-xs whitespace-nowrap">
      {children}
    </span>
  );
}

function TippedPill({
  children,
  tip,
}: {
  children: React.ReactNode;
  tip: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        <div className="max-w-[260px] text-xs leading-5">{tip}</div>
      </TooltipContent>
    </Tooltip>
  );
}

function flagFor(name: string) {
  return FLAG_MAP[name] ?? "🌍";
}

function LangChip({
  item,
  kind,
}: {
  item: LangItem;
  kind: "active" | "passive";
}) {
  const tip = (
    <div>
      <div className="font-medium mb-1">
        {flagFor(item.name)} {item.name}
      </div>
      {item.note && (
        <div className="text-muted-foreground mb-1">{item.note}</div>
      )}
      {kind === "active" ? (
        <div>
          <span className="font-medium">Active:</span> focused study this block.
          No mid‑block graduation; if B2+ is reached, induction to Maintenance
          happens at the next block.
        </div>
      ) : (
        <div>
          <span className="font-medium">Passive incubation:</span> light
          exposure only (media, listening, occasional phrases) to prep for a
          future Active push.
        </div>
      )}
      {item.graduateAtEnd && (
        <div className="mt-1 text-muted-foreground">
          Scheduled: → Maintenance at end of this block.
        </div>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm hover:scale-[1.01] transition-all cursor-default">
          <span className="text-base">{flagFor(item.name)}</span>
          <span className="font-medium">{item.name}</span>
          {item.note && (
            <span className="text-[11px] md:text-xs text-muted-foreground">
              {item.note}
            </span>
          )}
          {item.graduateAtEnd && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              → MAINT. (post-block)
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        <div className="max-w-[260px] text-xs leading-5">{tip}</div>
      </TooltipContent>
    </Tooltip>
  );
}

function MaintPill({ name }: { name: string }) {
  const tip = (
    <div>
      <div className="font-medium mb-1">
        {flagFor(name)} {name}
      </div>
      <div>
        <span className="font-medium">Maintenance Pool:</span> B2+ languages
        kept forever with ~1–2h/week touch (content + occasional speaking).
        Purpose: prevent slippage, not push new gains.
      </div>
    </div>
  );
  return (
    <TippedPill tip={tip}>
      <Pill>
        <span className="mr-1">{flagFor(name)}</span>
        {name}
      </Pill>
    </TippedPill>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs">
      <TippedPill
        tip={
          <div>
            <div className="font-medium mb-1">Active Pool</div>
            2–3 languages receiving the majority of effort this block. No
            mid‑block promotions; graduation to Maintenance only at block
            change.
          </div>
        }
      >
        <Pill>
          <Rocket className="h-3.5 w-3.5" /> Active Pool
        </Pill>
      </TippedPill>

      <TippedPill
        tip={
          <div>
            <div className="font-medium mb-1">Passive Incubation</div>
            Exactly 1 seed language per block. Light exposure (media, light
            reading) to shorten the ramp when it becomes Active later.
          </div>
        }
      >
        <Pill>
          <Map className="h-3.5 w-3.5" /> Passive Incubation (1 per block)
        </Pill>
      </TippedPill>

      <TippedPill
        tip={
          <div>
            <div className="font-medium mb-1">Maintenance Pool</div>
            B2+ languages. Aim for ~1–2h per week. Goal is retention and
            freshness; these remain in the pool indefinitely.
          </div>
        }
      >
        <Pill>
          <Sparkles className="h-3.5 w-3.5" /> Maintenance Pool (B2+; inducted
          after block)
        </Pill>
      </TippedPill>

      <TippedPill
        tip={
          <div>
            <div className="font-medium mb-1">Graduation Rule</div>
            Even if a language reaches B2 mid‑block, it remains Active until the
            block ends. Induction to Maintenance occurs at the start of the next
            block.
          </div>
        }
      >
        <Pill>
          <ChevronRight className="h-3.5 w-3.5" /> No mid‑block graduations
        </Pill>
      </TippedPill>
    </div>
  );
}

export default function RoadmapBlueprint() {
  const blocks = useMemo(() => BLOCKS, []);

  return (
    <TooltipProvider delayDuration={80}>
      <Card className="neu overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl md:text-2xl tracking-tight">
                Language Roadmap • Blueprint to Aug 2028
              </CardTitle>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                Three pillars per block: <strong>Active</strong>,{" "}
                <strong>Passive Incubation</strong>,{" "}
                <strong>Maintenance</strong>.
              </div>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              No mid‑block promotions
            </Badge>
          </div>
          <div className="mt-3">
            <Legend />
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Blueprint grid */}
          <div className="relative rounded-xl border border-border bg-[radial-gradient(circle_at_1px_1px,theme(colors.border)_1px,transparent_0)] [background-size:16px_16px] p-3 md:p-4">
            <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-3">
              {blocks.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.18, delay: i * 0.05 }}
                  className={`rounded-lg ${
                    b.isCurrent
                      ? "border-2 border-pink-500"
                      : "border border-border"
                  } bg-background/70 p-3 md:p-4`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold">{b.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {b.range}
                      </div>
                    </div>
                    <Badge className="text-[10px]" variant="outline">
                      Block {i + 1} {b.isCurrent && "[CURRENT BLOCK I'm in]"}
                    </Badge>
                  </div>

                  {/* Active */}
                  <section className="mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Rocket className="h-4 w-4" />
                      <div className="text-sm font-medium">
                        Active Pool (2–3)
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {b.active.map((item) => (
                        <LangChip
                          key={`${b.id}-${item.name}`}
                          item={item}
                          kind="active"
                        />
                      ))}
                    </div>
                  </section>

                  {/* Passive */}
                  <section className="mt-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Map className="h-4 w-4" />
                      <div className="text-sm font-medium">
                        Passive Incubation (1)
                      </div>
                    </div>
                    <div>
                      <LangChip item={b.passive} kind="passive" />
                    </div>
                  </section>

                  {/* Maintenance (during this block) */}
                  <section className="mt-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="h-4 w-4" />
                      <div className="text-sm font-medium">
                        Maintenance Pool (during block)
                      </div>
                    </div>
                    {b.maintenance.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        None yet.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {b.maintenance.map((m) => (
                          <MaintPill key={`${b.id}-${m}`} name={m} />
                        ))}
                      </div>
                    )}
                  </section>
                </motion.div>
              ))}
            </div>

            {/* Footer rule reminder */}
            <div className="mt-4 text-[11px] text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5" />
              <span>
                Languages marked with <em>→ MAINT. (end of block)</em> only join
                the Maintenance Pool after the block boundary — never mid‑block.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
