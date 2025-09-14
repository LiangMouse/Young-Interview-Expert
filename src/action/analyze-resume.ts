"use server";

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const zodSchema = z.object({
  full_name: z.string().optional().describe("Full name"),
  nickname: z.string().optional().describe("Nickname"),
  phone: z.string().optional().describe("Phone number"),
  email: z.string().optional().describe("Email address"),
  location: z.string().optional().describe("Location"),
  job_title: z.string().optional().describe("Current or most recent job title"),
  job_intention: z.string().optional().describe("Intended job position"),
  company: z.string().optional().describe("Intended company"),
  skills: z.array(z.string()).optional().describe("List of skills"),
  experience_years: z
    .number()
    .optional()
    .describe("Years of professional experience"),
  education: z.string().optional().describe("Education level"),
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

export type ResumeData = z.infer<typeof zodSchema>;

export async function analyzeResume(
  text: string,
): Promise<
  { success: true; data: ResumeData } | { success: false; error: string }
> {
  try {
    const model = new ChatOpenAI({
      modelName: "deepseek-chat",
      temperature: 0,
      apiKey: process.env.DEEPSEEK_V3_API,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
      },
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
