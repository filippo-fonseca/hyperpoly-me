"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function EntryEditor() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry | null>>({});
  const [active, setActive] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  async function load() {
    const langsSnap = await getDocs(collection(db, "languages"));
    const langs = langsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Language)
    );
    setLanguages(langs);

    const entSnap = await getDocs(
      query(collection(db, "entries"), where("date", "==", today()))
    );
    const byLang: Record<string, Entry> = {};
    entSnap.docs.forEach((d) => {
      const e = { id: d.id, ...d.data() } as Entry;
      byLang[e.languageId] = e;
    });
    setEntries(byLang);

    const preActive = new Set(Object.keys(byLang));
    setActive(preActive);
  }

  useEffect(() => {
    load();
  }, []);

  const langMap = useMemo(() => {
    const m = new Map<string, Language>();
    languages.forEach((l) => m.set(l.id, l));
    return m;
  }, [languages]);

  async function saveForLanguage(
    langId: string,
    form: { content: string; minutes: number; effort: number }
  ) {
    setSaving(true);
    const docId = `${today()}_${langId}`;
    const now = Date.now();
    const payload: Omit<Entry, "id"> = {
      date: today(),
      languageId: langId,
      content: form.content,
      minutes: Number(form.minutes) || 0,
      effort: Number(form.effort) || 1,
      createdAt: entries[langId]?.createdAt ?? now,
      updatedAt: now,
    };
    await setDoc(doc(db, "entries", docId), payload);
    await load();
    setSaving(false);
  }

  async function deleteForLanguage(langId: string) {
    const docId = `${today()}_${langId}`;
    await deleteDoc(doc(db, "entries", docId));
    await load();
  }

  function toggleActive(langId: string) {
    setActive((prev) => {
      const n = new Set(prev);
      if (n.has(langId)) n.delete(langId);
      else n.add(langId);
      return n;
    });
  }

  return (
    <Card className="zen neu">
      <CardHeader>
        <CardTitle>Today’s Entries — {today()}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {languages.length === 0 && (
          <div className="muted-text">Add languages above to begin.</div>
        )}

        {/* Language chips */}
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => {
            const isActive = active.has(l.id);
            const hasEntry = !!entries[l.id];
            return (
              <button
                key={l.id}
                onClick={() => toggleActive(l.id)}
                className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all border
                  ${
                    isActive
                      ? "bg-primary/10 border-border/60"
                      : "bg-background border-border hover:bg-background/60"
                  }
                `}
                aria-pressed={isActive}
                title={l.name}
              >
                <span className="text-base">{l.emoji ?? "🌍"}</span>
                <span className="font-medium">{l.name}</span>
                {hasEntry && (
                  <Badge
                    className="ml-1"
                    style={{ backgroundColor: l.color ?? "transparent" }}
                  >
                    added
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Editors */}
        <div className="grid gap-5 items-stretch">
          <AnimatePresence initial={false}>
            {languages
              .filter((l) => active.has(l.id) || entries[l.id])
              .map((l, idx) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    delay: 0.01 * idx,
                  }}
                  className="surface p-4 rounded-xl"
                >
                  <EntryRow
                    lang={l}
                    existing={entries[l.id] ?? null}
                    onSave={(form) => saveForLanguage(l.id, form)}
                    onDelete={() => deleteForLanguage(l.id)}
                    saving={saving}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function EntryRow({
  lang,
  existing,
  onSave,
  onDelete,
  saving,
}: {
  lang: Language;
  existing: Entry | null;
  onSave: (form: { content: string; minutes: number; effort: number }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [minutes, setMinutes] = useState(existing?.minutes?.toString() ?? "");
  const [effort, setEffort] = useState(existing?.effort?.toString() ?? "3");

  useEffect(() => {
    setContent(existing?.content ?? "");
    setMinutes(existing?.minutes?.toString() ?? "");
    setEffort(existing?.effort?.toString() ?? "3");
  }, [existing?.content, existing?.minutes, existing?.effort]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{lang.emoji ?? "🌍"}</span>
          <div className="font-medium truncate">{lang.name}</div>
          <Badge
            className="ml-1"
            style={{ background: lang.color ?? "transparent" }}
          >
            {lang.native ? "Native" : lang.level}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <Button variant="outline" onClick={onDelete}>
              Delete today’s entry
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="md:col-span-3">
          <Label>Content</Label>
          <Textarea
            placeholder="What did you do today in this language?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="neu-inset min-h-[120px]"
          />
        </div>
        <div>
          <Label>Minutes</Label>
          <Input
            type="number"
            min={0}
            placeholder="e.g., 45"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="neu-inset"
          />
        </div>
        <div>
          <Label>Effort (1–5)</Label>
          <select
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
            className="w-full h-10 rounded-md border bg-background px-3 neu-inset"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n.toString()}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() =>
              onSave({
                content,
                minutes: Number(minutes),
                effort: Number(effort),
              })
            }
            disabled={saving}
            className="shadow-neumorphic-sm"
          >
            {saving ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
