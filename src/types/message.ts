// 消息相关类型定义

/**
 * 基础消息角色类型
 */
export type MessageRole = "user" | "assistant";

/**
 * 简化的消息接口 - 用于内部消息传递和存储
 * 这是项目中常用的消息格式，用于函数参数和内部处理
 */
export interface SimpleMessage {
  role: MessageRole;
  content: string;
}

/**
 * 消息回调函数类型
 */
export type MessageCallback = (message: SimpleMessage) => void;

/**
 * 消息添加函数类型
 */
export type AddMessageFunction = (role: MessageRole, content: string) => void;
