import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ProfileData {
  user_id: string;
  nickname: string;
  bio: string;
  job_intention: string;
  company_intention: string;
  skills: string[];
  experience_years: number;
  graduation_date?: string;
  work_experiences?: any[];
  project_experiences?: any[];
  resume_url?: string;
  avatar_url: string;
  updated_at: string;
  created_at?: string;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取用户资料
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ error: "获取用户资料失败" }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();

    // 准备用户资料数据
    const profileData: ProfileData = {
      user_id: user.id,
      nickname: body.nickname || "",
      bio: body.bio || "",
      job_intention: body.job_intention || "",
      company_intention: body.company_intention || "",
      skills: Array.isArray(body.skills) ? body.skills : [],
      experience_years: parseInt(body.experience_years) || 0,
      graduation_date: body.graduation_date || "",
      work_experiences: body.work_experiences || [],
      project_experiences: body.project_experiences || [],
      resume_url: body.resume_url || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      updated_at: new Date().toISOString(),
    };

    // 如果是第一次创建，添加created_at
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existingProfile) {
      profileData.created_at = new Date().toISOString();
    }

    // 更新或插入用户资料
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profileData, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Error saving profile:", error);
      return NextResponse.json({ error: "保存用户资料失败" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
