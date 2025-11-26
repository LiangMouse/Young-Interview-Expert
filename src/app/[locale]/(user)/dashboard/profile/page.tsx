import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PersonaCard } from "@/components/dashboard/persona-card";
import { ResumeIntelligence } from "@/components/dashboard/resume-intelligence";

export default function ProfilePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        breadcrumbs={[
          { labelKey: "title", href: "/dashboard" },
          { labelKey: "profile.title" },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
      </main>
    </DashboardShell>
  );
}
