import DailyReview from "@/components/DailyReview";
import PastDays from "@/components/PastDays";
import PublicIntro from "@/components/PublicIntro";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <PublicIntro />
      <DailyReview />
      <PastDays />
    </div>
  );
}
