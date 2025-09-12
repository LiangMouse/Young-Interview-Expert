"use server";

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { createStructuredOutputRunnable } from "langchain/chains/openai_functions";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";

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
      modelName: "gpt-4-turbo",
      temperature: 0,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "Extracts structured data from the resume text.",
      ),
      HumanMessagePromptTemplate.fromTemplate("{text}"),
    ]);

    const chain = createStructuredOutputRunnable({
      outputSchema: zodSchema,
      llm: model,
      prompt,
    });

    const result = await chain.invoke({
      text: `Please analyze the following resume text and extract the relevant information in a structured format. Make sure to follow the provided schema precisely. Resume text: ${text}`,
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
