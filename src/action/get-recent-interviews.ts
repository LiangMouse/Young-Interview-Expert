"use server";

import { InterviewRecord } from "@/types/interview";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function getRecentInterviews(): Promise<InterviewRecord[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("interviews")
      .select("date, type, score, duration, status")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Error fetching recent interviews:", error);
      return [];
    }

    return data as InterviewRecord[];
  } catch (error) {
    console.error("Unexpected error fetching recent interviews:", error);
    return [];
  }
}
