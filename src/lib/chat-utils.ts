// 聊天相关的工具函数

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
}

/**
 * 合并用户消息和AI消息为对话格式（用于前端显示）
 */
export function mergeMessagesToConversation(
  userMessages: ChatMessage[],
  aiMessages: ChatMessage[],
): Array<{
  role: "user" | "assistant";
  content: string;
  id: string;
  timestamp: string;
}> {
  const conversation: Array<{
    role: "user" | "assistant";
    content: string;
    id: string;
    timestamp: string;
  }> = [];

  // 添加用户消息
  userMessages.forEach((msg) => {
    conversation.push({
      role: "user",
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp,
    });
  });

  // 添加AI消息
  aiMessages.forEach((msg) => {
    conversation.push({
      role: "assistant",
      content: msg.content,
      id: msg.id,
      timestamp: msg.timestamp,
    });
  });

  // 按时间戳排序
  return conversation.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
