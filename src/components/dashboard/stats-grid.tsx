"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, Clock } from "lucide-react";
import {
  getInterviewStats,
  type InterviewStats,
} from "@/action/get-interview-stats";

/** 格式化时长显示 */
function formatDuration(totalMinutes: number): { value: string; unit: string } {
  if (totalMinutes === 0) return { value: "0", unit: "分钟" };

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return { value: minutes.toString(), unit: "分钟" };
  if (minutes === 0) return { value: hours.toString(), unit: "小时" };
  return { value: `${hours}h ${minutes}m`, unit: "" };
}

export function StatsGrid() {
  const t = useTranslations("dashboard.stats");

  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getInterviewStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // 构建显示数据
  const duration = stats
    ? formatDuration(stats.totalMinutes)
    : { value: "0", unit: "分钟" };

  const displayStats = [
    {
      titleKey: "totalInterviews",
      value: stats?.totalInterviews.toString() ?? "0",
      unit: "次",
      icon: FileText,
      color: "bg-emerald-50 text-emerald-600",
      trend: null,
    },
    {
      titleKey: "avgScore",
      value: stats?.avgScore.toString() ?? "0",
      unit: "分",
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
      trend:
        stats && stats.avgScore >= 80
          ? "优秀"
          : stats && stats.avgScore >= 60
            ? "良好"
            : null,
    },
    {
      titleKey: "studyTime",
      value: duration.value,
      unit: duration.unit,
      icon: Clock,
      color: "bg-sky-50 text-sky-600",
      trend: null,
    },
  ];

  // 加载状态
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {displayStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.titleKey}
            className="group relative rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#0F3E2E]/20 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[#999999]">
                  {t(stat.titleKey)}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-[#141414]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm font-medium text-[#666666]">
                      {stat.unit}
                    </span>
                  )}
                </div>
                {stat.trend && (
                  <p className="text-xs font-medium text-emerald-600">
                    {stat.trend}
                  </p>
                )}
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color} transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
