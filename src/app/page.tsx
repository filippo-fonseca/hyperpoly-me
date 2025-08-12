"use client";

import { useLayoutEffect, useRef, useState } from "react";
import DailyReview from "@/components/DailyReview";
import PublicIntro from "@/components/PublicIntro";
// import PastDays from "@/components/PastDays"; // optional

export default function HomePage() {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>();

  useLayoutEffect(() => {
    const el = leftRef.current;
    if (!el) return;

    const compute = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches; // lg
      if (!isDesktop) {
        setLeftHeight(undefined); // no cap on mobile
        return;
      }
      setLeftHeight(el.getBoundingClientRect().height);
    };

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    compute();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div className="max-w-7xl py-8">
      {/* Top: two columns — PublicIntro (3/5) + DailyReview (2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        <div ref={leftRef} className="lg:col-span-3 min-h-0">
          <PublicIntro />
        </div>
        <div className="lg:col-span-2 min-h-0">
          <DailyReview maxHeightPx={leftHeight} />
        </div>
      </div>

      {/* Bottom: PastDays full-width */}
      {/* <div className="mt-8">
        <PastDays />
      </div> */}
    </div>
  );
}
