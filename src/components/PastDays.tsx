"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { format, isYesterday, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const MAX_DATES_DEFAULT = 30;

type DayGroup = {
  date: string;
  entries: Entry[];
};

export default function PastDays({
  onlyYesterday = false,
  maxDates = MAX_DATES_DEFAULT,
  title = "Past Days",
  scrollable = false,
}: {
  onlyYesterday?: boolean;
  maxDates?: number;
  title?: string;
  scrollable?: boolean;
}) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const langById = useMemo(() => {
    const m = new Map<string, Language>();
    languages.forEach((l) => m.set(l.id, l));
    return m;
  }, [languages]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // languages
      const langsSnap = await getDocs(collection(db, "languages"));
      const langs = langsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Language)
      );
      setLanguages(langs);

      // entries (grab plenty; we'll filter locally)
      const entriesSnap = await getDocs(
        query(collection(db, "entries"), orderBy("date", "desc"), limit(500))
      );
      const rows = entriesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Entry)
      );

      const today = todayStr();
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

      // group by date, excluding today; if onlyYesterday, keep just that date
      const byDate = new Map<string, Entry[]>();
      for (const e of rows) {
        if (e.date === today) continue;
        if (onlyYesterday && e.date !== yesterday) continue;
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date)!.push(e);
      }

      const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
        b.localeCompare(a)
      );
      const limited = sortedDates.slice(0, maxDates);

      const out: DayGroup[] = limited.map((date) => ({
        date,
        entries: byDate.get(date)!,
      }));

      setGroups(out);

      // Auto-open the latest day by default (first in the sorted list).
      // Respects user toggles by only doing this when nothing is open yet.
      if (out.length > 0) {
        const latest = out[0].date;
        setOpenDates((prev) => {
          if (prev.size > 0) return prev; // don't override user choices
          const next = new Set(prev);
          next.add(latest);
          return next;
        });
      }

      setLoading(false);
    })();
  }, [onlyYesterday, maxDates]);

  function toggle(date: string) {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  if (loading) {
    return (
      <Card className="zen neu w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={
              scrollable
                ? "max-h-[70vh] overflow-y-auto pr-1 min-w-0"
                : "min-w-0"
            }
          >
            <div className="relative min-w-0">
              {/* timeline gutter */}
              <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-border/60" />

              <div className="space-y-3 pl-6 sm:pl-8 min-w-0">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative">
                    {/* dot */}
                    <div className="absolute left-[-14px] sm:left-[-18px] top-2 h-3 w-3 rounded-full bg-muted/70" />

                    <div className="surface rounded-xl p-3">
                      {/* header row skeleton */}
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                        <div className="h-6 w-16 rounded-full bg-muted/80 animate-pulse" />
                        <div className="h-6 w-24 rounded-full bg-muted/70 animate-pulse" />
                        <div className="h-6 w-28 rounded-full bg-muted/70 animate-pulse" />
                        <div className="ml-auto h-8 w-16 rounded-md bg-muted/80 animate-pulse" />
                      </div>

                      {/* entries grid skeleton */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0, 1].map((k) => (
                          <div
                            key={k}
                            className="rounded-lg border border-border/70 p-3 bg-background/70"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-muted/70 animate-pulse" />
                              <div className="h-4 w-36 rounded bg-muted/60 animate-pulse" />
                              <div className="ml-auto h-6 w-28 rounded-full bg-muted/70 animate-pulse" />
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="h-3 w-full rounded bg-muted/50 animate-pulse" />
                              <div className="h-3 w-5/6 rounded bg-muted/40 animate-pulse" />
                              <div className="h-3 w-2/3 rounded bg-muted/40 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="zen neu w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No previous days yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 min-w-0 w-full">
      <Card className="zen neu w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={
              scrollable
                ? "max-h-[70vh] overflow-y-auto pr-1 min-w-0"
                : "min-w-0"
            }
          >
            <div className="relative min-w-0">
              {/* timeline gutter */}
              <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-border/60" />
              <div className="space-y-3 min-w-0">
                {groups.map(({ date, entries }, idx) => {
                  const totalMin = entries.reduce(
                    (s, e) => s + (e.minutes || 0),
                    0
                  );
                  const avgEffort =
                    entries.reduce((s, e) => s + (e.effort || 0), 0) /
                    (entries.length || 1);
                  const langCount = new Set(entries.map((e) => e.languageId))
                    .size;

                  const open = openDates.has(date);

                  return (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
                      transition={{
                        duration: 0.22,
                        ease: "easeOut",
                        delay: 0.01 * idx,
                      }}
                      className="relative pl-6 sm:pl-8 min-w-0"
                    >
                      <div className="absolute left-1 sm:left-1.5 top-2 h-3 w-3 rounded-full bg-primary/70 shadow" />

                      <div className="surface rounded-xl p-3 min-w-0">
                        {/* header row */}
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <div className="font-medium truncate">{date}</div>
                          <Badge className="shrink-0">{totalMin} min</Badge>
                          <Badge className="shrink-0">
                            Effort {avgEffort.toFixed(2)}
                          </Badge>
                          <Badge className="shrink-0" variant="accent">
                            {langCount} language{langCount === 1 ? "" : "s"}
                          </Badge>
                          <div className="ml-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggle(date)}
                              aria-expanded={open}
                              aria-controls={`day-${date}`}
                            >
                              {open ? "Hide" : "View"}
                            </Button>
                          </div>
                        </div>

                        {/* entries */}
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              id={`day-${date}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch min-w-0">
                                {entries.map((e) => {
                                  const lang = langById.get(e.languageId);
                                  return (
                                    <div
                                      key={e.id}
                                      className="bg-background/70 rounded-lg p-3 border border-border/70 h-full min-w-0 w-full"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-lg shrink-0">
                                          {lang?.emoji ?? "🌍"}
                                        </span>
                                        {!isYesterday && (
                                          <div className="font-medium truncate">
                                            {lang?.name ?? "Unknown language"}
                                          </div>
                                        )}
                                        <Badge className="ml-auto shrink-0">
                                          {e.minutes} min{" "}
                                          {!isYesterday &&
                                            `• Effort ${e.effort}`}
                                        </Badge>
                                      </div>
                                      {e.content?.trim() ? (
                                        <p className="mt-2 text-[15px] whitespace-pre-wrap leading-7 break-words">
                                          {e.content}
                                        </p>
                                      ) : (
                                        <p className="mt-2 text-sm text-muted-foreground italic">
                                          No content provided.
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              Showing last {Math.min(groups.length, maxDates)} day
              {Math.min(groups.length, maxDates) === 1 ? "" : "s"} with entries.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
