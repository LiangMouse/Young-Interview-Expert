import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile } from "@/types/profile";

interface UserState {
  userInfo: UserProfile | null;
  setUserInfo: (profile: UserProfile | null) => void;
  clearUserInfo: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      setUserInfo: (profile) => set({ userInfo: profile }),
      clearUserInfo: () => set({ userInfo: null }),
    }),
    {
      name: "user-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
