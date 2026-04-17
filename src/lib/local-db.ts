import Dexie, { type Table } from "dexie";

export type SyncOpType =
  | "CREATE_SESSION"
  | "CREATE_ROUND"
  | "SAVE_ROUND_SCORE"
  | "UPDATE_SESSION"
  | "CREATE_IMPROVEMENT_AREA";

export type SyncStatus = "pending" | "in_flight" | "synced" | "failed";

export interface SyncQueueItem {
  id?: number;
  opId: string;
  type: SyncOpType;
  payload: Record<string, unknown>;
  status: SyncStatus;
  attempts: number;
  lastAttemptAt: number | null;
  errorMessage: string | null;
  createdAt: number;
  sessionId: string;
  dependsOnOpId?: string | null;
}

class OdiseoDb extends Dexie {
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("odiseo-local");
    this.version(1).stores({
      syncQueue:
        "++id, opId, status, sessionId, createdAt, type",
    });
  }
}

export const db =
  typeof window !== "undefined" ? new OdiseoDb() : (null as any);
