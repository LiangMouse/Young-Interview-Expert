"use client";

import { useTranslations } from "next-intl";

const activities = [
  {
    id: 1,
    date: "Dec 20, 2024",
    role: "Frontend Developer",
    score: 92,
    status: "completed",
  },
  {
    id: 2,
    date: "Dec 18, 2024",
    role: "Full Stack Developer",
    score: 88,
    status: "completed",
  },
  {
    id: 3,
    date: "Dec 15, 2024",
    role: "Backend Developer",
    score: 75,
    status: "completed",
  },
  {
    id: 4,
    date: "Dec 12, 2024",
    role: "Frontend Developer",
    score: 81,
    status: "pending",
  },
];

export function RecentActivity() {
  const t = useTranslations("dashboard");
  const tTable = useTranslations("dashboard.table");

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="border-b border-[#E5E5E5] px-8 py-6">
        <h2 className="text-xl font-light text-[#141414]">
          {t("recentHistory")}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E5E5] text-xs uppercase tracking-wide text-[#666666]">
              <th className="px-8 py-4 text-left font-normal">
                {tTable("date")}
              </th>
              <th className="px-8 py-4 text-left font-normal">
                {tTable("role")}
              </th>
              <th className="px-8 py-4 text-left font-normal">
                {tTable("score")}
              </th>
              <th className="px-8 py-4 text-left font-normal">
                {tTable("status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="border-b border-[#E5E5E5] transition-colors hover:bg-[#FDFCF8]"
              >
                <td className="px-8 py-4 text-sm text-[#141414]">
                  {activity.date}
                </td>
                <td className="px-8 py-4 text-sm text-[#141414]">
                  {activity.role}
                </td>
                <td className="px-8 py-4 text-sm text-[#141414]">
                  {activity.score}/100
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${activity.status === "completed" ? "bg-[#0F3E2E]" : "bg-[#666666]"}`}
                    />
                    <span className="text-sm capitalize text-[#666666]">
                      {tTable(activity.status as "completed" | "pending")}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
