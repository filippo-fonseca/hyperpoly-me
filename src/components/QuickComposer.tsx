"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion } from "framer-motion";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function QuickComposer() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [entriesToday, setEntriesToday] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState("");
  const [minutes, setMinutes] = useState("");
  const [effort, setEffort] = useState("3");
  const [saving, setSaving] = useState(false);

  // Load languages
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "languages"));
      const langs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Language)
      );
      langs.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      setLanguages(langs);
    })();
  }, []);

  // Load today's entries so we can filter languages
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "entries"), where("date", "==", today()));
      const snap = await getDocs(q);
      const ids = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as Entry;
        if (data.languageId) ids.add(data.languageId);
      });
      setEntriesToday(ids);
    })();
  }, []);

  // Filter languages so only ones without today's entry are selectable
  const availableLanguages = useMemo(() => {
    return languages.filter((l) => !entriesToday.has(l.id));
  }, [languages, entriesToday]);

  // Grouped dropdown options
  const groups = useMemo(() => {
    const learning = availableLanguages.filter(
      (l) => l.isLearning && !l.native
    );
    const natives = availableLanguages.filter((l) => l.native);
    const other = availableLanguages.filter((l) => !l.native && !l.isLearning);
    return { learning, natives, other };
  }, [availableLanguages]);

  const selectedLang = useMemo(
    () => languages.find((l) => l.id === selected),
    [languages, selected]
  );

  async function submit() {
    if (!selected) return;
    setSaving(true);
    const docId = `${today()}_${selected}`;
    const now = Date.now();
    const payload: Omit<Entry, "id"> = {
      date: today(),
      languageId: selected,
      content,
      minutes: Number(minutes) || 0,
      effort: Number(effort) || 1,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "entries", docId), payload, { merge: true });
    setSaving(false);
    setContent("");
    setMinutes("");
    setEffort("3");

    // Update local entriesToday so dropdown updates immediately
    setEntriesToday((prev) => new Set(prev).add(selected));
    setSelected("");
  }

  return (
    <Card className="zen neu">
      <CardHeader className="pb-2">
        <CardTitle>Add today’s entry</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Language dropdown */}
        <div className="grid gap-2">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="qc-language"
          >
            Language
          </label>
          <select
            id="qc-language"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full h-11 rounded-md border bg-background px-3 neu-inset"
          >
            <option value="">Select a language…</option>

            {groups.learning.length > 0 && (
              <optgroup label="Learning">
                {groups.learning.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.emoji ?? "🌍") + " " + l.name}
                  </option>
                ))}
              </optgroup>
            )}
            {groups.natives.length > 0 && (
              <optgroup label="Native">
                {groups.natives.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.emoji ?? "🌍") + " " + l.name}
                  </option>
                ))}
              </optgroup>
            )}
            {groups.other.length > 0 && (
              <optgroup label="Other">
                {groups.other.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.emoji ?? "🌍") + " " + l.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Composer */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="grid md:grid-cols-3 gap-3"
          >
            <div className="md:col-span-3">
              <Textarea
                placeholder={`What did you do today for ${
                  selectedLang?.name ?? "this language"
                }…`}
                className="neu-inset min-h-[120px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                min={0}
                placeholder="Minutes (e.g. 45)"
                className="neu-inset"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
                className="w-full h-11 rounded-md border bg-background px-3 neu-inset"
                aria-label="Effort (1–5)"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Effort {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={submit}
                disabled={saving || !selected}
                className="shadow-neumorphic-sm"
              >
                {saving ? "Saving…" : "Post entry"}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
