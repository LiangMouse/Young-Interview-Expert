"use client";

import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { useUserStore } from "@/store/user";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const isLoggedIn = !!userInfo;
  const t = useTranslations("hero");

  const handleStartSimulation = () => {
    if (isLoggedIn) {
      // 已登录：直接进入 Dashboard 或开始面试
      router.push("/dashboard");
    } else {
      // 未登录：跳转到注册页
      router.push("/auth/sign-in");
    }
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-20 lg:pt-28 lg:pb-32">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-20 right-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary w-fit">
              <Sparkles className="size-4" />
              <span>{t("badge")}</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-snug text-foreground sm:text-5xl lg:text-6xl">
              {t("title")}
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {t("titleHighlight")}
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t("description")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                onClick={handleStartSimulation}
              >
                {isLoggedIn ? t("enterDashboard") : t("startSimulation")}
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted bg-transparent group"
              >
                <Play className="mr-2 size-4 transition-transform group-hover:scale-110" />
                {t("watchDemo")}
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  10,000+
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("stats.successStories")}
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">
                  {t("stats.satisfactionRate")}
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">
                  {t("stats.aiAvailability")}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-xl lg:max-w-none">
              {/* Main visual */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 shadow-2xl shadow-black/10">
                <Image
                  src="/abstract-tech-ai-interview-dashboard-with-code-and.jpg"
                  alt="AI Interview Platform"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay gradient for polish */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
