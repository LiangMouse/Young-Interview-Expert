import { supabaseAdmin as supabase } from "../../../src/lib/supabase/admin";

export async function loadUserContext(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn(
        `[ContextLoader] Error loading profile for ${userId}:`,
        error.message,
      );
      return null;
    }
    return profile;
  } catch (e) {
    console.error(`[ContextLoader] Unexpected error:`, e);
    return null;
  }
}

export function buildSystemPrompt(profile: any, basePrompt: string): string {
  if (!profile) return basePrompt;

  const contextPart = `
### 候选人背景信息
- **姓名**: ${profile.nickname || "未知"}
- **求职意向**: ${profile.job_intention || "未指定"}
- **工作年限**: ${profile.experience_years || 0} 年
- **核心技能**: ${Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "无"}

### 工作经历
${
  profile.work_experiences
    ? profile.work_experiences
        .map(
          (exp: any) =>
            `- **${exp.company}** (${exp.position}, ${exp.start_date || "?"} - ${exp.end_date || "?"})\n  ${exp.description || ""}`,
        )
        .join("\n\n")
    : "无"
}

### 项目经历
${
  profile.project_experiences
    ? profile.project_experiences
        .map(
          (proj: any) =>
            `- **${proj.project_name}** (${proj.role || "成员"})\n  ${proj.description || ""}\n  *技术栈*: ${proj.tech_stack ? proj.tech_stack.join(", ") : "未指定"}`,
        )
        .join("\n\n")
    : "无"
}
`;

  const instructionPart = `
### 面试策略指令
1. **基于背景提问**: 请结合上述候选人的工作和项目经历进行提问。例如，针对他在某家公司使用的技术或解决的问题进行深挖。
2. **考察核心技能**: 重点考察列出的核心技能（${Array.isArray(profile.skills) ? profile.skills.slice(0, 3).join(", ") : ""}...），验证其掌握深度。
3. **个性化互动**: 自适应候选人的回答。如果候选人提到具体的项目细节，请就该细节进行追问。
`;

  return `${basePrompt}\n\n${contextPart}\n\n${instructionPart}`;
}
