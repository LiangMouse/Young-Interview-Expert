"use client";

import { Bell, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import React from "react";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  labelKey: string;
  href?: string;
}

interface DashboardHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  heading?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  breadcrumbs,
  children,
}: DashboardHeaderProps) {
  const tDashboard = useTranslations("dashboard");
  const tProfile = useTranslations("profile");

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { labelKey: "home", href: "/" },
    { labelKey: "title", href: "/dashboard" },
  ];

  const items = breadcrumbs || defaultBreadcrumbs;

  // Translate label based on key prefix
  const translateLabel = (labelKey: string) => {
    if (labelKey.startsWith("profile.")) {
      return tProfile(labelKey.replace("profile.", ""));
    }
    return tDashboard(labelKey);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E5E5E5] bg-white px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-[#666666]">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link
                href={item.href}
                className={
                  index === items.length - 1
                    ? "text-[#141414]"
                    : "hover:text-[#141414] transition-colors"
                }
              >
                {translateLabel(item.labelKey)}
              </Link>
            ) : (
              <span
                className={index === items.length - 1 ? "text-[#141414]" : ""}
              >
                {translateLabel(item.labelKey)}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {children}
        <div className="h-6 w-px bg-[#E5E5E5]" />
        <button className="relative rounded-full p-2 text-[#666666] hover:text-[#141414] transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#141414]" />
        </button>
        <Avatar className="h-9 w-9 ring-1 ring-[#E5E5E5]">
          <AvatarImage src="/placeholder.svg?height=36&width=36" />
          <AvatarFallback className="bg-[#F5F5F5] text-xs text-[#141414]">
            DV
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
