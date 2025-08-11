import DailyReview from "@/components/DailyReview";
import PastDays from "@/components/PastDays";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Soft hero */}
      <Card className="zen neu overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">
              Your daily language journal
            </h1>
            <p className="text-sm md:text-[15px] text-muted-foreground/90">
              Public overview of today’s entries across all languages.
              <span className="ml-1">
                Admins can edit in the{" "}
                <span className="font-medium">/admin</span> panel.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Keep grids aligned to equal heights via items-stretch */}
      <DailyReview />
      <PastDays />
    </div>
  );
}
