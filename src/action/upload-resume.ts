"use server";

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { userProfileService } from "@/lib/user-profile-service";

const _zodSchema = z.object({
  nickname: z.string().optional().describe("Nickname"),
  email: z.string().optional().describe("Email address"),
  job_intention: z.string().optional().describe("Intended job position"),
  company: z.string().optional().describe("Intended company"),
  skills: z.array(z.string()).optional().describe("List of skills"),
  experience_years: z
    .number()
    .optional()
    .describe("Years of professional experience"),
  school: z.string().optional().describe("Name of the school or university"),
  major: z.string().optional().describe("Major field of study"),
  degree: z.string().optional().describe("Degree obtained"),
  graduation_date: z.string().optional().describe("Graduation date"),
  work_experiences: z
    .array(
      z.object({
        company: z.string().optional().describe("Company name"),
        position: z.string().optional().describe("Position held"),
        start_date: z.string().optional().describe("Start date of employment"),
        end_date: z.string().optional().describe("End date of employment"),
        description: z
          .string()
          .optional()
          .describe("Description of responsibilities and achievements"),
      }),
    )
    .optional()
    .describe("List of work experiences"),
  project_experiences: z
    .array(
      z.object({
        project_name: z.string().optional().describe("Project name"),
        role: z.string().optional().describe("Role in the project"),
        start_date: z.string().optional().describe("Start date of the project"),
        end_date: z.string().optional().describe("End date of the project"),
        tech_stack: z
          .array(z.string())
          .optional()
          .describe("Technologies used in the project"),
        description: z
          .string()
          .optional()
          .describe("Description of the project"),
      }),
    )
    .optional()
    .describe("List of project experiences"),
});

export type ResumeData = z.infer<typeof _zodSchema>;

async function parsePdf(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    const loader = new PDFLoader(file);
    const docs = await loader.load();
    const fullText = docs.map((doc) => doc.pageContent).join("\n");

    return {
      success: true,
      text: fullText,
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);

    return {
      success: false,
      error: "Failed to parse PDF",
    };
  }
}

async function analyzeResume(
  text: string,
): Promise<
  { success: true; data: ResumeData } | { success: false; error: string }
> {
  try {
    const model = new ChatOpenAI({
      model: "deepseek-chat",
      temperature: 0,
      apiKey: process.env.DEEPSEEK_V3_API,
      baseURL: "https://api.deepseek.com/v1",
    });

    const parser = new JsonOutputParser<ResumeData>();

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are an AI assistant that analyzes a resume and extracts key information.
      Please format your output as a JSON object that strictly follows the provided JSON schema.
      Do not include any other text or explanations in your response, only the JSON object.
      
      JSON Schema:
      {format_instructions}
      
      Resume Text:
      {text}`,
    );

    const chain = prompt.pipe(model).pipe(parser);

    const result = await chain.invoke({
      text: text,
      format_instructions: parser.getFormatInstructions(),
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return {
      success: false,
      error: "Failed to analyze resume",
    };
  }
}

export async function uploadResume(formData: FormData) {
  try {
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

    // 1. Parse PDF
    const { text, success, error: parseError } = await parsePdf(formData);

    if (!success) {
      return {
        success: false,
        error: parseError,
      };
    }
    // 2. Analyze Resume
    const analyzeResult = await analyzeResume(text!);
    console.log("Analyze result:", analyzeResult);
    if (!analyzeResult.success) {
      return { success: false, error: analyzeResult.error };
    }

    // 3. Upload file to Supabase Storage
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
    // 使用简化的数据库字段结构
    // 以下是使用langchain dsv3返回的抽象数据
    const aiData = analyzeResult.data as any;
    const profileUpdateData = {
      nickname:
        aiData.nickname || (aiData.contact_info && aiData.contact_info.name),
      job_intention: analyzeResult.data.job_intention || "",
      skills: analyzeResult.data.skills || [],
      work_experiences: aiData.work_experience || [],
      project_experiences: aiData.projects || [],
      resume_url: publicUrl,
      updated_at: new Date().toISOString(),
    };

    // 过滤掉undefined值
    const filteredData = Object.fromEntries(
      Object.entries(profileUpdateData).filter(
        ([, value]) => value !== undefined,
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
