-- 清理重复的聊天消息数据
-- 将用户消息和AI响应合并到同一行

-- 1. 首先查看当前的数据结构
SELECT 
  id,
  user_message,
  ai_response,
  created_at,
  CASE 
    WHEN user_message IS NOT NULL AND ai_response IS NOT NULL THEN 'complete'
    WHEN user_message IS NOT NULL AND ai_response IS NULL THEN 'user_only'
    WHEN user_message IS NULL AND ai_response IS NOT NULL THEN 'ai_only'
    ELSE 'empty'
  END as message_type
FROM interview_messages 
ORDER BY created_at;

-- 2. 创建临时表来存储合并后的数据
CREATE TEMP TABLE temp_merged_messages AS
SELECT 
  interview_id,
  user_id,
  user_message,
  ai_response,
  created_at,
  updated_at
FROM interview_messages
WHERE user_message IS NOT NULL;

-- 3. 更新临时表，添加对应的AI响应
UPDATE temp_merged_messages 
SET ai_response = (
  SELECT ai_response 
  FROM interview_messages 
  WHERE interview_messages.interview_id = temp_merged_messages.interview_id
    AND interview_messages.user_id = temp_merged_messages.user_id
    AND interview_messages.ai_response IS NOT NULL
    AND interview_messages.created_at > temp_merged_messages.created_at
  ORDER BY interview_messages.created_at ASC
  LIMIT 1
);

-- 4. 清空原表
DELETE FROM interview_messages;

-- 5. 插入合并后的数据
INSERT INTO interview_messages (interview_id, user_id, user_message, ai_response, created_at, updated_at)
SELECT interview_id, user_id, user_message, ai_response, created_at, updated_at
FROM temp_merged_messages;

-- 6. 验证结果
SELECT 
  id,
  user_message,
  ai_response,
  created_at,
  CASE 
    WHEN user_message IS NOT NULL AND ai_response IS NOT NULL THEN 'complete'
    WHEN user_message IS NOT NULL AND ai_response IS NULL THEN 'user_only'
    WHEN user_message IS NULL AND ai_response IS NOT NULL THEN 'ai_only'
    ELSE 'empty'
  END as message_type
FROM interview_messages 
ORDER BY created_at;
