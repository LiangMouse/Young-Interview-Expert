"use server";

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { extractText } from "unpdf";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { userProfileService } from "@/lib/user-profile-service";

// ============ 类型定义 ============

const resumeSchema = z.object({
  personalInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  jobIntention: z.string().optional(),
  experienceYears: z.number().optional(),
  skills: z.array(z.string()).optional(),
  education: z
    .object({
      school: z.string().optional(),
      major: z.string().optional(),
      degree: z.string().optional(),
      graduationDate: z.string().optional(),
    })
    .optional(),
  workExperiences: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  projectExperiences: z
    .array(
      z.object({
        projectName: z.string(),
        role: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        techStack: z.array(z.string()).optional(),
        description: z.string(),
      }),
    )
    .optional(),
});

export type ResumeData = z.infer<typeof resumeSchema>;

interface ProfileUpdateData {
  nickname?: string;
  email?: string;
  job_intention?: string;
  experience_years?: number;
  skills?: string[];
  school?: string;
  major?: string;
  degree?: string;
  graduation_date?: string;
  work_experiences?: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
  project_experiences?: Array<{
    project_name: string;
    role: string;
    start_date?: string;
    end_date?: string;
    tech_stack?: string[];
    description: string;
  }>;
  resume_url?: string;
  updated_at?: string;
}

/**
 * 解析PDF文件（使用unpdf）
 */
async function parsePdf(
  file: File,
): Promise<
  { success: true; text: string } | { success: false; error: string }
> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // unpdf 自动处理各种PDF格式
    const { text } = await extractText(buffer, {
      mergePages: true,
    });

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "PDF文件为空或无法提取文本",
      };
    }

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse PDF",
    };
  }
}

/**
 * 使用AI分析简历（使用withStructuredOutput简化）
 */
async function analyzeResume(
  text: string,
): Promise<
  { success: true; data: ResumeData } | { success: false; error: string }
> {
  try {
    // 使用 withStructuredOutput 大幅简化代码
    const model = new ChatOpenAI({
      model: "deepseek-chat",
      temperature: 0,
      apiKey: process.env.DEEPSEEK_V3_API,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
      },
    }).withStructuredOutput(resumeSchema);

    // 一行调用，自动处理prompt和JSON解析
    const result = await model.invoke([
      {
        role: "system",
        content: `你是一个专业的简历解析助手。请仔细分析简历内容，提取所有关键信息。
注意：
- 如果某个字段在简历中找不到，返回 undefined 或空数组
- 工作经历和项目经历要完整提取
- 技能列表要去重
- 日期格式统一为 YYYY-MM 或 YYYY-MM-DD`,
      },
      {
        role: "user",
        content: `请解析以下简历内容：\n\n${text}`,
      },
    ]);

    return {
      success: true,
      data: result as ResumeData,
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to analyze resume",
    };
  }
}

/**
 * 上传简历主函数
 */
export async function uploadResume(formData: FormData) {
  try {
    // 1. 验证用户
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // 2. 解析PDF
    const parseResult = await parsePdf(file);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
      };
    }

    // 3. AI分析简历
    const analyzeResult = await analyzeResume(parseResult.text);
    console.log("Analyze result:", analyzeResult);
    if (!analyzeResult.success) {
      return { success: false, error: analyzeResult.error };
    }

    // 4. 上传文件到Storage
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

    // 5. 获取公开URL
    const { data: publicUrlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      console.error("Error getting public URL");
      return { success: false, error: "Could not get public URL for resume" };
    }

    const publicUrl = publicUrlData.publicUrl;

    // 5. 类型安全的数据映射
    const profileUpdateData: ProfileUpdateData = {
      nickname: analyzeResult.data.personalInfo?.name,
      email: analyzeResult.data.personalInfo?.email,
      job_intention: analyzeResult.data.jobIntention,
      experience_years: analyzeResult.data.experienceYears,
      skills: analyzeResult.data.skills,
      school: analyzeResult.data.education?.school,
      major: analyzeResult.data.education?.major,
      degree: analyzeResult.data.education?.degree,
      graduation_date: analyzeResult.data.education?.graduationDate,
      work_experiences: analyzeResult.data.workExperiences?.map((exp) => ({
        company: exp.company,
        position: exp.position,
        start_date: exp.startDate,
        end_date: exp.endDate,
        description: exp.description,
      })),
      project_experiences: analyzeResult.data.projectExperiences?.map(
        (proj) => ({
          project_name: proj.projectName,
          role: proj.role,
          start_date: proj.startDate,
          end_date: proj.endDate,
          tech_stack: proj.techStack,
          description: proj.description,
        }),
      ),
      resume_url: publicUrl,
      updated_at: new Date().toISOString(),
    };

    // 过滤掉undefined值
    const filteredData = Object.fromEntries(
      Object.entries(profileUpdateData).filter(
        ([, value]) => value !== undefined,
      ),
    ) as ProfileUpdateData;

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

    // 6. 向量化用户档案
    try {
      const vectorizeResult = await userProfileService.vectorizeUserProfile(
        user.id,
      );
      if (!vectorizeResult.success) {
        console.warn("向量化用户档案失败:", vectorizeResult.error);
        // 不返回错误，因为简历上传已经成功
      } else {
        console.log(
          "用户档案向量化成功，文档数量:",
          vectorizeResult.documentCount,
        );
      }
    } catch (vectorizeError) {
      console.warn("向量化用户档案时发生错误:", vectorizeError);
      // 不返回错误，因为简历上传已经成功
    }

    return { success: true, data };
  } catch (e) {
    const error = e as Error;
    console.error("Upload resume error:", error);
    return { success: false, error: error.message };
  }
}
