import { z } from "zod";
import { llm } from "@livekit/agents";

// --- Tool Definitions ---

/**
 * 工具：记录特定评估标准的得分。
 * 这有助于在最后生成结构化的报告。
 */
export const recordScoreSchema = z.object({
  criteria: z
    .string()
    .describe(
      "正在评估的具体技能或行为特征（例如：'React Hooks', '沟通能力'）。",
    ),
  score: z
    .number()
    .min(0)
    .max(10)
    .describe("0到10分的评分。0=极差, 5=平均, 10=完美。"),
  reasoning: z.string().describe("评分的简要理由。"),
});

/**
 * 工具：查找候选人简历/个人资料中的详细信息。
 * 用于验证声明或查找特定的技术栈。
 */
export const checkResumeSchema = z.object({
  query: z
    .string()
    .describe(
      "要查找的具体技术、职位或公司（例如：'TypeScript', '字节跳动'）。",
    ),
  category: z
    .enum(["skills", "work", "project", "general"])
    .describe("搜索类别。"),
});

// --- Tool Handlers ---

export function createTools(context: { userProfile: any }) {
  const { userProfile } = context;

  const recordScore = llm.tool({
    description: "为候选人的技能或特征记录评分 (0-10)。",
    parameters: recordScoreSchema,
    execute: async (args) => {
      const { criteria, score, reasoning } = args;
      console.log(
        `[评估系统] 📝 记录评分: [${criteria}] ${score}/10 - ${reasoning}`,
      );
      return `评分已记录: ${criteria} = ${score}/10.`;
    },
  });

  const checkResume = llm.tool({
    description: "在候选人简历中搜索特定关键词（技能、公司、项目）。",
    parameters: checkResumeSchema,
    execute: async (args) => {
      const { query, category } = args;
      console.log(`[工具] 🔍 简历检索: ${query} 在 ${category} 中`);

      if (!userProfile) return "未找到简历信息。";

      const lowerQuery = query.toLowerCase();
      let result = "";

      if (category === "skills" || category === "general") {
        const skills = Array.isArray(userProfile.skills)
          ? userProfile.skills
          : [];
        const matches = skills.filter((s: string) =>
          s.toLowerCase().includes(lowerQuery),
        );
        if (matches.length > 0) result += `找到技能: ${matches.join(", ")}. `;
      }

      if (category === "work" || category === "general") {
        const works = Array.isArray(userProfile.work_experiences)
          ? userProfile.work_experiences
          : [];
        const matches = works.filter(
          (w: any) =>
            w.company?.toLowerCase().includes(lowerQuery) ||
            w.position?.toLowerCase().includes(lowerQuery) ||
            w.description?.toLowerCase().includes(lowerQuery),
        );
        if (matches.length > 0) {
          result += `找到工作经历: ${matches.map((w: any) => `${w.company} (${w.position})`).join("; ")}. `;
        }
      }

      if (category === "project" || category === "general") {
        const projects = Array.isArray(userProfile.project_experiences)
          ? userProfile.project_experiences
          : [];
        const matches = projects.filter(
          (p: any) =>
            p.project_name?.toLowerCase().includes(lowerQuery) ||
            p.tech_stack?.some((t: string) =>
              t.toLowerCase().includes(lowerQuery),
            ) ||
            p.description?.toLowerCase().includes(lowerQuery),
        );
        if (matches.length > 0) {
          result += `找到项目经历: ${matches.map((p: any) => `${p.project_name} (角色: ${p.role})`).join("; ")}. `;
        }
      }

      return result || `简历中未找到关于 '${query}' 的具体提法。`;
    },
  });

  return {
    record_score: recordScore,
    check_resume: checkResume,
  };
}
