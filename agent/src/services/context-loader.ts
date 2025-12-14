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

export async function loadInterviewContext(interviewId: string) {
  try {
    const { data: interview, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (error) {
      console.warn(
        `[ContextLoader] Error loading interview for ${interviewId}:`,
        error.message,
      );
      return null;
    }
    return interview;
  } catch (e) {
    console.error(`[ContextLoader] Unexpected error:`, e);
    return null;
  }
}

export function buildSystemPrompt(
  profile: any,
  basePrompt: string,
  interview?: any,
): string {
  if (!profile && !interview) return basePrompt;

  let interviewPart = "";
  if (interview) {
    // 解析 type 字段 (topic:difficulty)
    const [topic, difficulty] = (interview.type || "").split(":");
    const duration = interview.duration || "未知";

    interviewPart = `
### 面试配置信息
- **面试主题**: ${topic || interview.type || "综合技术"}
- **面试难度**: ${difficulty || "默认"}
- **面试时长**: ${duration} 分钟
- **当前状态**: ${interview.status || "进行中"}
`;
  }

  const contextPart = profile
    ? `
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
`
    : "";

  const instructionPart = `
### 面试策略指令
1. **基于背景与配置提问**:
   - 请结合候选人的经历以及本次面试的**主题 (${interviewPart ? (interview.type || "").split(":")[0] : "通用"})** 和 **难度 (${interviewPart ? (interview.type || "").split(":")[1] : "默认"})** 进行提问。
   - 如果是高级难度，请深入考察底层原理和架构设计。
   - 如果是初级难度，请侧重基础知识和应用。
   - 请注意把控时间，总时长约为 **${interview?.duration || "30"} 分钟**。

2. **考察核心技能**: 重点考察列出的核心技能，验证其掌握深度。
3. **个性化互动**: 自适应候选人的回答。如果候选人提到具体的项目细节，请就该细节进行追问。
`;

  return `${basePrompt}\n${interviewPart}\n${contextPart}\n${instructionPart}`;
}
