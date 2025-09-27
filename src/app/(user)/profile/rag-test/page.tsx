"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/user";
import type { UIMessage } from "@ai-sdk/react";
import type { AddMessageFunction } from "@/types/message";

export default function RAGTestPage() {
  const { userInfo } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [conversationHistory, setConversationHistory] = useState<UIMessage[]>(
    [],
  );
  const [conversationInput, setConversationInput] = useState("");

  const handleVectorize = async () => {
    if (!userInfo?.user_id) {
      setError("用户信息不存在");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/profile/vectorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: userInfo,
          action: "vectorize",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "向量化失败");
      }
    } catch (err) {
      setError("请求失败: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!userInfo) {
      setError("用户信息不存在");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/profile/vectorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: userInfo,
          action: "generate_prompt",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "生成提示词失败");
      }
    } catch (err) {
      setError("请求失败: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRAGAnalysis = async () => {
    if (!userInfo || !query.trim()) {
      setError("用户信息不存在或查询内容为空");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/profile/vectorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: userInfo,
          action: "rag_analysis",
          query: query.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "RAG分析失败");
      }
    } catch (err) {
      setError("请求失败: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVectorStatus = async () => {
    if (!userInfo?.user_id) {
      setError("用户信息不存在");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/profile/vectorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile: userInfo,
          action: "check_stats",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "获取统计信息失败");
      }
    } catch (err) {
      setError("请求失败: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeConversation = () => {
    if (conversationHistory.length === 0) {
      setError("请先添加对话历史");
      return;
    }

    // 简化的对话历史分析
    const userMessages = conversationHistory.filter(
      (msg) => msg.role === "user",
    );
    const aiMessages = conversationHistory.filter(
      (msg) => msg.role === "assistant",
    );

    const analysis = {
      totalMessages: conversationHistory.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      conversationFlow: conversationHistory.map((msg) => ({
        role: msg.role,
        content: (msg.parts?.[0] as any)?.text || "",
        timestamp: new Date().toISOString(),
      })),
    };

    setResult({
      success: true,
      analysis,
      summary: `对话分析完成：共${conversationHistory.length}条消息，其中用户${userMessages.length}条，AI${aiMessages.length}条`,
    });
  };

  const addMessage: AddMessageFunction = (role, content) => {
    const newMessage: UIMessage = {
      id: Date.now().toString(),
      role,
      parts: [
        {
          type: "text",
          text: content,
        },
      ],
    };
    setConversationHistory((prev) => [...prev, newMessage]);
    setConversationInput("");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">RAG系统测试页面</h1>

      <div className="grid gap-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>当前用户信息</CardTitle>
            <CardDescription>用于测试的用户档案数据</CardDescription>
          </CardHeader>
          <CardContent>
            {userInfo ? (
              <div className="space-y-2">
                <p>
                  <strong>用户ID:</strong> {userInfo.user_id}
                </p>
                <p>
                  <strong>昵称:</strong> {userInfo.nickname || "未设置"}
                </p>
                <p>
                  <strong>求职意向:</strong>{" "}
                  {userInfo.job_intention || "未设置"}
                </p>
                <p>
                  <strong>技能:</strong>{" "}
                  {userInfo.skills?.join(", ") || "未设置"}
                </p>
                <p>
                  <strong>工作年限:</strong>{" "}
                  {userInfo.experience_years || "未设置"}年
                </p>
                <p>
                  <strong>工作经历数量:</strong>{" "}
                  {userInfo.work_experiences?.length || 0}
                </p>
                <p>
                  <strong>项目经历数量:</strong>{" "}
                  {userInfo.project_experiences?.length || 0}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">未登录或用户信息不存在</p>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>RAG系统操作</CardTitle>
            <CardDescription>测试向量化和个性化功能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleVectorize}
                disabled={isLoading || !userInfo}
                className="w-full"
              >
                {isLoading ? "处理中..." : "向量化用户档案"}
              </Button>

              <Button
                onClick={handleGeneratePrompt}
                disabled={isLoading || !userInfo}
                className="w-full"
              >
                {isLoading ? "处理中..." : "生成个性化提示词"}
              </Button>

              <Button
                onClick={handleCheckVectorStatus}
                disabled={isLoading || !userInfo}
                className="w-full"
              >
                {isLoading ? "处理中..." : "检查向量状态"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">RAG查询测试</Label>
              <div className="flex gap-2">
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="输入查询内容，如：前端开发经验"
                  className="flex-1"
                />
                <Button
                  onClick={handleRAGAnalysis}
                  disabled={isLoading || !userInfo || !query.trim()}
                >
                  {isLoading ? "分析中..." : "RAG分析"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>对话历史分析测试</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={conversationInput}
                    onChange={(e) => setConversationInput(e.target.value)}
                    placeholder="输入消息内容"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => addMessage("user", conversationInput)}
                    disabled={!conversationInput.trim()}
                  >
                    添加用户消息
                  </Button>
                  <Button
                    onClick={() => addMessage("assistant", conversationInput)}
                    disabled={!conversationInput.trim()}
                    variant="outline"
                  >
                    添加AI消息
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyzeConversation}
                    disabled={conversationHistory.length === 0}
                  >
                    分析对话历史
                  </Button>
                  <Button
                    onClick={() => setConversationHistory([])}
                    variant="outline"
                  >
                    清空历史
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对话历史显示 */}
        {conversationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>当前对话历史</CardTitle>
              <CardDescription>
                共 {conversationHistory.length} 条消息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`p-2 rounded ${
                      message.role === "user"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-gray-50 border-l-4 border-gray-500"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {message.role === "user" ? "候选人" : "AI面试官"}
                    </div>
                    <div className="text-sm text-gray-700">
                      {(message.parts?.[0] as any)?.text || ""}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 结果显示 */}
        {(result || error) && (
          <Card>
            <CardHeader>
              <CardTitle>操作结果</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 font-medium">错误:</p>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">成功!</p>
                    <pre className="text-sm text-green-700 mt-2 whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
