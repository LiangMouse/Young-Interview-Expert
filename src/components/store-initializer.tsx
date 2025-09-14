"use client";

import { useRef } from "react";
import { useUserStore } from "@/store/user";
import type { UserProfile } from "@/types/profile";

function StoreInitializer({ userInfo }: { userInfo: UserProfile | null }) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useUserStore.setState({ userInfo });
    initialized.current = true;
  }
  return null;
}

export default StoreInitializer;
