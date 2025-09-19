"use client";

import { useEffect, useState } from "react";
import { getRecentInterviews } from "@/action/get-recent-interviews";
import { InterviewRecord } from "@/types/interview";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function RecentInterviews() {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // 获取最近面试记录
        const data = await getRecentInterviews();
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch recent interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleClick = (id: string) => {
    router.push(`/interview/${id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-[50px] rounded-full" />
              <Skeleton className="h-8 w-[80px] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/30"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-purple-400 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{record.type}</h4>
              <p className="text-sm text-gray-600">
                {record.date} · {record.duration}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant={+record.score >= 80 ? "default" : "secondary"}
              className={
                record.score >= 80
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }
            >
              {record.score || "分数未知"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-sky-600 hover:text-sky-700"
              onClick={() => handleClick(record.id)}
            >
              查看详情
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentInterviews;
