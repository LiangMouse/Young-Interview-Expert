-- 创建面试消息表
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

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为面试消息表创建更新时间触发器
CREATE TRIGGER update_interview_messages_updated_at 
  BEFORE UPDATE ON interview_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

