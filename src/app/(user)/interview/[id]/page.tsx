import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import InterviewClient from "./client";
import { getCurrentUser } from "@/lib/auth";

async function getInterview(id: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from("interviews")
    .select("*, user:profiles(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching interview:", error);
    return null;
  }

  return data;
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [interview, user] = await Promise.all([
    getInterview(resolvedParams.id),
    getCurrentUser(),
  ]);

  if (!user) {
    redirect("/auth/login");
  }

  if (!interview || interview.user_id !== user.id) {
    notFound();
  }

  return <InterviewClient interview={interview} user={user} />;
}
