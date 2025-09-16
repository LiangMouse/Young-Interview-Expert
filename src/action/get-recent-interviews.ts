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

    // 确保数据格式正确
    const formattedData = (data || []).map((item) => ({
      date: item.date ? new Date(item.date).toLocaleDateString("zh-CN") : "",
      type: item.type || "练习模式",
      score: item.score || 0,
      duration: item.duration || "0分钟",
      status: item.status || "pending",
    }));

    return formattedData;
  } catch (error) {
    console.error("Unexpected error fetching recent interviews:", error);
    return [];
  }
}
