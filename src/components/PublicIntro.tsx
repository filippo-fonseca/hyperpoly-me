"use client";

import Link from "next/link";
import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { EffortBadge } from "./DailyReview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

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
export function bucketOf(lang: any): BucketKey {
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
export function maturityLabel(bucket: BucketKey): string {
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
              <CardTitle className="font-mono text-[28px] md:text-[32px] font-bold tracking-tight">
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
          Hi! I'm Filippo, a 19 y/o mechatronics engineer and machine learning
          researcher studying at Yale. This is my public, hopefully minimalist
          log of my journey within the beautiful realm of languages and
          polyglottism as a hobby. Welcome! I hope this gives you some insight
          into how I operate. Please do{" "}
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
            className="gap-2 cursor-pointer hover:scale-[1.02] transition-all border-2 border-pink-500"
          >
            <Info className="h-4 w-4" />
            {aboutOpen ? "Hide About" : "About me & this project"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 cursor-pointer hover:scale-[1.02] transition-all"
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
                  Languages are my favorite tool for connecting with people.
                  Every new tongue is a new way of thinking, a different lens on
                  the same world.
                </p>
                <p className="mb-3">
                  I’ve gamified my learning—streaks, effort scores, tiny daily
                  “quests.” That helped me ramp up quickly, but it also exposed
                  the hard part: maintaining advanced languages (yes, even the
                  native ones) while giving the newer ones proper attention.
                </p>
                <p className="mb-3">
                  So I’m borrowing an approach popularized by{" "}
                  <Link
                    href="https://www.youtube.com/@LucaLampariello"
                    target="_blank"
                    className="underline underline-offset-2 hover:font-semibold"
                  >
                    Luca Lampariello
                  </Link>
                  : treat languages like children. Some are babies (A0–A1) that
                  need constant, hands-on time; kids (A2) that thrive on playful
                  practice; teens (B1) that can roam but still need guidance;
                  and grown-ups (B2–C2) that mostly need periodic check-ins to
                  stay sharp.
                </p>
                <p className="mb-3">
                  The strategy is simple: be consistent, do a little every day,
                  and bias time toward the “younger” languages while lightly
                  auditing the grown-ups.
                </p>
                <p className="mb-3">
                  I also log publicly. It keeps me honest, surfaces gaps faster,
                  and celebrates small wins. Each day allows me to make an
                  "entry" for any given language in my repertoire if I do
                  anything with it that day (besides menial things or work in my
                  native languages, ofc). Each entry records minutes, a note,
                  and a 1–5 scaled effort rating. Progress over perfection. A
                  little every day goes a long way.
                </p>
                <p className="mb-3">
                  Twice a year I record a{" "}
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="underline underline-offset-2 hover:font-semibold"
                  >
                    full check-in video
                  </button>
                  , speaking in every language. You can watch the{" "}
                  <Link
                    href={MOST_RECENT_CHECKIN_VIDEO}
                    target="_blank"
                    className="underline underline-offset-2 hover:font-semibold"
                  >
                    latest one here
                  </Link>
                  .
                </p>
                A recap:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    <span className="font-medium">
                      Consistency over intensity:
                    </span>{" "}
                    tiny reps compound.
                  </li>
                  <li>
                    <span className="font-medium">A focus on the “youth”:</span>{" "}
                    youngest/hardest languages get the most attention.
                  </li>
                  <li>
                    <span className="font-medium">Audit the “adults”:</span>{" "}
                    periodic maintenance to prevent slippage.
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
            label="Avg effort"
            value={loading ? "—" : <EffortBadge avg={stats.avgEffort} />}
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
        {/* Tree view: Native as root, others as branches */}
        <div className="mt-6">
          <LangTree
            roots={natives}
            loading={loading}
            groups={[
              {
                key: "grown",
                title: "Grown-ups (B2/C1/C2)",
                subtitle:
                  "They can fend for themselves — just keep them nourished.",
                pill: "grown-up",
                langs: grown,
              },
              {
                key: "teens",
                title: "Teens (B1)",
                subtitle:
                  "Independent in familiar contexts; still need guidance.",
                pill: "teen",
                langs: teens,
              },
              {
                key: "kids",
                title: "Kids (A2)",
                subtitle: "Emerging conversations; lots of playtime helps.",
                pill: "kid",
                langs: kids,
              },
              {
                key: "babies",
                title: "Babies (A1/Starter)",
                subtitle: "Sounding out syllables; nurture and routine.",
                pill: "baby",
                langs: babies,
              },
            ]}
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

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  const isText = typeof value === "string" || typeof value === "number";
  return (
    <div className="neu-inset p-4 min-h-[92px] flex flex-col justify-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {isText ? (
        <div className="text-2xl font-semibold mt-1">{value}</div>
      ) : (
        <div className="mt-1">{value}</div>
      )}
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

  // Compact chip (no visible name). Tooltip reveals the full language name.
  const ChipInner = (
    <span
      className="cursor-pointer inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border border-border bg-background/70 max-w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/50 hover:scale-[1.02] transitional-all"
      // remove native title attr so we only use the styled tooltip
      aria-label={lang?.name ?? "Language"}
      tabIndex={0} // keyboard focusable for tooltip
    >
      <span className="text-base shrink-0">{lang?.emoji ?? "🌍"}</span>
      <Badge
        className="ml-1 capitalize shrink-0"
        style={{ backgroundColor: lang?.color ?? undefined }}
      >
        {String(tag).toLowerCase()}
      </Badge>
    </span>
  );

  return (
    <TooltipProvider delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>{ChipInner}</TooltipTrigger>
        <TooltipContent side="top" align="center">
          <div className="flex items-center gap-2">
            <span className="text-base">{lang?.emoji ?? "🌍"}</span>
            <span className="font-medium">
              {lang?.name ?? "Unknown language"}
            </span>
            {tag && (
              <Badge
                className="ml-1 capitalize"
                style={{ backgroundColor: lang?.color ?? undefined }}
              >
                {String(tag).toLowerCase()}
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

function LangTree({
  roots,
  groups,
  loading,
}: {
  roots: Language[];
  groups: {
    key: string;
    title: string;
    subtitle?: string;
    pill?: string;
    langs: Language[];
  }[];
  loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bucketRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [xsPct, setXsPct] = useState<number[]>([]); // centers of each bucket, in %

  const setBucketRef = (idx: number) => (el: HTMLDivElement | null) => {
    bucketRefs.current[idx] = el;
  };

  // Measure on mount, resize, and layout changes
  useLayoutEffect(() => {
    const compute = () => {
      const root = containerRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const xs = groups.map((_, i) => {
        const el = bucketRefs.current[i];
        if (!el) return 50;
        const r = el.getBoundingClientRect();
        const center = (r.left + r.right) / 2;
        const pct = ((center - rootRect.left) / rootRect.width) * 100;
        return Math.max(2, Math.min(98, pct)); // clamp a bit from edges
      });
      setXsPct(xs);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    bucketRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", compute);

    return () => {
      window.removeEventListener("resize", compute);
      ro.disconnect();
    };
  }, [groups.length]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-border bg-background/60 p-4 overflow-hidden"
    >
      {/* Root (Native) */}
      <div className="surface rounded-xl p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <div>
            <div className="text-[13px] md:text-sm font-semibold">Native</div>
            <div className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
              Mother tongues. Forever my home base.
            </div>
          </div>
          {roots?.length > 0 && (
            <Badge variant="secondary" className="text-[10px] md:text-[11px]">
              native
            </Badge>
          )}
        </div>

        {loading && (
          <div className="h-8 rounded-md bg-background/60 animate-pulse" />
        )}
        {!loading && (roots?.length ?? 0) === 0 && (
          <div className="text-sm text-muted-foreground">
            No native languages set.
          </div>
        )}
        {!loading && roots?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {roots.map((l) => (
              <LangChip key={(l as any).id ?? (l as any).name} lang={l} />
            ))}
          </div>
        )}
      </div>

      {/* Bigger gap to spread branches */}
      <div className="h-8 md:h-10" />

      {/* Connector */}
      <TreeConnectorSVG xsPct={xsPct} />

      {/* Buckets */}
      <div className="mt-8 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        {groups.map((g, i) => (
          <div
            key={g.key}
            ref={setBucketRef(i)}
            className="surface rounded-lg p-3 md:p-4 relative min-w-0 overflow-hidden"
          >
            <div className="flex items-baseline justify-between mb-1.5">
              <div>
                <div className="text-[12px] md:text-sm font-semibold">
                  {g.title}
                </div>
                {g.subtitle && (
                  <div className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                    {g.subtitle}
                  </div>
                )}
              </div>
              {/* {g.pill && g.langs?.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] md:text-[11px]"
                >
                  {g.pill}
                </Badge>
              )} */}
            </div>

            {loading && (
              <div className="h-8 rounded-md bg-background/60 animate-pulse" />
            )}
            {!loading && (g.langs?.length ?? 0) === 0 && (
              <div className="text-sm text-muted-foreground">
                Nothing here yet.
              </div>
            )}
            {!loading && g.langs?.length > 0 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-wrap gap-1.5"
              >
                {g.langs.map((l) => (
                  <LangChip key={(l as any).id ?? (l as any).name} lang={l} />
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeConnectorSVG({ xsPct }: { xsPct: number[] }) {
  // Taller connector with wider fan-out
  const H = 110; // overall height of connector svg
  const splitY = 30; // where trunk splits into branches
  const endY = H; // branch end y
  const cp1y = splitY + 18;
  const cp2y = splitY + 32;

  return (
    <div className="relative pointer-events-none -mx-2">
      <svg
        className="block w-[calc(100%+16px)] h-[110px] md:h-[120px] mx-2"
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          {/* soft glow for the spark */}
          <filter id="spark-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- BASE LINES (static, subtle) --- */}
        {/* trunk */}
        <path
          d={`M 50 0 C 50 14, 50 ${splitY - 6}, 50 ${splitY}`}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* branches */}
        {xsPct.map((x, i) => {
          const cp1x = 50 + (x - 50) * 0.28;
          const cp2x = 50 + (x - 50) * 0.85;
          return (
            <path
              key={`base-${i}`}
              d={`M 50 ${splitY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${endY}`}
              fill="none"
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          );
        })}

        {/* --- SPARK OVERLAY (animated) --- */}
        {/* Set accent color here (inherits to children) */}
        <g className="text-pink-500/80">
          {/* trunk spark */}
          <path
            d={`M 50 0 C 50 14, 50 ${splitY - 6}, 50 ${splitY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            pathLength={100}
            className="electric-spark electric-trunk"
            filter="url(#spark-glow)"
          />
          {/* branch sparks */}
          {xsPct.map((x, i) => {
            const cp1x = 50 + (x - 50) * 0.28;
            const cp2x = 50 + (x - 50) * 0.85;
            return (
              <path
                key={`spark-${i}`}
                d={`M 50 ${splitY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${endY}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                pathLength={100}
                className="electric-spark"
                style={{
                  // slight stagger so pulses cascade across
                  animationDelay: `${i * 0.12}s`,
                }}
                filter="url(#spark-glow)"
              />
            );
          })}
        </g>
      </svg>
      <style jsx global>{`
        @keyframes spark-move {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        /* The animated dash: a short bright segment moving along the path */
        .electric-spark {
          /* one visible segment + the rest transparent; values are in "pathLength" units */
          stroke-dasharray: 12 88;
          stroke-dashoffset: 100;
          animation: spark-move 1.1s linear infinite;
          /* tiny glow fallback if filter isn't supported */
          filter: drop-shadow(0 0 1px rgba(236, 72, 153, 0.5));
        }

        /* Make the trunk’s pulse a touch slower so it feels like it’s feeding the branches */
        .electric-trunk {
          animation-duration: 1.4s;
        }
      `}</style>
    </div>
  );
}
