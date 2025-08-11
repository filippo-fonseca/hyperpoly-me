"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { db } from "../../config/firebase";
import { Language } from "../../lib/types";

export default function LanguageManager() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#EC4899");
  const [loading, setLoading] = useState(false);

  async function load() {
    const snap = await getDocs(collection(db, "languages"));
    setLanguages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Language)));
  }

  useEffect(() => {
    load();
  }, []);

  async function addLanguage() {
    if (!name.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "languages"), { name, emoji, color });
    setName("");
    setEmoji("");
    setColor("#EC4899");
    await load();
    setLoading(false);
  }

  async function removeLanguage(id: string) {
    await deleteDoc(doc(db, "languages", id));
    await load();
  }

  return (
    <Card className="zen neu">
      <CardHeader>
        <CardTitle>Languages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <Input
            placeholder="Name (e.g., Français)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="neu-inset"
          />
          <Input
            placeholder="Emoji (e.g., 🇫🇷)"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="neu-inset"
          />
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-10 p-0 border-none bg-transparent"
            />
            <span className="text-sm text-muted-foreground">
              {color.toUpperCase()}
            </span>
          </div>
        </div>

        <Button
          onClick={addLanguage}
          disabled={loading}
          className="shadow-neumorphic-sm"
        >
          {loading ? "Adding..." : "Add language"}
        </Button>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 items-stretch">
          {languages.map((l) => (
            <div
              key={l.id}
              className="surface rounded-xl p-4 shadow-neumorphic-sm flex items-center justify-between h-full"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{l.emoji ?? "🌍"}</span>
                <div className="truncate">
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.id}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => removeLanguage(l.id)}
                className="shadow-neumorphic-sm"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
