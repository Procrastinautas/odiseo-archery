"use client";

import { useEffect } from "react";
import { db, type SyncQueueItem, type SyncOpType } from "./local-db";
import {
  createTrainingSession,
  createRound,
  upsertRoundScore,
  upsertTrainingSession,
  createImprovementArea,
} from "@/actions/training";

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // 5 retries max
const MAX_ATTEMPTS = 5;

export interface EnqueuePayload {
  type: SyncOpType;
  opId: string;
  payload: Record<string, unknown>;
  sessionId: string;
  dependsOnOpId?: string | null;
}

export async function enqueue(item: EnqueuePayload): Promise<void> {
  if (!db) return;
  await db.syncQueue.add({
    opId: item.opId,
    type: item.type,
    payload: item.payload,
    status: "pending",
    attempts: 0,
    lastAttemptAt: null,
    errorMessage: null,
    createdAt: Date.now(),
    sessionId: item.sessionId,
    dependsOnOpId: item.dependsOnOpId || null,
  });
  drainQueue().catch(console.error);
}

async function callServerAction(
  type: SyncOpType,
  payload: Record<string, unknown>,
): Promise<{ ok?: boolean; id?: string; error?: string }> {
  switch (type) {
    case "CREATE_SESSION": {
      const result = await createTrainingSession(
        payload as Parameters<typeof createTrainingSession>[0],
      );
      return result;
    }
    case "CREATE_ROUND": {
      const { trainingSessionId, clientId, roundNumber } = payload as {
        trainingSessionId: string;
        clientId: string;
        roundNumber: number;
      };
      const result = await createRound(trainingSessionId, {
        clientId,
        roundNumber,
      });
      return result;
    }
    case "SAVE_ROUND_SCORE": {
      const { roundId, ...scoreData } = payload;
      const result = await upsertRoundScore(
        roundId as string,
        scoreData as unknown as Parameters<typeof upsertRoundScore>[1],
      );
      return result;
    }
    case "UPDATE_SESSION": {
      const { id, ...data } = payload;
      const result = await upsertTrainingSession(
        id as string,
        data as Parameters<typeof upsertTrainingSession>[1],
      );
      return result;
    }
    case "CREATE_IMPROVEMENT_AREA": {
      const { trainingSessionId, comment, clientId } = payload as {
        trainingSessionId: string;
        comment: string;
        clientId: string;
      };
      const result = await createImprovementArea(
        trainingSessionId,
        comment,
        clientId,
      );
      return result;
    }
    default:
      return { error: "Unknown operation type" };
  }
}

export async function drainQueue(): Promise<void> {
  if (!db) return;

  const pending = await db.syncQueue
    .where("status")
    .equals("pending")
    .toArray();

  if (pending.length === 0) return;

  // Sort by createdAt to process in order
  pending.sort((a: SyncQueueItem, b: SyncQueueItem) => a.createdAt - b.createdAt);

  for (const item of pending) {
    // Skip if depends on another op that's not synced yet
    if (item.dependsOnOpId) {
      const dep = await db.syncQueue
        .where("opId")
        .equals(item.dependsOnOpId)
        .first();
      if (!dep || dep.status !== "synced") {
        continue;
      }
    }

    try {
      await db.syncQueue.update(item.id!, {
        status: "in_flight",
        lastAttemptAt: Date.now(),
      });

      const result = await callServerAction(item.type, item.payload);

      if (result.error) {
        throw new Error(result.error);
      }

      await db.syncQueue.update(item.id!, {
        status: "synced",
      });

      if (process.env.NODE_ENV === "development") {
        console.log("[sync] drained", { opId: item.opId, type: item.type });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (item.attempts < MAX_ATTEMPTS) {
        const delay = RETRY_DELAYS[item.attempts] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await db.syncQueue.update(item.id!, {
          attempts: item.attempts + 1,
          status: "pending",
          errorMessage: message,
          lastAttemptAt: null,
        });

        // Schedule retry
        setTimeout(() => {
          drainQueue().catch(console.error);
        }, delay);
      } else {
        await db.syncQueue.update(item.id!, {
          status: "failed",
          errorMessage: message,
        });
        console.error("[sync] failed", {
          opId: item.opId,
          type: item.type,
          attempts: item.attempts,
          error: message,
        });
      }
    }
  }
}

export async function retryFailed(sessionId: string): Promise<void> {
  if (!db) return;
  await db.syncQueue
    .where("sessionId")
    .equals(sessionId)
    .and((item: any) => item.status === "failed")
    .modify({
      status: "pending",
      attempts: 0,
      errorMessage: null,
    });

  await drainQueue();
}

export function useSyncEngine(): void {
  useEffect(() => {
    // Drain on mount
    drainQueue().catch(console.error);

    // Listen for online event
    const handleOnline = () => {
      drainQueue().catch(console.error);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
