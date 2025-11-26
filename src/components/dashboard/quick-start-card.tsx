"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export function QuickStartCard() {
  const t = useTranslations("dashboard.simulation");
  const [position, setPosition] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-10 shadow-sm lg:p-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-[#141414] lg:text-3xl">
            {t("title")}
          </h2>
          <p className="text-[#666666]">{t("description")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#666666]">
              {t("topic")}
            </label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="border-[#E5E5E5] bg-white text-[#141414] h-12">
                <SelectValue placeholder={t("selectTopic")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">{t("topics.frontend")}</SelectItem>
                <SelectItem value="backend">{t("topics.backend")}</SelectItem>
                <SelectItem value="fullstack">
                  {t("topics.fullstack")}
                </SelectItem>
                <SelectItem value="mobile">{t("topics.mobile")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-[#666666]">
              {t("difficulty")}
            </label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="border-[#E5E5E5] bg-white text-[#141414] h-12">
                <SelectValue placeholder={t("selectDifficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  {t("difficulties.beginner")}
                </SelectItem>
                <SelectItem value="intermediate">
                  {t("difficulties.intermediate")}
                </SelectItem>
                <SelectItem value="advanced">
                  {t("difficulties.advanced")}
                </SelectItem>
                <SelectItem value="expert">
                  {t("difficulties.expert")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full bg-[#0F3E2E] text-base font-normal text-white hover:bg-[#0F3E2E]/90 h-12"
        >
          {t("startButton")}
        </Button>
      </div>
    </div>
  );
}
