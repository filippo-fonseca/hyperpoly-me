"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import EffortScale from "./EffortScale";
import { effortBg, effortLabel } from "@/lib/effort";
import PastDays from "./PastDays";
import { Badge } from "./ui/badge";
import { bucketOf, maturityLabel } from "./PublicIntro";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

/** Compact pill for showing average effort with emoji + label + numeric avg */
export function EffortBadge({ avg }: { avg: number }) {
  const rounded = Math.min(5, Math.max(1, Math.round(avg || 0))) as
    | 1
    | 2
    | 3
    | 4
    | 5;
  const face: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "😌", // passive / recovery
    2: "🙂", // light
    3: "🧠", // focused
    4: "💪", // hard
    5: "🔥", // max effort
  };
  const label = effortLabel[rounded] || "—";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-1.5 py-1 text-[10px] ${effortBg(
        rounded
      )}`}
      title={`Avg effort ${avg.toFixed(2)} — ${label}`}
      aria-label={`Average effort ${avg.toFixed(2)} (${label})`}
    >
      <span>
        {face[rounded]} {label}:{" "}
        <span className="font-bold">{avg.toFixed(1)}</span>
      </span>

      {/* <span>•</span>
      <span>{avg.toFixed(2)}</span> */}
    </span>
  );
}

export default function DailyReview({ maxHeightPx }: { maxHeightPx?: number }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const langsSnap = await getDocs(collection(db, "languages"));
      const langs = langsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Language)
      );
      const day = todayStr();
      const qy = query(collection(db, "entries"), where("date", "==", day));
      const entSnap = await getDocs(qy);
      const ents = entSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Entry)
      );
      setLanguages(langs);
      setEntries(ents);
      setLoading(false);
    })();
  }, []);

  const langById = useMemo(() => {
    const m = new Map<string, Language>();
    languages.forEach((l) => m.set(l.id, l));
    return m;
  }, [languages]);

  const totals = useMemo(() => {
    if (!entries.length) return { totalMin: 0, avgEffort: 0, avgMinPerLang: 0 };
    const totalMin = entries.reduce((s, e) => s + (e.minutes || 0), 0);
    const avgEffort =
      entries.reduce((s, e) => s + (e.effort || 0), 0) / entries.length;
    const uniqueLangs = new Set(entries.map((e) => e.languageId)).size || 1;
    const avgMinPerLang = totalMin / uniqueLangs;
    return { totalMin, avgEffort, avgMinPerLang };
  }, [entries]);

  if (loading) {
    return (
      <Card
        className="zen neu h-full flex flex-col"
        style={maxHeightPx ? { maxHeight: maxHeightPx } : undefined}
      >
        <CardHeader>
          <CardTitle>What I have done today — {todayStr()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="surface rounded-xl p-4 animate-pulse h-[92px]"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="zen neu h-full flex flex-col"
      style={maxHeightPx ? { maxHeight: maxHeightPx } : undefined}
    >
      <CardHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardTitle>What I have done today — {todayStr()}</CardTitle>
      </CardHeader>

      {/* make the content the scrolling region */}
      <CardContent className="min-h-0 overflow-y-auto overscroll-contain">
        {/* Small stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">
              Total minutes
            </div>
            <div className="text-2xl font-semibold mt-1">{totals.totalMin}</div>
          </div>

          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">Avg effort</div>
            <div className="mt-2">
              <EffortBadge avg={totals.avgEffort} />
            </div>
          </div>

          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">
              Avg min per lang
            </div>
            <div className="text-2xl font-semibold mt-1">
              {totals.avgMinPerLang.toFixed(1)}
            </div>
          </div>
        </div>

        <EffortScale compact />

        {/* Entries list */}
        <div className="mt-4">
          <AnimatePresence initial={false}>
            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No entries today (yet). Check back later!
              </div>
            ) : (
              entries.map((e, idx) => {
                const lang = langById.get(e.languageId);
                const bucket = bucketOf(lang);
                const tag = lang?.native
                  ? "native"
                  : lang?.level ?? maturityLabel(bucket);
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut",
                      delay: 0.02 * idx,
                    }}
                    className="mb-3 last:mb-0"
                  >
                    <div className="surface rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang?.emoji ?? "🌍"}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{lang?.name ?? ""}</span>
                          <Badge
                            className="ml-1 capitalize"
                            style={{
                              backgroundColor: lang?.color ?? undefined,
                            }}
                          >
                            {String(tag).toLowerCase()}
                          </Badge>
                        </div>
                        <span
                          className={`ml-auto inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs ${effortBg(
                            (e.effort as any) || 3
                          )}`}
                          title={`${e.effort} — ${
                            effortLabel[(e.effort as any) || 3]
                          }`}
                        >
                          <span className="font-medium">{e.minutes} min</span>
                          <span>•</span>
                          <span>{effortLabel[(e.effort as any) || 3]}</span>
                        </span>
                      </div>
                      {e.content && (
                        <p className="whitespace-pre-wrap text-[15px] leading-7 mt-2">
                          {e.content}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Yesterday (inside the scroll area) */}
        <div className="min-w-0 mt-4">
          <PastDays
            onlyYesterday
            title="What I did yesterday"
            scrollable
            maxDates={1}
          />
        </div>
      </CardContent>
    </Card>
  );
}
