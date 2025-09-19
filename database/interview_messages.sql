-- 面试消息表
-- 用于存储面试过程中的对话记录

CREATE TABLE IF NOT EXISTS interview_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_interview_messages_interview_id ON interview_messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_messages_user_id ON interview_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_messages_created_at ON interview_messages(created_at);

-- 启用行级安全策略
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的面试消息
CREATE POLICY "Users can view their own interview messages" ON interview_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview messages" ON interview_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview messages" ON interview_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview messages" ON interview_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_messages_updated_at 
  BEFORE UPDATE ON interview_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 用户资料向量表 (pgvector)
-- ===========================================

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建用户资料向量表
CREATE TABLE IF NOT EXISTS user_profile_vectors (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1536), -- 基于 OpenAI 嵌入的维度
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建向量索引以提高搜索性能
CREATE INDEX IF NOT EXISTS user_profile_vectors_embedding_idx 
ON user_profile_vectors USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 创建其他索引
CREATE INDEX IF NOT EXISTS user_profile_vectors_user_id_idx ON user_profile_vectors(user_id);
-- 修复：为 JSONB 字段创建正确的 GIN 索引
CREATE INDEX IF NOT EXISTS user_profile_vectors_metadata_type_idx 
ON user_profile_vectors USING GIN ((metadata->>'type') gin_trgm_ops);

-- 为向量表启用行级安全
ALTER TABLE user_profile_vectors ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的向量数据
CREATE POLICY "Users can view their own profile vectors" ON user_profile_vectors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile vectors" ON user_profile_vectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile vectors" ON user_profile_vectors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile vectors" ON user_profile_vectors
  FOR DELETE USING (auth.uid() = user_id);

-- 为向量表创建更新时间触发器
CREATE TRIGGER update_user_profile_vectors_updated_at 
  BEFORE UPDATE ON user_profile_vectors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建向量相似度搜索函数
CREATE OR REPLACE FUNCTION match_user_profile_vectors(
  query_embedding VECTOR(1536),
  user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  SELECT 
    user_profile_vectors.id,
    user_profile_vectors.content,
    user_profile_vectors.metadata,
    1 - (user_profile_vectors.embedding <=> query_embedding) AS similarity
  FROM user_profile_vectors
  WHERE user_profile_vectors.user_id = match_user_profile_vectors.user_id
    AND 1 - (user_profile_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY user_profile_vectors.embedding <=> query_embedding
  LIMIT match_count;
$$;
