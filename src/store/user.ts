import { create } from "zustand";
import type { UserProfile } from "@/types/profile";

interface UserState {
  userInfo: UserProfile | null;
  setUserInfo: (profile: UserProfile | null) => void;
  clearUserInfo: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (profile) => set({ userInfo: profile }),
  clearUserInfo: () => set({ userInfo: null }),
}));
