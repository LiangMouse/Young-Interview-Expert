"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** 面试主题类型 */
export type InterviewTopic = "frontend" | "backend" | "fullstack" | "mobile";

/** 面试难度类型 */
export type InterviewDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/** 创建面试的参数 */
export interface CreateInterviewParams {
  /** 面试主题 */
  topic: InterviewTopic;
  /** 面试难度 */
  difficulty: InterviewDifficulty;
  /** 面试时长（分钟） */
  duration: number;
}

/**
 * 创建面试会话
 * @param params 面试配置（主题、难度）
 * @returns 面试 ID 或错误信息
 */
export async function createInterview(params: CreateInterviewParams) {
  const { topic, difficulty, duration } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "请先登录" };
  }

  // 查找用户的 profile id（interviews 表的 user_id 关联 user_profiles.id）
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error finding user profile:", profileError);
    return { error: "用户资料不存在，请先完善个人信息" };
  }

  // 创建面试会话
  const { data, error } = await supabase
    .from("interviews")
    .insert([
      {
        user_id: profile.id,
        // 将难度拼接到 type 字段：topic:difficulty
        type: `${topic}:${difficulty}`,
        status: "pending",
        // duration 字段存储实际时长
        duration: duration.toString(),
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating interview:", error);
    return { error: "创建面试失败，请重试" };
  }

  revalidatePath("/dashboard");

  return { interviewId: data.id };
}
