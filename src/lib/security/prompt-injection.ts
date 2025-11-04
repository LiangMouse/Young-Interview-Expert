/**
 * 提示词注入防护工具
 * 用于检测、清理和防止用户输入中的恶意提示词注入攻击
 */

/**
 * 常见提示词注入模式
 */
const INJECTION_PATTERNS = [
  // 角色扮演类注入
  /(?:你现在是|你现在扮演|你现在充当|你现在担任|你现在作为|你是一个|你是)/i,
  /(?:忘记|忽略|无视|删除|清除).*?(?:指令|规则|约束|要求|提示词|prompt|system)/i,
  /(?:忽略之前|忘记之前|删除之前|清除之前)/i,
  /(?:新的指令|新指令|新的规则|新规则|新的系统|新系统)/i,

  // 系统指令类注入
  /(?:system|assistant|user):\s*(?:你现在是|忽略|忘记)/i,
  /(?:#|##)\s*(?:system|instruction|prompt|rule)/i,

  // 编码绕过尝试
  /(?:base64|hex|unicode|url).*?(?:decode|decode|解析)/i,

  // 直接控制尝试
  /(?:输出|显示|打印).*?(?:系统|提示词|prompt|指令)/i,
  /(?:告诉我|显示给我|输出).*?(?:你的|系统).*?(?:提示词|指令|规则)/i,

  // 多语言变体
  /(?:你现在是|忽略|忘记)/i,
  /(?:you are now|forget|ignore|disregard)/i,
];

/**
 * 检测是否有提示词注入尝试
 */
export function detectInjectionAttempt(input: string): {
  isInjection: boolean;
  matchedPattern?: string;
  severity: "low" | "medium" | "high";
} {
  if (!input || typeof input !== "string") {
    return { isInjection: false, severity: "low" };
  }

  const normalizedInput = input.trim();

  // 检查长度异常（可能是编码后的恶意内容）
  if (normalizedInput.length > 10000) {
    return {
      isInjection: true,
      matchedPattern: "异常长度",
      severity: "medium",
    };
  }

  // 检查注入模式
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      const severity = determineSeverity(pattern, normalizedInput);
      return {
        isInjection: true,
        matchedPattern: pattern.toString(),
        severity,
      };
    }
  }

  return { isInjection: false, severity: "low" };
}

/**
 * 确定注入尝试的严重程度
 */
function determineSeverity(
  pattern: RegExp,
  input: string,
): "low" | "medium" | "high" {
  const highSeverityPatterns = [
    /(?:忽略|忘记|删除|清除).*?(?:所有|全部|all)/i,
    /(?:system|assistant):/i,
    /(?:输出|显示).*?(?:系统|prompt)/i,
  ];

  for (const highPattern of highSeverityPatterns) {
    if (highPattern.test(input)) {
      return "high";
    }
  }

  // 如果包含多个注入关键词，提高严重程度
  const injectionKeywords = input.match(
    /(?:忽略|忘记|你现在是|新指令|系统|prompt)/gi,
  );
  if (injectionKeywords && injectionKeywords.length >= 2) {
    return "medium";
  }

  return "low";
}

/**
 * 清理用户输入，移除潜在的注入内容
 */
export function sanitizeUserInput(
  input: string,
  options: {
    maxLength?: number;
    removeNewlines?: boolean;
    allowMarkdown?: boolean;
  } = {},
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const {
    maxLength = 5000,
    removeNewlines = false,
    allowMarkdown = false,
  } = options;

  let sanitized = input.trim();

  // 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // 移除可能的注入模式（保留用户意图）
  // 注意：这里要小心，不要过度清理，以免影响正常对话
  for (const pattern of INJECTION_PATTERNS) {
    // 只移除明显的恶意模式，保留上下文
    sanitized = sanitized.replace(pattern, (match) => {
      // 如果是明显的注入尝试，移除
      if (
        match.toLowerCase().includes("忽略") ||
        match.toLowerCase().includes("忘记") ||
        match.toLowerCase().includes("ignore") ||
        match.toLowerCase().includes("forget")
      ) {
        return "";
      }
      return match; // 保留其他可能的误匹配
    });
  }

  // 移除多余的空格和换行
  sanitized = sanitized.replace(/\s+/g, " ");

  if (removeNewlines) {
    sanitized = sanitized.replace(/\n/g, " ");
  }

  // 如果不允许 Markdown，转义 Markdown 特殊字符
  if (!allowMarkdown) {
    sanitized = escapeMarkdown(sanitized);
  }

  return sanitized.trim();
}

/**
 * 转义 Markdown 特殊字符
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/#/g, "\\#")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/`/g, "\\`");
}

/**
 * 转义提示词内容，防止注入
 * 用于将用户数据安全地插入到提示词模板中
 */
export function escapePromptContent(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // HTML 转义
  let escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  // 移除可能的指令分隔符
  escaped = escaped.replace(/\n{3,}/g, "\n\n"); // 限制连续换行

  return escaped;
}

/**
 * 清理用户消息内容
 * 这是主要的清理函数，用于处理聊天消息
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // 首先检测注入尝试
  const detection = detectInjectionAttempt(content);

  if (detection.isInjection) {
    // 记录注入尝试（在开发环境）
    if (process.env.NODE_ENV === "development") {
      console.warn("[安全警告] 检测到提示词注入尝试:", {
        severity: detection.severity,
        pattern: detection.matchedPattern,
        content: content.substring(0, 100), // 只记录前100字符
      });
    }

    // 对于严重注入尝试，进行更严格的清理
    if (detection.severity === "high") {
      return sanitizeUserInput(content, {
        maxLength: 2000,
        removeNewlines: true,
        allowMarkdown: false,
      });
    }
  }

  // 正常清理
  return sanitizeUserInput(content, {
    maxLength: 5000,
    removeNewlines: false,
    allowMarkdown: true,
  });
}

/**
 * 清理用于 RAG 查询的文本
 */
export function sanitizeRAGQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  // RAG 查询需要更严格的清理，因为会被用于向量检索
  let sanitized = sanitizeUserInput(query, {
    maxLength: 500,
    removeNewlines: true,
    allowMarkdown: false,
  });

  // 移除可能的 SQL 注入模式（虽然我们用的是向量检索，但防范未然）
  sanitized = sanitized.replace(/[;'"]/g, "");

  return sanitized.trim();
}

/**
 * 清理用户资料数据（简历、工作经历等）
 */
export function sanitizeProfileData(data: string): string {
  if (!data || typeof data !== "string") {
    return "";
  }

  // 对用户资料数据，我们需要更保守的清理
  // 保留更多内容，但移除明显的注入模式
  let sanitized = data.trim();

  // 限制长度
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  // 移除明显的注入指令
  const highSeverityPatterns = [
    /(?:忽略|忘记|删除|清除).*?(?:所有|全部|指令|规则)/gi,
    /(?:你现在是|你现在扮演).*?(?:系统|管理员)/gi,
  ];

  for (const pattern of highSeverityPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  // 转义特殊字符，但保留格式
  sanitized = escapePromptContent(sanitized);

  return sanitized.trim();
}

/**
 * 验证输入是否安全
 */
export function validateInputSafety(input: string): {
  isSafe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const detection = detectInjectionAttempt(input);

  if (detection.isInjection) {
    warnings.push(`检测到潜在的注入尝试 (严重程度: ${detection.severity})`);
  }

  if (input.length > 5000) {
    warnings.push("输入长度超过建议限制");
  }

  return {
    isSafe: !detection.isInjection || detection.severity === "low",
    warnings,
  };
}
