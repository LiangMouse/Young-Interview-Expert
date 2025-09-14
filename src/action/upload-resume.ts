"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { analyzeResume } from "./analyze-resume";
import { v4 as uuidv4 } from "uuid";
import { parsePdf } from "./parse-pdf"; // 将PDF解析成文本

export async function uploadResume(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const file = formData.get("file") as File;
  console.log("file", file);
  if (!file) {
    return { success: false, error: "No file provided" };
  }
  // TODO error in after
  try {
    // 1. Parse PDF
    const { text, success, error } = await parsePdf(formData);

    if (!success) {
      return {
        success: false,
        error,
      };
    }
    // 2. Analyze Resume
    console.log("Analyzing resume text...");
    const analyzeResult = await analyzeResume(text!);
    console.log("Analyze result:", analyzeResult);

    if (!analyzeResult.success) {
      return { success: false, error: analyzeResult.error };
    }

    // 3. Upload file to Supabase Storage
    console.log("Uploading file to storage...");
    const fileName = `${user.id}/${uuidv4()}.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: `Storage error: ${uploadError.message}` };
    }

    // 4. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      console.error("Error getting public URL");
      return { success: false, error: "Could not get public URL for resume" };
    }

    const publicUrl = publicUrlData.publicUrl;

    // 5. 更新用户资料
    console.log("Updating user profile...");
    try {
      // 使用简化的数据库字段结构
      const profileUpdateData = {
        nickname: analyzeResult.data.nickname,
        job_intention: analyzeResult.data.job_intention,
        skills: analyzeResult.data.skills || [],
        experience_years: analyzeResult.data.experience_years,
        graduation_date: analyzeResult.data.graduation_date,
        work_experiences: analyzeResult.data.work_experiences || [],
        project_experiences: analyzeResult.data.project_experiences || [],
        resume_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      // 过滤掉undefined值
      const filteredData = Object.fromEntries(
        Object.entries(profileUpdateData).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      const { data, error } = await supabase
        .from("user_profiles")
        .update(filteredData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Profile update error:", error);
        return {
          success: false,
          error: `Profile update error: ${error.message}`,
        };
      }

      console.log("Profile updated:", data);
      return { success: true, data };
    } catch (e) {
      const error = e as Error;
      console.error(
        "An unexpected error occurred during profile update:",
        error,
      );
      return {
        success: false,
        error: `An unexpected error occurred: ${error.message}`,
      };
    }
  } catch (e) {
    const error = e as Error;
    console.error("Upload resume error:", error);
    return { success: false, error: error.message };
  }
}
