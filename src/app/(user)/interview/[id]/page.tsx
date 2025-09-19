import { notFound, redirect } from "next/navigation";
import InterviewClient from "./client";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/profile";

async function getInterview(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("*, user:user_profiles(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching interview:", error);
    return null;
  }

  return data;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params before accessing its properties (Next.js 15 requirement)
  const { id } = await params;

  // The Promise.all is an efficient way to fetch data concurrently.
  const [interview, user] = await Promise.all([
    getInterview(id),
    getCurrentUser(),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  if (!interview || interview.user_id !== user.id) {
    notFound();
  }

  const userProfile = await getUserProfile(user.id);

  return (
    <InterviewClient
      interview={interview}
      user={user}
      userProfile={userProfile}
    />
  );
}
