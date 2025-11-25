"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  History,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-[#E5E5E5] bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-[#E5E5E5] px-6">
        <Sparkles className="h-5 w-5 text-[#141414]" />
        <span className="text-lg font-medium text-[#141414]">
          Interview Expert
        </span>
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
