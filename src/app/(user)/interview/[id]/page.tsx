import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import InterviewPageClient from "./InterviewPageClient";

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

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const interview = await getInterview(id);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!interview || interview.user_id !== user.id) {
    notFound();
  }

  return <InterviewPageClient interview={interview} user={user} />;
}
