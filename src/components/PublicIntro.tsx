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
  PlayCircle,
  X as XIcon,
  Github,
} from "lucide-react";
import Image from "next/image";
import EffortScale from "./EffortScale";
import { effortLabel } from "@/lib/effort";

/** ──────────────────────────────────────────────────────────
 *  Social links (leave empty to hide)
 *  ────────────────────────────────────────────────────────── */
const SOCIALS = {
  youtube: "https://www.youtube.com/@filippofonseca",
  // instagram: "https://www.instagram.com/filippo-fonseca",
  twitter: "https://x.com/FilippoFonseca",
  github: "https://github.com/filippo-fonseca",
  website: "https://filippofonseca.com",
};

/** Most recent 6-month check-in video (YouTube) */
const MOST_RECENT_CHECKIN_VIDEO = "https://www.youtube.com/watch?v=sJLwbqvDjos";

/** Acceptable CEFR labels we might see coming from Firestore */
type CEFR =
  | "A0"
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2"
  | "Beginner"
  | "Elementary"
  | "Pre-Intermediate"
  | "Intermediate"
  | "Upper-Intermediate"
  | "Advanced"
  | "Proficient"
  | string;

/** Map random labels to canonical CEFR when possible */
function normalizeCEFR(raw?: CEFR): CEFR | undefined {
  if (!raw) return undefined;
  const s = String(raw).toUpperCase().replace(/\s|-/g, "");
  const map: Record<string, CEFR> = {
    A0: "A0",
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
    C1: "C1",
    C2: "C2",
    BEGINNER: "A1",
    ELEMENTARY: "A2",
    PREINTERMEDIATE: "A2",
    INTERMEDIATE: "B1",
    UPPERINTERMEDIATE: "B2",
    ADVANCED: "C1",
    PROFICIENT: "C2",
    NATIVE: "C2",
    FLUENT: "C1",
  };
  return map[s] ?? raw;
}

/** Bucketing per Luca’s metaphor */
type BucketKey = "native" | "grown" | "teen" | "kid" | "baby" | "unknown";

/** Deduce bucket from language record */
function bucketOf(lang: any): BucketKey {
  if (lang?.native) return "native";
  const lvl = normalizeCEFR(lang?.level);

  if (lvl === "B2" || lvl === "C1" || lvl === "C2") return "grown";
  if (lvl === "B1") return "teen";
  if (lvl === "A2") return "kid";
  if (lvl === "A1" || lvl === "A0" || lvl === "Beginner") return "baby";
  // If there is no level info yet, still show them as unknown newborns
  return "unknown";
}

/** Nicely formatted maturity tag */
function maturityLabel(bucket: BucketKey): string {
  switch (bucket) {
    case "grown":
      return "grown-up";
    case "teen":
      return "teen";
    case "kid":
      return "kid";
    case "baby":
      return "baby";
    case "native":
      return "native";
    default:
      return "newborn";
  }
}

export default function PublicIntro() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
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

  // “Currently learning” is an orthogonal flag we still show
  const learning = useMemo(
    () => languages.filter((l: any) => (l as any).isLearning === true),
    [languages]
  );

  // Buckets
  const { natives, grown, teens, kids, babies, newborns } = useMemo(() => {
    const ns: Language[] = [];
    const gr: Language[] = [];
    const tn: Language[] = [];
    const kd: Language[] = [];
    const bb: Language[] = [];
    const nb: Language[] = [];

    languages.forEach((l: any) => {
      const b = bucketOf(l);
      switch (b) {
        case "native":
          ns.push(l);
          break;
        case "grown":
          gr.push(l);
          break;
        case "teen":
          tn.push(l);
          break;
        case "kid":
          kd.push(l);
          break;
        case "baby":
          bb.push(l);
          break;
        default:
          nb.push(l);
      }
    });

    // Don’t duplicate natives elsewhere
    const dedupe = (arr: Language[]) => arr.filter((l: any) => !l.native);

    return {
      natives: ns,
      grown: dedupe(gr),
      teens: dedupe(tn),
      kids: dedupe(kd),
      babies: dedupe(bb),
      newborns: dedupe(nb),
    };
  }, [languages]);

  const roundedEffort = Math.round(stats.avgEffort || 0) as 1 | 2 | 3 | 4 | 5;

  return (
    <Card className="zen neu overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-pink-500">
              <Image
                src="/filippo-fonseca.png"
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

          {/* social + video button */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setVideoOpen(true)}
              className="gap-2"
              aria-label="Open 6-month language check-in video"
            >
              <PlayCircle className="h-4 w-4" />
              6-month check-in
            </Button>

            <SocialIcon href={SOCIALS.youtube} aria="YouTube">
              <Youtube className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href={SOCIALS.github} aria="Instagram">
              <Github className="h-4 w-4" />
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

        <div className="mt-4 flex gap-2">
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

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setVideoOpen(true)}
          >
            <PlayCircle className="h-4 w-4" />
            Latest 6-month video
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
                <p className="mb-3">
                  Twice a year I record a{" "}
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="underline underline-offset-2 hover:font-semibold"
                  >
                    6-month “all-languages” check-in
                  </button>
                  , speaking in every language I’m learning to keep myself
                  honest and celebrate growth. Watch the{" "}
                  <Link
                    href={MOST_RECENT_CHECKIN_VIDEO}
                    target="_blank"
                    className="underline underline-offset-2 hover:font-semibold"
                  >
                    most recent video
                  </Link>
                  .
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
                    <span className="font-medium">Engineering Mindset:</span>{" "}
                    treat each language like a system to be reverse-engineered.
                  </li>
                  <li>
                    <span className="font-medium">Runner's Discipline:</span>{" "}
                    show up daily, even when progress is invisible.
                  </li>
                  <li>
                    <span className="font-medium">
                      Machine Learning Perspective:
                    </span>{" "}
                    draw inspiration from how neural nets acquire language.
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

        {/* Currently learning
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <LangGroup
            title="Currently Learning"
            subtitle="Active languages with recent study"
            loading={loading}
            langs={learning}
          />
          <LangGroup
            title="Native"
            subtitle="Mother tongues — forever home base"
            loading={loading}
            langs={natives}
          />
        </div> */}

        {/* Maturity buckets */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <LangGroup
            title="Grown-ups (B2/C1/C2)"
            subtitle="They can fend for themselves — just keep them nourished."
            loading={loading}
            langs={grown}
            pill="grown-up"
          />
          <LangGroup
            title="Teens (B1)"
            subtitle="Independent in familiar contexts; still need guidance."
            loading={loading}
            langs={teens}
            pill="teen"
          />
          <LangGroup
            title="Kids (A2)"
            subtitle="Emerging conversations; lots of playtime helps."
            loading={loading}
            langs={kids}
            pill="kid"
          />
          <LangGroup
            title="Babies (A1/Starter)"
            subtitle="Sounding out syllables; nurture and routine."
            loading={loading}
            langs={babies}
            pill="baby"
          />
          <LangGroup
            title="Newborns (no level yet)"
            subtitle="Just arrived — name picked, crib assembled."
            loading={loading}
            langs={newborns}
            pill="newborn"
          />
        </div>
      </CardContent>

      {/* Video modal */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-3xl bg-background rounded-xl shadow-2xl overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-2 top-2 p-2 rounded-md hover:bg-muted/60"
                onClick={() => setVideoOpen(false)}
                aria-label="Close video"
              >
                <XIcon className="h-5 w-5" />
              </button>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={MOST_RECENT_CHECKIN_VIDEO.replace("watch?v=", "embed/")}
                  title="6-month language check-in"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="p-3 text-sm text-muted-foreground border-t">
                This biannual check-in keeps me accountable.{" "}
                <Link
                  href={MOST_RECENT_CHECKIN_VIDEO}
                  className="underline underline-offset-2"
                  target="_blank"
                >
                  Open on YouTube
                </Link>
                .
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

function LangGroup({
  title,
  subtitle,
  loading,
  langs,
  pill,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  langs: Language[];
  pill?: string;
}) {
  return (
    <div className="surface rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        {pill && langs?.length > 0 && (
          <Badge variant="secondary" className="text-[11px]">
            {pill}
          </Badge>
        )}
      </div>

      {loading && (
        <div className="h-10 rounded-md bg-background/60 animate-pulse" />
      )}
      {!loading && (langs?.length ?? 0) === 0 && (
        <div className="text-sm text-muted-foreground">Nothing here yet.</div>
      )}
      {!loading && langs?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {langs.map((l) => (
            <LangChip key={(l as any).id ?? (l as any).name} lang={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function LangChip({ lang }: { lang: any }) {
  const bucket = bucketOf(lang);
  const tag = lang?.native ? "native" : lang?.level ?? maturityLabel(bucket);

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border border-border bg-background/70"
      title={lang?.name}
    >
      <span className="text-base">{lang?.emoji ?? "🌍"}</span>
      <span className="font-medium">{lang?.name}</span>

      <Badge
        className="ml-1 capitalize"
        style={{
          backgroundColor: lang?.color ?? undefined,
        }}
      >
        {String(tag).toLowerCase()}
      </Badge>
      {lang?.isLearning && (
        <span className="text-[11px] text-muted-foreground ml-1">
          (learning)
        </span>
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
