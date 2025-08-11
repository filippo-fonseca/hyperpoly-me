"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { db } from "../../config/firebase";
import { Language, Entry } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import Image from "next/image";
import EffortScale from "./EffortScale";
import { effortLabel } from "@/lib/effort";

/** ──────────────────────────────────────────────────────────
 *  Edit these if you want specific social links visible.
 *  Leave empty strings to hide an icon.
 *  ────────────────────────────────────────────────────────── */
const SOCIALS = {
  youtube: "https://www.youtube.com/@your-handle",
  instagram: "https://www.instagram.com/your-handle",
  twitter: "https://x.com/your-handle",
  website: "",
};

export default function PublicIntro() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // languages
      const langsSnap = await getDocs(collection(db, "languages"));
      const langs = langsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Language)
      );
      setLanguages(langs);

      // entries (all-time, ordered — we'll compute uniques & sums)
      const entSnap = await getDocs(
        query(collection(db, "entries"), orderBy("date", "desc"))
      );
      const ents = entSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Entry)
      );
      setEntries(ents);

      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalMinutes = entries.reduce((s, e) => s + (e.minutes || 0), 0);
    const avgEffort =
      totalEntries === 0
        ? 0
        : entries.reduce((s, e) => s + (e.effort || 0), 0) / totalEntries;
    const uniqueDates = new Set(entries.map((e) => e.date)).size;

    return { totalEntries, totalMinutes, avgEffort, uniqueDates };
  }, [entries]);

  const learning = useMemo(
    () => languages.filter((l: any) => (l as any).isLearning === true),
    [languages]
  );

  const natives = useMemo(
    () => languages.filter((l: any) => (l as any).native === true),
    [languages]
  );

  const roundedEffort = Math.round(stats.avgEffort || 0) as 1 | 2 | 3 | 4 | 5;

  return (
    <Card className="zen neu overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-pink-500">
              <Image
                src="/filippo-fonseca.png" // Replace with your actual image path
                alt="Filippo Fonseca"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-[28px] md:text-[32px] font-bold tracking-tight">
                hyperpoly
                <span className="text-foreground/70 font-medium">log</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground -mt-1">
                by Filippo Fonseca
              </p>
            </div>
          </div>

          {/* social icons */}
          <div className="ml-auto flex items-center gap-2">
            <SocialIcon href={SOCIALS.youtube} aria="YouTube">
              <Youtube className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href={SOCIALS.instagram} aria="Instagram">
              <Instagram className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href={SOCIALS.twitter} aria="Twitter / X">
              <Twitter className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href={SOCIALS.website} aria="Website">
              <LinkIcon className="h-4 w-4" />
            </SocialIcon>
          </div>
        </div>
        <p className="text-sm md:text-[15px] text-muted-foreground/90 mt-2">
          A public, minimalist log of my journey with the beautiful realm of
          languages. Welcome! I hope this gives you some insight into how I
          operate. Please do{" "}
          <Link
            href="mailto:filippo.fonseca@yale.edu"
            className="text-black underline hover:font-bold transition-all"
          >
            get in touch
          </Link>{" "}
          if you'd like to chat!
        </p>

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAboutOpen((v) => !v)}
            aria-expanded={aboutOpen}
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            {aboutOpen ? "Hide About" : "About me & this project"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* About (collapsible) */}
        <AnimatePresence initial={false}>
          {aboutOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-border bg-background/70 p-4 mb-4 leading-7 text-[15px]">
                <p className="font-medium mb-3">
                  Hi, I'm Filippo Fonseca — a 19-year-old mechatronics and
                  machine learning engineer with an obsession for running and
                  languages. This journal reflects my journey in language
                  learning and the systems I build to track progress.
                </p>
                <p>
                  I log daily study across multiple languages because I believe
                  in the power of consistent, deliberate practice. Each entry
                  includes a short note, minutes studied, and a 1–5 effort
                  rating. The goal is to maintain honesty with myself about the
                  process, not to chase perfection.
                </p>
                <ul className="list-disc pl-5 mt-3 space-y-1">
                  <li>
                    <span className="font-medium">Engineering Mindset:</span> As
                    a mechatronics engineer, I approach language learning
                    systematically, treating each language as a complex system
                    to be reverse-engineered.
                  </li>
                  <li>
                    <span className="font-medium">Runner's Discipline:</span> My
                    passion for endurance running translates to language
                    learning — both require showing up daily, even when progress
                    feels invisible.
                  </li>
                  <li>
                    <span className="font-medium">
                      Machine Learning Perspective:
                    </span>{" "}
                    I'm fascinated by how neural networks acquire language and
                    draw parallels to human learning.
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall stats */}
        <div className="grid sm:grid-cols-4 gap-4 items-stretch">
          <StatCard
            label="All-time entries"
            value={loading ? "—" : stats.totalEntries}
          />
          <StatCard
            label="All-time minutes"
            value={loading ? "—" : stats.totalMinutes}
          />
          <StatCard
            label="Avg effort (session type)"
            value={
              loading
                ? "—"
                : `${stats.avgEffort.toFixed(2)} • ${
                    effortLabel[roundedEffort] || ""
                  }`
            }
          />

          <StatCard
            label="Days logged"
            value={loading ? "—" : stats.uniqueDates}
          />
        </div>

        {/* Language chips */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Currently Learning
            </div>
            {loading && (
              <div className="h-10 rounded-md bg-background/60 animate-pulse" />
            )}
            {!loading && learning.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No languages marked as learning.
              </div>
            )}
            {!loading && learning.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {learning.map((l) => (
                  <LangChip key={l.id} lang={l} />
                ))}
              </div>
            )}
          </div>

          <div className="surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Native/Fluent
            </div>
            {loading && (
              <div className="h-10 rounded-md bg-background/60 animate-pulse" />
            )}
            {!loading && natives.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No languages marked as native.
              </div>
            )}
            {!loading && natives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {natives.map((l) => (
                  <LangChip key={l.id} lang={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────── helpers ───────────── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="neu-inset p-4 min-h-[92px] flex flex-col justify-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function LangChip({ lang }: { lang: Language }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border border-border bg-background/70"
      title={lang.name}
    >
      <span className="text-base">{lang.emoji ?? "🌍"}</span>
      <span className="font-medium">{lang.name}</span>
      {lang.color && (
        <Badge
          className="ml-1"
          style={{ backgroundColor: (lang as any).color ?? "transparent" }}
        >
          {((lang as any).isLearning && lang.level) ||
            ((lang as any).native && "native")}
        </Badge>
      )}
    </span>
  );
}

function SocialIcon({
  href,
  aria,
  children,
}: {
  href?: string;
  aria: string;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <Link
      href={href}
      target="_blank"
      aria-label={aria}
      className="rounded-md border border-border bg-background/70 p-1.5 hover:bg-background transition-colors"
    >
      {children}
    </Link>
  );
}
