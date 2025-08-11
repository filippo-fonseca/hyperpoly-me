"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const MAX_DATES = 30;

type DayGroup = {
  date: string;
  entries: Entry[];
};

export default function PastDays() {
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

      const langsSnap = await getDocs(collection(db, "languages"));
      const langs = langsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Language)
      );
      setLanguages(langs);

      const entriesSnap = await getDocs(
        query(collection(db, "entries"), orderBy("date", "desc"), limit(500))
      );
      const rows = entriesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Entry)
      );

      const today = todayStr();
      const byDate = new Map<string, Entry[]>();
      for (const e of rows) {
        if (e.date === today) continue;
        if (!byDate.has(e.date)) byDate.set(e.date, []);
        byDate.get(e.date)!.push(e);
      }

      const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
        b.localeCompare(a)
      );

      const limitedDates = sortedDates.slice(0, MAX_DATES);
      const out: DayGroup[] = limitedDates.map((date) => ({
        date,
        entries: byDate.get(date)!,
      }));

      setGroups(out);
      setLoading(false);
    })();
  }, []);

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
      <Card className="zen neu">
        <CardHeader>
          <CardTitle>Past Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 surface rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="zen neu">
        <CardHeader>
          <CardTitle>Past Days</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No previous days yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="zen neu">
        <CardHeader>
          <CardTitle>Past Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border/60" />
            <div className="space-y-3">
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
                    className="pl-8 relative"
                  >
                    <div className="absolute left-1.5 top-2 h-3 w-3 rounded-full bg-primary/70 shadow" />
                    <div className="surface rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{date}</div>
                        <Badge className="ml-2">{totalMin} min</Badge>
                        <Badge>Effort {avgEffort.toFixed(2)}</Badge>
                        <Badge>
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
                            <div className="mt-3 grid md:grid-cols-2 gap-3 items-stretch">
                              {entries.map((e) => {
                                const lang = langById.get(e.languageId);
                                return (
                                  <div
                                    key={e.id}
                                    className="bg-background/70 rounded-lg p-3 border border-border/70 h-full"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">
                                        {lang?.emoji ?? "🌍"}
                                      </span>
                                      <div className="font-medium">
                                        {lang?.name ?? "Unknown language"}
                                      </div>
                                      <Badge
                                        className="ml-auto"
                                        style={{
                                          backgroundColor:
                                            lang?.color ?? "transparent",
                                        }}
                                      >
                                        {e.minutes} min • Effort {e.effort}
                                      </Badge>
                                    </div>
                                    {e.content?.trim() ? (
                                      <p className="mt-2 text-[15px] whitespace-pre-wrap leading-7">
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
            Showing last {Math.min(groups.length, MAX_DATES)} days with entries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
