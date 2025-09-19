-- 迁移到 JSONB 存储消息的设计
-- 将 interview_messages 表的数据迁移到 interviews 表的 user_messages 和 ai_messages 字段

-- 1. 添加 user_messages 和 ai_messages 字段到 interviews 表
ALTER TABLE interviews ADD COLUMN user_messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE interviews ADD COLUMN ai_messages JSONB DEFAULT '[]'::jsonb;

-- 2. 创建索引以提高 JSONB 查询性能
CREATE INDEX IF NOT EXISTS idx_interviews_user_messages_gin ON interviews USING GIN (user_messages);
CREATE INDEX IF NOT EXISTS idx_interviews_ai_messages_gin ON interviews USING GIN (ai_messages);

-- 3. 迁移现有数据 - 分离用户消息和AI消息
UPDATE interviews 
SET 
  user_messages = (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', im.id,
          'content', im.user_message,
          'timestamp', im.created_at
        ) ORDER BY im.created_at
      ),
      '[]'::jsonb
    )
    FROM interview_messages im
    WHERE im.interview_id = interviews.id 
      AND im.user_message IS NOT NULL
  ),
  ai_messages = (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', im.id,
          'content', im.ai_response,
          'timestamp', im.created_at
        ) ORDER BY im.created_at
      ),
      '[]'::jsonb
    )
    FROM interview_messages im
    WHERE im.interview_id = interviews.id 
      AND im.ai_response IS NOT NULL
  )
WHERE EXISTS (
  SELECT 1 FROM interview_messages im 
  WHERE im.interview_id = interviews.id
);

-- 4. 验证迁移结果
SELECT 
  id,
  user_id,
  status,
  jsonb_array_length(user_messages) as user_message_count,
  jsonb_array_length(ai_messages) as ai_message_count,
  user_messages,
  ai_messages
FROM interviews 
WHERE jsonb_array_length(user_messages) > 0 OR jsonb_array_length(ai_messages) > 0
ORDER BY created_at DESC
LIMIT 5;

-- 5. 删除旧的 interview_messages 表（谨慎操作！）
-- DROP TABLE interview_messages;

-- 6. 创建新的消息管理函数
CREATE OR REPLACE FUNCTION add_user_message(
  p_interview_id UUID,
  p_content TEXT
) RETURNS VOID AS $$
DECLARE
  new_message JSONB;
BEGIN
  new_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'content', p_content,
    'timestamp', NOW()
  );
  
  UPDATE interviews 
  SET user_messages = user_messages || new_message,
      updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_ai_message(
  p_interview_id UUID,
  p_content TEXT
) RETURNS VOID AS $$
DECLARE
  new_message JSONB;
BEGIN
  new_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'content', p_content,
    'timestamp', NOW()
  );
  
  UPDATE interviews 
  SET ai_messages = ai_messages || new_message,
      updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建获取消息的函数
CREATE OR REPLACE FUNCTION get_interview_messages(p_interview_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'user_messages', user_messages,
      'ai_messages', ai_messages
    )
    FROM interviews 
    WHERE id = p_interview_id
  );
END;
$$ LANGUAGE plpgsql;
