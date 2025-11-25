"use client";

import { useState } from "react";
import { PersonaCard } from "@/components/dashboard/persona-card";
import { ResumeIntelligence } from "@/components/dashboard/resume-intelligence";
import type { UserProfile } from "@/types/profile";

interface ProfilePageClientProps {
  userProfile: UserProfile | null;
}

export function ProfilePageClient({
  userProfile: initialProfile,
}: ProfilePageClientProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    initialProfile,
  );

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Left Column: Persona Card (1 part) */}
      <div className="lg:col-span-1">
        <PersonaCard
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>

      {/* Right Column: Resume Intelligence (3 parts) */}
      <div className="lg:col-span-3">
        <ResumeIntelligence
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  );
}
