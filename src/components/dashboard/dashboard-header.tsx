import { Bell, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E5E5E5] bg-white px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-[#666666]">
        <span className="text-[#141414]">Home</span>
        <ChevronRight className="h-4 w-4" />
        <span>Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
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
