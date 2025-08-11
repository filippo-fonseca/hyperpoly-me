"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { Language } from "../../lib/types";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type LangDraft = {
  id?: string;
  name: string;
  emoji: string;
  color: string;
  isLearning?: boolean;
  native?: boolean;
  level?: (typeof LEVELS)[number] | "";
};

function normalize(l: any): LangDraft {
  return {
    id: l.id,
    name: l.name ?? "",
    emoji: l.emoji ?? "",
    color: l.color ?? "#EC4899",
    isLearning: !!l.isLearning,
    native: !!l.native,
    level: l.level ?? "",
  };
}
function same(a: LangDraft, b: LangDraft) {
  return (
    a.name === b.name &&
    a.emoji === b.emoji &&
    a.color === b.color &&
    !!a.isLearning === !!b.isLearning &&
    !!a.native === !!b.native &&
    (a.native ? "" : a.level || "") === (b.native ? "" : b.level || "")
  );
}

export default function LanguageManager({ onClose }: { onClose?: () => void }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({});
  const [rowDeleting, setRowDeleting] = useState<Record<string, boolean>>({});

  const [original, setOriginal] = useState<LangDraft[]>([]);
  const [languages, setLanguages] = useState<LangDraft[]>([]);
  const [newLang, setNewLang] = useState<LangDraft>({
    name: "",
    emoji: "",
    color: "#EC4899",
    isLearning: true,
    native: false,
    level: "A1",
  });

  // Load all languages
  async function load() {
    setInitialLoading(true);
    const snap = await getDocs(collection(db, "languages"));
    const list = snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const ra = a.isLearning ? 0 : a.native ? 2 : 1;
      const rb = b.isLearning ? 0 : b.native ? 2 : 1;
      return ra - rb;
    });
    setOriginal(list);
    setLanguages(list);
    setInitialLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const l of languages) {
      const base = original.find((o) => o.id === l.id);
      if (base && !same(base, l)) count++;
    }
    return count;
  }, [languages, original]);

  async function addLanguage() {
    if (!newLang.name.trim()) return;
    setRowSaving((m) => ({ ...m, __new: true }));
    const payload: any = {
      name: newLang.name,
      emoji: newLang.emoji,
      color: newLang.color,
      isLearning: !!newLang.isLearning,
      native: !!newLang.native,
    };
    if (!newLang.native && newLang.level) payload.level = newLang.level;
    await addDoc(collection(db, "languages"), payload);
    setNewLang({
      name: "",
      emoji: "",
      color: "#EC4899",
      isLearning: true,
      native: false,
      level: "A1",
    });
    await load();
    setRowSaving((m) => {
      const n = { ...m };
      delete n["__new"];
      return n;
    });
  }

  async function saveRow(l: LangDraft) {
    if (!l.id) return;
    setRowSaving((m) => ({ ...m, [l.id!]: true }));
    const payload: any = {
      name: l.name,
      emoji: l.emoji,
      color: l.color,
      isLearning: !!l.isLearning,
      native: !!l.native,
    };
    payload.level = l.native ? "" : l.level || "";
    await setDoc(doc(db, "languages", l.id), payload, { merge: true });
    await load();
    setRowSaving((m) => ({ ...m, [l.id!]: false }));
  }

  async function deleteRow(id?: string) {
    if (!id) return;
    setRowDeleting((m) => ({ ...m, [id]: true }));
    await deleteDoc(doc(db, "languages", id));
    await load();
    setRowDeleting((m) => ({ ...m, [id]: false }));
  }

  async function saveAll() {
    const changed = languages.filter((l) => {
      const base = original.find((o) => o.id === l.id);
      return base && !same(base, l);
    });
    if (changed.length === 0) return;
    setSavingAll(true);
    for (const l of changed) {
      if (!l.id) continue;
      const payload: any = {
        name: l.name,
        emoji: l.emoji,
        color: l.color,
        isLearning: !!l.isLearning,
        native: !!l.native,
      };
      payload.level = l.native ? "" : l.level || "";
      await setDoc(doc(db, "languages", l.id), payload, { merge: true });
    }
    await load();
    setSavingAll(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <CardTitle className="text-lg">Manage languages</CardTitle>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={saveAll}
              disabled={savingAll || initialLoading || dirtyCount === 0}
            >
              {savingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save all{" "}
              {dirtyCount > 0 && <span className="ml-1">({dirtyCount})</span>}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        {/* Add new language */}
        <Card className="zen neu">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              is it time to add another? be certain.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-5 gap-3">
              <Input
                placeholder="Name (e.g., Français)"
                value={newLang.name}
                onChange={(e) =>
                  setNewLang((s) => ({ ...s, name: e.target.value }))
                }
                className="neu-inset"
              />
              <Input
                placeholder="Emoji (e.g., 🇫🇷)"
                value={newLang.emoji}
                onChange={(e) =>
                  setNewLang((s) => ({ ...s, emoji: e.target.value }))
                }
                className="neu-inset"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={newLang.color}
                  onChange={(e) =>
                    setNewLang((s) => ({ ...s, color: e.target.value }))
                  }
                  className="h-10 w-10 p-0 border-none bg-transparent"
                />
                <span className="text-xs text-muted-foreground">
                  {newLang.color.toUpperCase()}
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!newLang.isLearning}
                  onChange={(e) =>
                    setNewLang((s) => ({ ...s, isLearning: e.target.checked }))
                  }
                />
                Learning
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!newLang.native}
                  onChange={(e) => {
                    const native = e.target.checked;
                    setNewLang((s) => ({
                      ...s,
                      native,
                      level: native ? "" : s.level || "A1",
                    }));
                  }}
                />
                Native
              </label>
            </div>

            {/* Level (hidden for native) */}
            {!newLang.native && (
              <div className="max-w-xs">
                <select
                  value={newLang.level || ""}
                  onChange={(e) =>
                    setNewLang((s) => ({ ...s, level: e.target.value as any }))
                  }
                  className="w-full h-10 rounded-md border bg-background px-3 neu-inset"
                  aria-label="Level"
                >
                  <option value="">No level</option>
                  {LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button onClick={addLanguage} disabled={rowSaving["__new"]}>
              {rowSaving["__new"] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add language
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing languages */}
        <Card className="zen neu">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              My portfolio - keep cooking!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {initialLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 surface rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : languages.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No languages yet.
              </div>
            ) : (
              languages.map((l) => {
                const base = original.find((o) => o.id === l.id)!;
                const isDirty = base ? !same(base, l) : false;

                return (
                  <div
                    key={l.id}
                    className="surface rounded-xl p-4 grid md:grid-cols-6 gap-3 items-center"
                  >
                    <Input
                      value={l.name}
                      onChange={(e) =>
                        setLanguages((arr) =>
                          arr.map((x) =>
                            x.id === l.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      className="neu-inset"
                    />
                    <Input
                      value={l.emoji}
                      onChange={(e) =>
                        setLanguages((arr) =>
                          arr.map((x) =>
                            x.id === l.id ? { ...x, emoji: e.target.value } : x
                          )
                        )
                      }
                      className="neu-inset"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={l.color}
                        onChange={(e) =>
                          setLanguages((arr) =>
                            arr.map((x) =>
                              x.id === l.id
                                ? { ...x, color: e.target.value }
                                : x
                            )
                          )
                        }
                        className="h-10 w-10 p-0 border-none bg-transparent"
                      />
                      <span className="text-xs text-muted-foreground">
                        {l.color.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!l.isLearning}
                          onChange={(e) =>
                            setLanguages((arr) =>
                              arr.map((x) =>
                                x.id === l.id
                                  ? { ...x, isLearning: e.target.checked }
                                  : x
                              )
                            )
                          }
                        />
                        Learning
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!l.native}
                          onChange={(e) => {
                            const native = e.target.checked;
                            setLanguages((arr) =>
                              arr.map((x) =>
                                x.id === l.id
                                  ? {
                                      ...x,
                                      native,
                                      level: native ? "" : x.level || "A1",
                                    }
                                  : x
                              )
                            );
                          }}
                        />
                        Native
                      </label>
                    </div>

                    {/* Level column */}
                    <div className="flex items-center gap-2">
                      {!l.native ? (
                        <select
                          value={l.level || ""}
                          onChange={(e) =>
                            setLanguages((arr) =>
                              arr.map((x) =>
                                x.id === l.id
                                  ? { ...x, level: e.target.value as any }
                                  : x
                              )
                            )
                          }
                          className="w-full h-10 rounded-md border bg-background px-3 neu-inset"
                        >
                          <option value="">No level</option>
                          {LEVELS.map((lv) => (
                            <option key={lv} value={lv}>
                              {lv}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Native
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-start">
                      <Button
                        variant="outline"
                        onClick={() => deleteRow(l.id)}
                        disabled={rowDeleting[l.id!]}
                      >
                        {rowDeleting[l.id!] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Deleting…
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer — hint state */}
      <div className="sticky bottom-0 z-10 bg-card/80 backdrop-blur-sm border-t border-border">
        <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
          {initialLoading
            ? "Loading languages…"
            : dirtyCount > 0
            ? `${dirtyCount} change${dirtyCount === 1 ? "" : "s"} not saved`
            : "All changes saved"}
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={saveAll}
              disabled={savingAll || initialLoading || dirtyCount === 0}
            >
              {savingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
