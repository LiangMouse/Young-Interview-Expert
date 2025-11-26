"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  History,
  Settings,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function Sidebar() {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();

  const navItems = [
    {
      title: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("profile"),
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: t("history"),
      href: "/dashboard/history",
      icon: History,
    },
    {
      title: t("settings"),
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-[#E5E5E5] bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-[#E5E5E5] px-6">
        <Sparkles className="h-5 w-5 text-[#141414]" />
        <span className="text-lg font-medium text-[#141414]">{t("brand")}</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition-colors relative",
                isActive
                  ? "font-bold text-[#141414] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[#141414]"
                  : "font-normal text-[#666666] hover:text-[#141414]",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
