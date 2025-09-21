-- 面试聊天消息管理 RPC 函数
-- 基于 interviews 表的 JSONB 字段存储消息

-- 1. 添加用户消息到面试会话
CREATE OR REPLACE FUNCTION add_user_message(
  p_interview_id UUID,
  p_content TEXT
) RETURNS VOID AS $$
DECLARE
  new_message JSONB;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 构建新的消息对象
  new_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'content', p_content,
    'timestamp', NOW()::timestamptz
  );
  
  -- 追加到 user_messages 数组
  UPDATE interviews 
  SET user_messages = user_messages || new_message,
      updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 添加AI消息到面试会话
CREATE OR REPLACE FUNCTION add_ai_message(
  p_interview_id UUID,
  p_content TEXT
) RETURNS VOID AS $$
DECLARE
  new_message JSONB;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 构建新的消息对象
  new_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'content', p_content,
    'timestamp', NOW()::timestamptz
  );
  
  -- 追加到 ai_messages 数组
  UPDATE interviews 
  SET ai_messages = ai_messages || new_message,
      updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 同时添加用户和AI消息（推荐使用，保证事务性）
CREATE OR REPLACE FUNCTION add_chat_messages(
  p_interview_id UUID,
  p_user_content TEXT,
  p_ai_content TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  user_message JSONB;
  ai_message JSONB;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 构建用户消息对象
  user_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'content', p_user_content,
    'timestamp', NOW()::timestamptz
  );

  -- 如果提供了AI内容，构建AI消息对象
  IF p_ai_content IS NOT NULL THEN
    ai_message := jsonb_build_object(
      'id', gen_random_uuid(),
      'content', p_ai_content,
      'timestamp', NOW()::timestamptz
    );
  END IF;
  
  -- 在单个事务中更新两个字段
  UPDATE interviews 
  SET 
    user_messages = user_messages || user_message,
    ai_messages = CASE 
      WHEN ai_message IS NOT NULL THEN ai_messages || ai_message
      ELSE ai_messages
    END,
    updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 获取面试会话的所有消息
CREATE OR REPLACE FUNCTION get_interview_messages(p_interview_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 返回用户消息和AI消息
  SELECT jsonb_build_object(
    'user_messages', COALESCE(user_messages, '[]'::jsonb),
    'ai_messages', COALESCE(ai_messages, '[]'::jsonb),
    'interview_id', p_interview_id,
    'total_user_messages', jsonb_array_length(COALESCE(user_messages, '[]'::jsonb)),
    'total_ai_messages', jsonb_array_length(COALESCE(ai_messages, '[]'::jsonb))
  ) INTO result
  FROM interviews 
  WHERE id = p_interview_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. 获取面试会话的合并消息历史（按时间排序）
CREATE OR REPLACE FUNCTION get_interview_conversation(p_interview_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_messages JSONB;
  ai_messages JSONB;
  all_messages JSONB;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 获取用户和AI消息
  SELECT 
    COALESCE(user_messages, '[]'::jsonb),
    COALESCE(ai_messages, '[]'::jsonb)
  INTO user_messages, ai_messages
  FROM interviews 
  WHERE id = p_interview_id;

  -- 合并并排序所有消息
  WITH combined_messages AS (
    SELECT 
      jsonb_set(msg, '{role}', '"user"') as message
    FROM jsonb_array_elements(user_messages) as msg
    UNION ALL
    SELECT 
      jsonb_set(msg, '{role}', '"assistant"') as message
    FROM jsonb_array_elements(ai_messages) as msg
  )
  SELECT jsonb_agg(message ORDER BY (message->>'timestamp')::timestamptz)
  INTO all_messages
  FROM combined_messages;

  -- 构建结果
  result := jsonb_build_object(
    'interview_id', p_interview_id,
    'conversation', COALESCE(all_messages, '[]'::jsonb),
    'total_messages', jsonb_array_length(COALESCE(all_messages, '[]'::jsonb))
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. 删除面试会话的所有消息
CREATE OR REPLACE FUNCTION clear_interview_messages(p_interview_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 清空消息数组
  UPDATE interviews 
  SET 
    user_messages = '[]'::jsonb,
    ai_messages = '[]'::jsonb,
    updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 更新面试会话状态
CREATE OR REPLACE FUNCTION update_interview_status(
  p_interview_id UUID,
  p_status TEXT,
  p_score INTEGER DEFAULT NULL,
  p_duration TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 更新状态和相关字段
  UPDATE interviews 
  SET 
    status = p_status,
    score = COALESCE(p_score, score),
    duration = COALESCE(p_duration, duration),
    updated_at = NOW()
  WHERE id = p_interview_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 获取面试会话统计信息
CREATE OR REPLACE FUNCTION get_interview_stats(p_interview_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_count INTEGER;
  ai_count INTEGER;
  total_count INTEGER;
  last_user_message TIMESTAMPTZ;
  last_ai_message TIMESTAMPTZ;
BEGIN
  -- 验证面试会话是否存在
  IF NOT EXISTS (SELECT 1 FROM interviews WHERE id = p_interview_id) THEN
    RAISE EXCEPTION 'Interview with id % does not exist', p_interview_id;
  END IF;

  -- 计算统计信息
  SELECT 
    jsonb_array_length(COALESCE(user_messages, '[]'::jsonb)),
    jsonb_array_length(COALESCE(ai_messages, '[]'::jsonb)),
    jsonb_array_length(COALESCE(user_messages, '[]'::jsonb)) + 
    jsonb_array_length(COALESCE(ai_messages, '[]'::jsonb)),
    (SELECT MAX((msg->>'timestamp')::timestamptz) 
     FROM jsonb_array_elements(COALESCE(user_messages, '[]'::jsonb)) as msg),
    (SELECT MAX((msg->>'timestamp')::timestamptz) 
     FROM jsonb_array_elements(COALESCE(ai_messages, '[]'::jsonb)) as msg)
  INTO user_count, ai_count, total_count, last_user_message, last_ai_message
  FROM interviews 
  WHERE id = p_interview_id;

  -- 构建结果
  result := jsonb_build_object(
    'interview_id', p_interview_id,
    'user_message_count', user_count,
    'ai_message_count', ai_count,
    'total_message_count', total_count,
    'last_user_message_time', last_user_message,
    'last_ai_message_time', last_ai_message,
    'is_active', total_count > 0
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建必要的索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_interviews_user_messages_gin 
ON interviews USING GIN (user_messages);

CREATE INDEX IF NOT EXISTS idx_interviews_ai_messages_gin 
ON interviews USING GIN (ai_messages);

CREATE INDEX IF NOT EXISTS idx_interviews_status 
ON interviews (status);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id 
ON interviews (user_id);

-- 10. 创建 updated_at 触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS on_interviews_updated ON interviews;
CREATE TRIGGER on_interviews_updated 
  BEFORE UPDATE ON interviews 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- ========================================
-- 用户档案向量搜索 RPC 函数
-- ========================================

-- 12. 用户档案向量相似度搜索函数
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    upv.id,
    upv.content,
    upv.metadata,
    1 - (upv.embedding <=> query_embedding) AS similarity
  FROM user_profile_vectors upv
  WHERE upv.user_id = match_user_profile_vectors.user_id
    AND 1 - (upv.embedding <=> query_embedding) > match_threshold
  ORDER BY upv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 13. 批量存储用户档案向量文档
CREATE OR REPLACE FUNCTION upsert_user_profile_vectors(
  p_documents JSONB
) RETURNS VOID AS $$
DECLARE
  doc JSONB;
BEGIN
  -- 遍历文档数组并插入/更新
  FOR doc IN SELECT * FROM jsonb_array_elements(p_documents)
  LOOP
    INSERT INTO user_profile_vectors (
      id,
      content,
      metadata,
      embedding,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      doc->>'id',
      doc->>'content',
      doc->'metadata',
      (doc->'embedding')::VECTOR(1536),
      (doc->'metadata'->>'user_id')::UUID,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      embedding = EXCLUDED.embedding,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 14. 清理用户档案向量（删除特定用户的所有向量）
CREATE OR REPLACE FUNCTION clear_user_profile_vectors(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM user_profile_vectors WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 15. 获取用户档案向量统计
CREATE OR REPLACE FUNCTION get_user_profile_vector_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_count INTEGER;
  type_counts JSONB;
BEGIN
  -- 计算总数
  SELECT COUNT(*) INTO total_count
  FROM user_profile_vectors
  WHERE user_id = p_user_id;

  -- 按类型统计
  SELECT jsonb_object_agg(
    metadata->>'type',
    count
  ) INTO type_counts
  FROM (
    SELECT 
      metadata->>'type' as type,
      COUNT(*) as count
    FROM user_profile_vectors
    WHERE user_id = p_user_id
    GROUP BY metadata->>'type'
  ) t;

  -- 构建结果
  result := jsonb_build_object(
    'user_id', p_user_id,
    'total_vectors', total_count,
    'type_breakdown', COALESCE(type_counts, '{}'::jsonb),
    'last_updated', (
      SELECT MAX(updated_at)
      FROM user_profile_vectors
      WHERE user_id = p_user_id
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
