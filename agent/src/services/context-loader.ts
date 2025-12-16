export async function loadUserContext(userId: string) {
  try {
    const { supabaseAdmin: supabase } = await import(
      "../../../src/lib/supabase/admin"
    );
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
    const { supabaseAdmin: supabase } = await import(
      "../../../src/lib/supabase/admin"
    );
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
    const duration = interview.duration ?? "未知";
    const resolvedTopic = topic || interview.type || "综合技术";
    const resolvedDifficulty = difficulty || "默认";
    const resolvedStatus = interview.status || "进行中";

    interviewPart = `
<interview_context readonly="true">
topic: ${resolvedTopic}
difficulty: ${resolvedDifficulty}
duration_minutes: ${duration}
status: ${resolvedStatus}
</interview_context>
`;
  }

  const skills = Array.isArray(profile?.skills)
    ? profile.skills.join(", ")
    : profile?.skills;

  const workExperiences =
    Array.isArray(profile?.work_experiences) && profile.work_experiences.length
      ? profile.work_experiences
          .map((exp: any, idx: number) => {
            const company = exp?.company || "未知公司";
            const position = exp?.position || "未知岗位";
            const start = exp?.start_date || "?";
            const end = exp?.end_date || "?";
            const desc = exp?.description || "";
            return `work_${idx + 1}: company=${company}; position=${position}; period=${start}-${end}; description=${desc}`;
          })
          .join("\n")
      : "work_0: none";

  const projectExperiences =
    Array.isArray(profile?.project_experiences) &&
    profile.project_experiences.length
      ? profile.project_experiences
          .map((proj: any, idx: number) => {
            const name = proj?.project_name || "未命名项目";
            const role = proj?.role || "成员";
            const tech =
              Array.isArray(proj?.tech_stack) && proj.tech_stack.length
                ? proj.tech_stack.join(", ")
                : proj?.tech_stack || "未指定";
            const desc = proj?.description || "";
            return `project_${idx + 1}: name=${name}; role=${role}; tech_stack=${tech}; description=${desc}`;
          })
          .join("\n")
      : "project_0: none";

  const contextPart = profile
    ? `
<candidate_context readonly="true">
name: ${profile.nickname || "未知"}
job_intention: ${profile.job_intention || "未指定"}
experience_years: ${profile.experience_years || 0}
skills: ${skills || "无"}
${workExperiences}
${projectExperiences}
</candidate_context>
`
    : "";

  const resolvedTopic = interview ? (interview.type || "").split(":")[0] : "";
  const resolvedDifficulty = interview
    ? (interview.type || "").split(":")[1]
    : "";

  const instructionPart = `
<runtime_directives readonly="true">
Use interview_context and candidate_context to tailor questions.
If information is missing or conflicting, ask for clarification before concluding.
Keep time budget: ${interview?.duration || 30} minutes.
Preferred topic: ${resolvedTopic || "通用"}; difficulty: ${resolvedDifficulty || "默认"}.
</runtime_directives>
`;

  return `${basePrompt}\n${interviewPart}\n${contextPart}\n${instructionPart}`;
}
