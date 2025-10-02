import type { UserProfile } from "@/types/profile";
import { createClient } from "@/lib/supabase/client";

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
    const basicContent = [
      userProfile.bio && `个人简介: ${userProfile.bio}`,
      userProfile.job_intention && `求职意向: ${userProfile.job_intention}`,
      userProfile.company_intention &&
        `目标公司: ${userProfile.company_intention}`,
      userProfile.nickname && `姓名: ${userProfile.nickname}`,
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
      const workContent = [
        `公司: ${work.company}`,
        `职位: ${work.position}`,
        work.description && `工作描述: ${work.description}`,
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
      const projectContent = [
        `项目名称: ${project.project_name}`,
        project.description && `项目描述: ${project.description}`,
        project.tech_stack && `技术栈: ${project.tech_stack.join(", ")}`,
        project.role && `担任角色: ${project.role}`,
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
    const skillsContent = `核心技能: ${userProfile.skills.join(", ")}`;
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
 * 存储向量文档到Supabase pgvector
 */
export async function storeVectorDocuments(
  documents: VectorDocument[],
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // 为每个文档添加用户ID到元数据
  const documentsWithUserId = documents.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      user_id: userId,
    },
  }));

  // 生成所有文档的向量嵌入
  const documentsWithEmbeddings = await Promise.all(
    documentsWithUserId.map(async (doc) => {
      const embedding = await generateEmbedding(doc.content);
      return {
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        embedding: embedding,
      };
    }),
  );

  // 使用RPC函数批量存储
  const { error } = await supabase.rpc("upsert_user_profile_vectors", {
    p_documents: documentsWithEmbeddings,
  });

  if (error) {
    console.error("Error storing vector documents:", error);
    throw error;
  }
}

/**
 * 基于查询检索相关文档
 */
export async function retrieveRelevantDocuments(
  query: string,
  userId: string,
  limit: number = 5,
): Promise<VectorDocument[]> {
  const supabase = createClient();

  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query);

  // 使用pgvector进行相似度搜索
  const { data, error } = await supabase.rpc("match_user_profile_vectors", {
    query_embedding: queryEmbedding,
    user_id: userId,
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) {
    console.error("Error retrieving documents:", error);
    throw error;
  }

  return data || [];
}

/**
 * 生成智能面试分析提示词
 */
export function generateIntelligentAnalysisPrompt(context: RAGContext): string {
  const { relevantDocuments } = context;

  const prompt = `# 智能面试官分析任务

你是一位资深的AI面试官，需要基于以下用户资料信息，动态分析并制定个性化的面试策略。

## 用户资料信息
${relevantDocuments
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
 */
export async function performIntelligentAnalysis(
  context: RAGContext,
): Promise<any> {
  const analysisPrompt = generateIntelligentAnalysisPrompt(context);

  try {
    const response = await fetch("/api/ai-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: analysisPrompt,
        context: context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error performing intelligent analysis:", error);
    throw error;
  }
}

/**
 * 生成文档向量嵌入
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("/api/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const { embedding } = await response.json();
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    // 返回零向量作为fallback
    return new Array(1536).fill(0);
  }
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): string[] {
  // 简单的关键词提取逻辑，可以后续优化为更智能的NLP处理
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  // 去重并返回
  return [...new Set(words)];
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
