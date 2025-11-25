import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PersonaCard } from "@/components/dashboard/persona-card";
import { ResumeIntelligence } from "@/components/dashboard/resume-intelligence";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Profile & Resume"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile", href: "/dashboard/profile" },
        ]}
      >
        <Button className="bg-[#0F3E2E] text-white hover:bg-[#0F3E2E]/90">
          Save Profile
        </Button>
      </DashboardHeader>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column: Persona Card (1 part) */}
        <div className="lg:col-span-1">
          <PersonaCard />
        </div>

        {/* Right Column: Resume Intelligence (3 parts) */}
        <div className="lg:col-span-3">
          <ResumeIntelligence />
        </div>
      </div>
    </DashboardShell>
  );
}
