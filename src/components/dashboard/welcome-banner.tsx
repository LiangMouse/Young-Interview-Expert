"use client";

import { useTranslations } from "next-intl";

export function WelcomeBanner() {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-light text-[#141414] lg:text-4xl">
        {t("welcome")}
      </h1>
      <p className="text-base text-[#666666]">{t("welcomeDesc")}</p>
    </div>
  );
}
