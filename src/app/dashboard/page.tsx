import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { QuickStartCard } from "@/components/dashboard/quick-start-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#FDFCF8]">
        <div className="mx-auto max-w-7xl space-y-8">
          <WelcomeBanner />
          <QuickStartCard />
          <StatsGrid />
          <RecentActivity />
        </div>
      </main>
    </DashboardShell>
  );
}
