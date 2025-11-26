"use client";

import { useTranslations } from "next-intl";

export function StatsGrid() {
  const t = useTranslations("dashboard.stats");

  const stats = [
    {
      titleKey: "totalInterviews",
      value: "12",
    },
    {
      titleKey: "avgScore",
      value: "85",
    },
    {
      titleKey: "studyTime",
      value: "4h 30m",
    },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {stats.map((stat) => {
        return (
          <div key={stat.titleKey} className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#666666]">
              {t(stat.titleKey)}
            </p>
            <p className="text-4xl font-light text-[#141414]">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
