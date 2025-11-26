"use server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/profile";

export async function getOrCreateUserProfile(
  user: User,
): Promise<UserProfile | null> {
  const supabase = await createClient();

  try {
    // 检查用户个人资料是否存在
    const { data: existingProfile, error: selectError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 表示没有找到记录，这不是一个需要抛出的错误
      console.error("Error fetching user profile:", selectError);
    }

    if (existingProfile) {
      return existingProfile;
    }

    // 如果不存在，则创建新的用户个人资料
    const newUserProfile: Partial<UserProfile> = {
      user_id: user.id,
      avatar_url: user.user_metadata?.avatar_url || null,
    };

    const { data: newProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert(newUserProfile)
      .select("*")
      .single();

    if (insertError) {
      // 如果是唯一约束冲突（用户已存在但查询失败），尝试再次查询
      if (insertError.code === "23505") {
        const { data: retryProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (retryProfile) {
          return retryProfile;
        }
      }
      console.error("Error creating user profile:", insertError);
      // 不抛出错误，返回 null，让调用者决定如何处理
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    // 不抛出错误，返回 null
    return null;
  }
}
