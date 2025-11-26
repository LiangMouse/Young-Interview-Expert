"use client";

import { useState, useEffect } from "react";
import { X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function InterviewHeader() {
  const t = useTranslations("interview");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#E5E5E5] bg-white px-6">
      <Link
        href="/dashboard"
        className="text-sm text-[#666666] hover:text-[#141414]"
      >
        <X className="h-5 w-5" />
      </Link>

      <div className="flex items-center gap-4">
        <div className="text-sm text-[#666666]">
          {t("timeElapsed")}:{" "}
          <span className="font-medium text-[#141414]">
            {formatTime(elapsed)}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
