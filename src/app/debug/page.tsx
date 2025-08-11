"use client";

export default function DebugPage() {
  const testConnection = async () => {
    try {
      console.log("测试 Supabase URL 连接...");
      const response = await fetch(
        "https://djcntmluajqoolxmvfor.supabase.co/rest/v1/",
        {
          method: "GET",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
        },
      );

      console.log("响应状态:", response.status);
      console.log("响应头:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log("✅ Supabase 连接成功");
      } else {
        console.log("❌ Supabase 连接失败:", response.statusText);
      }
    } catch (error) {
      console.error("❌ 网络错误:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">调试页面</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">环境变量检查</h2>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p>
            API Key:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "已设置" : "未设置"}
          </p>
        </div>

        <button
          onClick={testConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          测试 Supabase 连接
        </button>

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">
            打开浏览器开发者工具的 Console 标签页查看详细日志
          </p>
        </div>
      </div>
    </div>
  );
}
