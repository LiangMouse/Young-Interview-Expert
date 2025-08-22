import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 获取当前用户
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取用户资料
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
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
    const supabase = createRouteHandlerClient({ cookies });

    // 获取当前用户
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();

    // 准备用户资料数据
    const profileData = {
      user_id: session.user.id,
      full_name: body.full_name || "",
      bio: body.bio || "",
      phone: body.phone || "",
      location: body.location || "",
      job_title: body.job_title || "",
      job_intention: body.job_intention || "",
      skills: Array.isArray(body.skills) ? body.skills : [],
      experience_years: parseInt(body.experience_years) || 0,
      education: body.education || "",
      avatar_url: session.user.user_metadata?.avatar_url || "",
      updated_at: new Date().toISOString(),
    };

    // 如果是第一次创建，添加created_at
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", session.user.id)
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
