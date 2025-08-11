"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import EffortScale from "./EffortScale";
import { effortBg, effortLabel } from "@/lib/effort";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

export default function DailyReview() {
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
      <Card className="zen neu">
        <CardHeader>
          <CardTitle>What I have done today... — {todayStr()}</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="surface rounded-xl p-4 animate-pulse h-[92px]"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-5 items-stretch">
      <Card className="md:col-span-3 zen neu">
        <CardHeader>
          <CardTitle>What I have done today... {todayStr()}</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">
              Total minutes
            </div>
            <div className="text-2xl font-semibold mt-1">{totals.totalMin}</div>
          </div>
          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">
              Avg effort (1–5)
            </div>
            <div className="text-2xl font-semibold mt-1">
              {totals.avgEffort.toFixed(2)}
            </div>
          </div>
          <div className="neu-inset p-4 min-h-[92px]">
            <div className="text-[11px] text-muted-foreground">
              Avg min per language
            </div>
            <div className="text-2xl font-semibold mt-1">
              {totals.avgMinPerLang.toFixed(1)}
            </div>
          </div>
        </CardContent>
        <EffortScale compact />
      </Card>

      <AnimatePresence initial={false}>
        {entries.length === 0 ? (
          <Card className="md:col-span-3 zen neu">
            <CardContent>
              <p className="text-muted-foreground">
                No entries today (yet). Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          entries.map((e, idx) => {
            const lang = langById.get(e.languageId);
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
                className="h-full"
              >
                <Card className="zen neu h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">{lang?.emoji ?? "🌍"}</span>
                      <span>{lang?.name ?? "Unknown language"}</span>
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-[15px] leading-7">
                      {e.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
