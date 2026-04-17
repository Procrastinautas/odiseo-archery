"use client";

import { useSyncEngine } from "@/lib/sync-engine";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useSyncEngine();
  return <>{children}</>;
}
