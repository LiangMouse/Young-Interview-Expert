import type { UserProfile } from "@/types/profile";
import { createClient } from "@/lib/supabase/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Embeddings } from "@langchain/core/embeddings";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";

// import keywordExtractor from "keyword-extractor";
import {
  sanitizeProfileData,
  sanitizeRAGQuery,
  escapePromptContent,
} from "@/lib/security/prompt-injection";

/**
 * 向量RAG系统 - 基于pgvector的智能用户资料分析
 * 让AI动态读取和理解用户资料，生成个性化面试策略
 */

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type:
      | "basic_info"
      | "work_experience"
      | "project_experience"
      | "skill"
      | "education";
    source: string;
    importance: number;
    keywords: string[];
  };
  embedding?: number[];
}

export interface RAGContext {
  relevantDocuments: VectorDocument[];
  userProfile: UserProfile;
  analysisPrompt: string;
}

/**
 * 将用户资料转换为向量文档
 */
export async function profileToVectorDocuments(
  userProfile: UserProfile,
): Promise<VectorDocument[]> {
  const documents: VectorDocument[] = [];

  // 基本信息文档
  if (
    userProfile.bio ||
    userProfile.job_intention ||
    userProfile.company_intention
  ) {
    // 清理用户资料数据，防止注入
    const basicContent = [
      userProfile.bio && `个人简介: ${sanitizeProfileData(userProfile.bio)}`,
      userProfile.job_intention &&
        `求职意向: ${sanitizeProfileData(userProfile.job_intention)}`,
      userProfile.company_intention &&
        `目标公司: ${sanitizeProfileData(userProfile.company_intention)}`,
      userProfile.nickname &&
        `姓名: ${sanitizeProfileData(userProfile.nickname)}`,
    ]
      .filter(Boolean)
      .join("\n");

    documents.push({
      id: `basic_${userProfile.id}`,
      content: basicContent,
      metadata: {
        type: "basic_info",
        source: "user_profile",
        importance: 0.9,
        keywords: extractKeywords(basicContent),
      },
    });
  }

  // 工作经历文档
  if (userProfile.work_experiences) {
    userProfile.work_experiences.forEach((work, index) => {
      // 清理工作经历数据
      const workContent = [
        work.company && `公司: ${sanitizeProfileData(work.company)}`,
        work.position && `职位: ${sanitizeProfileData(work.position)}`,
        work.description &&
          `工作描述: ${sanitizeProfileData(work.description)}`,
        work.start_date && `开始时间: ${work.start_date}`,
        work.end_date && `结束时间: ${work.end_date}`,
      ]
        .filter(Boolean)
        .join("\n");

      documents.push({
        id: `work_${userProfile.id}_${index}`,
        content: workContent,
        metadata: {
          type: "work_experience",
          source: "user_profile",
          importance: 0.8,
          keywords: extractKeywords(workContent),
        },
      });
    });
  }

  // 项目经历文档
  if (userProfile.project_experiences) {
    userProfile.project_experiences.forEach((project, index) => {
      // 清理项目经历数据
      const projectContent = [
        project.project_name &&
          `项目名称: ${sanitizeProfileData(project.project_name)}`,
        project.description &&
          `项目描述: ${sanitizeProfileData(project.description)}`,
        project.tech_stack &&
          `技术栈: ${project.tech_stack
            .map((tech) => sanitizeProfileData(tech))
            .join(", ")}`,
        project.role && `担任角色: ${sanitizeProfileData(project.role)}`,
        project.start_date && `开始时间: ${project.start_date}`,
        project.end_date && `结束时间: ${project.end_date}`,
      ]
        .filter(Boolean)
        .join("\n");

      documents.push({
        id: `project_${userProfile.id}_${index}`,
        content: projectContent,
        metadata: {
          type: "project_experience",
          source: "user_profile",
          importance: 0.8,
          keywords: extractKeywords(projectContent),
        },
      });
    });
  }

  // 技能文档
  if (userProfile.skills && userProfile.skills.length > 0) {
    // 清理技能数据
    const skillsContent = `核心技能: ${userProfile.skills
      .map((skill) => sanitizeProfileData(skill))
      .join(", ")}`;
    documents.push({
      id: `skills_${userProfile.id}`,
      content: skillsContent,
      metadata: {
        type: "skill",
        source: "user_profile",
        importance: 0.7,
        keywords: userProfile.skills,
      },
    });
  }

  return documents;
}

/**
 * 存储向量文档到Supabase pgvector（使用SupabaseVectorStore）
 * 这里先清理该用户的所有旧向量，再插入新向量，确保数据一致性
 */
export async function storeVectorDocuments(
  documents: VectorDocument[],
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const embeddings = getEmbeddings();

  if (!embeddings) {
    console.warn("⚠️ [RAG] 未配置 Embedding 服务，跳过向量存储");
    return;
  }

  try {
    // 先删除该用户的所有旧向量
    // 使用 RPC 函数清理（如果存在），否则使用直接删除
    const { error: clearError } = await supabase.rpc(
      "clear_user_profile_vectors",
      {
        p_user_id: userId,
      },
    );

    // 如果 RPC 不存在，使用直接删除（需要表支持 JSONB 查询）
    if (clearError) {
      console.warn(
        "RPC clear_user_profile_vectors 不存在，尝试直接删除:",
        clearError.message,
      );
      // 备用方案：直接删除（假设表结构支持）
      const { error: deleteError } = await supabase
        .from("user_profile_vectors")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.warn("直接删除也失败（继续插入新向量）:", deleteError.message);
      }
    }

    // 转换为LangChain Document格式
    // 注意：我们不再使用 SupabaseVectorStore.fromDocuments，因为它无法正确处理 user_id 列的插入
    // 而是直接生成 embedding 并通过 supabase 客户端插入

    // 1. 准备文本列表
    const texts = documents.map((doc) => doc.content);

    // 2. 批量生成 Embedding
    const vectors = await embeddings.embedDocuments(texts);

    // 3. 构建插入数据
    const rows = documents.map((doc, index) => ({
      id: uuidv4(), // 生成 UUID，解决数据库 id 非空限制
      content: doc.content,
      metadata: {
        ...doc.metadata,
        doc_id: doc.id,
      },
      embedding: vectors[index], // 直接使用生成的向量
      user_id: userId, // 显式设置 user_id，解决 RLS 问题
    }));

    // 4. 批量插入数据库
    const { error: insertError } = await supabase
      .from("user_profile_vectors")
      .insert(rows);

    if (insertError) {
      console.error("Error inserting vectors:", insertError);
      throw insertError;
    }
  } catch (error) {
    console.error("Error storing vector documents:", error);
    throw error;
  }
}

/**
 * 基于查询检索相关文档（使用SupabaseVectorStore）
 */
export async function retrieveRelevantDocuments(
  query: string,
  userId: string,
  limit: number = 5,
): Promise<VectorDocument[]> {
  const supabase = await createClient();
  const embeddings = getEmbeddings();

  if (!embeddings) {
    console.warn("⚠️ [RAG] 未配置 Embedding 服务，跳过文档检索");
    return [];
  }

  try {
    // 清理查询文本，防止注入
    const sanitizedQuery = sanitizeRAGQuery(query);

    // 初始化向量存储
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "user_profile_vectors",
      queryName: "match_user_profile_vectors",
    });

    // 执行相似度搜索（自动生成embedding）
    // 注意：SupabaseVectorStore 的 similaritySearch 不支持 metadata 过滤
    // 我们需要先搜索，然后过滤结果
    const results = await vectorStore.similaritySearch(
      sanitizedQuery,
      limit * 2,
    );

    // 过滤出该用户的文档并按相关性排序
    const userResults = results
      .filter((doc) => doc.metadata.user_id === userId)
      .slice(0, limit);

    // 转换回VectorDocument格式
    return userResults.map((doc) => ({
      id: doc.metadata.doc_id || "",
      content: doc.pageContent,
      metadata: {
        type: doc.metadata.type as VectorDocument["metadata"]["type"],
        source: doc.metadata.source as string,
        importance: (doc.metadata.importance as number) || 0.5,
        keywords: (doc.metadata.keywords as string[]) || [],
      },
    }));
  } catch (error) {
    console.error("Error retrieving documents:", error);
    throw error;
  }
}

/**
 * 生成智能面试分析提示词
 */
export function generateIntelligentAnalysisPrompt(context: RAGContext): string {
  const { relevantDocuments } = context;

  // 清理文档内容，防止注入
  const sanitizedDocuments = relevantDocuments.map((doc: VectorDocument) => ({
    ...doc,
    content: escapePromptContent(doc.content),
    metadata: {
      ...doc.metadata,
      keywords: doc.metadata.keywords.map((keyword: string) =>
        escapePromptContent(keyword),
      ),
    },
  }));

  const prompt = `# 智能面试官分析任务

你是一位资深的AI面试官，需要基于以下用户资料信息，动态分析并制定个性化的面试策略。

## 用户资料信息
${sanitizedDocuments
  .map(
    (doc) => `
### ${doc.metadata.type.toUpperCase()}
${doc.content}
重要度: ${doc.metadata.importance}
关键词: ${doc.metadata.keywords.join(", ")}
`,
  )
  .join("\n")}

## 分析任务

请基于以上信息，进行以下分析：

1. **候选人能力画像分析**
   - 技术能力水平评估
   - 工作经验深度分析
   - 职业发展轨迹洞察
   - 核心竞争优势识别

2. **面试重点方向制定**
   - 需要重点验证的技术技能
   - 值得深入了解的项目经历
   - 关键的行为面试问题方向
   - 职业规划和动机探索重点

3. **个性化面试策略**
   - 开场问题设计
   - 渐进式提问路径规划
   - 技术深度探索策略
   - 潜在风险点识别

4. **面试节奏控制**
   - 基于候选人背景的难度梯度设计
   - 互动方式和沟通风格建议
   - 时间分配和重点把控

## 输出要求

**重要：生成的问题必须是单个问题，不能是问题列表！**

请以JSON格式输出分析结果，包含：
- candidateAnalysis: 候选人分析
- interviewStrategy: 面试策略
- nextQuestion: 下一个最重要的单个问题（不是问题列表）
- riskPoints: 需要注意的风险点
- questionRationale: 为什么选择这个问题的理由

请确保分析深入、具体，避免通用化的建议。生成的问题应该是一个完整的单个问题，而不是多个问题的组合。`;

  return prompt;
}

/**
 * 调用AI进行智能分析
 * 直接使用 LangChain 调用 AI 模型，避免额外的 API 层
 */
export async function performIntelligentAnalysis(
  context: RAGContext,
): Promise<any> {
  const analysisPrompt = generateIntelligentAnalysisPrompt(context);

  try {
    // 直接使用 LangChain 调用 AI，而不是通过额外的 API 层
    const { ChatOpenAI } = await import("@langchain/openai");
    const { z } = await import("zod");

    const analysisSchema = z.object({
      candidateAnalysis: z.string().describe("候选人能力画像分析"),
      interviewStrategy: z.string().describe("个性化面试策略"),
      nextQuestion: z.string().describe("下一个最重要的单个问题"),
      riskPoints: z.array(z.string()).describe("需要注意的风险点"),
      questionRationale: z.string().describe("为什么选择这个问题的理由"),
    });

    const model = new ChatOpenAI({
      model: "deepseek-chat",
      temperature: 0.7,
      apiKey: process.env.DEEPSEEK_V3_API,
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
      },
    }).withStructuredOutput(analysisSchema);

    const result = await model.invoke([
      {
        role: "system",
        content:
          "你是一位资深的AI面试官，擅长分析候选人背景并制定个性化面试策略。",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error performing intelligent analysis:", error);
    throw error;
  }
}

/**
 * 自定义 Minimax Embedding 适配器
 * 用于解决 Minimax API 与 LangChain OpenAIEmbeddings 的兼容性问题
 */
class MinimaxEmbeddingsAdapter extends Embeddings {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(fields: { apiKey: string; model?: string; baseUrl?: string }) {
    super({}); // LangChain Embeddings base class expects AsyncCallerParams
    this.apiKey = fields.apiKey;
    this.model = fields.model || "embo-01";
    this.baseUrl = fields.baseUrl || "https://api.minimax.chat/v1";
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return this.callMinimaxApi(documents, "db");
  }

  async embedQuery(document: string): Promise<number[]> {
    const results = await this.callMinimaxApi([document], "query");
    return results[0];
  }

  private async callMinimaxApi(
    texts: string[],
    type: "db" | "query",
  ): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          texts: texts, // Minimax 使用 texts 参数
          type: type, // db 或 query
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Minimax API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();

      // 处理 Minimax 响应格式
      // 官方文档: { vectors: [[...]], base_resp: {...} }
      if (data.vectors && Array.isArray(data.vectors)) {
        return data.vectors;
      }

      // 尝试兼容 OpenAI 格式
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => item.embedding);
      }

      console.error(
        "Unexpected Minimax response format:",
        JSON.stringify(data),
      );
      throw new Error("Invalid response format from Minimax API");
    } catch (error) {
      console.error("Error calling Minimax Embedding API:", error);
      throw error;
    }
  }
}

/**
 * 获取Embeddings实例（单例）
 */
let embeddingsInstance: Embeddings | null = null;
let hasCheckedApiKey = false;

function getEmbeddings(): Embeddings | null {
  // 优先使用 Minimax
  if (process.env.MINIMAX_API_KEY) {
    if (
      !embeddingsInstance ||
      !(embeddingsInstance instanceof MinimaxEmbeddingsAdapter)
    ) {
      console.log("🚀 [RAG] 使用 Minimax Embedding (embo-01) via Adapter");
      embeddingsInstance = new MinimaxEmbeddingsAdapter({
        apiKey: process.env.MINIMAX_API_KEY,
        model: "embo-01",
      });
    }
    return embeddingsInstance;
  }

  // 降级到 OpenAI
  if (process.env.OPENAI_API_KEY) {
    if (
      !embeddingsInstance ||
      !(embeddingsInstance instanceof OpenAIEmbeddings)
    ) {
      console.log("🚀 [RAG] 使用 OpenAI Embedding (text-embedding-3-small)");
      embeddingsInstance = new OpenAIEmbeddings({
        modelName: "text-embedding-3-small",
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    }
    return embeddingsInstance;
  }

  if (!hasCheckedApiKey) {
    console.warn(
      "⚠️ [RAG] 未找到 MINIMAX_API_KEY 或 OPENAI_API_KEY，向量化功能将跳过。",
    );
    hasCheckedApiKey = true;
  }
  return null;
}

/**
 * 提取关键词（使用专业库）
 */
function extractKeywords(text: string): string[] {
  // 简单分词实现（支持中英文）
  // 移除 keyword-extractor 依赖，因为它不支持中文且会导致运行时错误
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  // 去重并限制数量
  return [...new Set(words)].slice(0, 20);
}

/**
 * 完整的RAG流程
 */
export async function executeRAGPipeline(
  userProfile: UserProfile,
  interviewQuery: string,
): Promise<any> {
  try {
    // 1. 将用户资料转换为向量文档
    const documents = await profileToVectorDocuments(userProfile);

    // 2. 存储到向量数据库
    await storeVectorDocuments(documents, userProfile.user_id);

    // 3. 检索相关文档
    const relevantDocs = await retrieveRelevantDocuments(
      interviewQuery,
      userProfile.user_id,
    );

    // 4. 构建RAG上下文
    const ragContext: RAGContext = {
      relevantDocuments: relevantDocs,
      userProfile,
      analysisPrompt: generateIntelligentAnalysisPrompt({
        relevantDocuments: relevantDocs,
        userProfile,
        analysisPrompt: "",
      }),
    };

    // 5. 执行智能分析
    const analysis = await performIntelligentAnalysis(ragContext);

    return analysis;
  } catch (error) {
    console.error("RAG pipeline error:", error);
    throw error;
  }
}
