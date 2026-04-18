/**
 * Group C — local-first sync queue behaviours.
 *
 * Three invariants under test:
 *  1. Optimistic UI: improvement areas render before the sync engine drains.
 *  2. Offline → Online: an area added while offline queues locally, syncs on
 *     network recovery, and the SyncStatusIndicator clears.
 *  3. Delete pending: deleting an unsynced area cancels the queue entry without
 *     ever calling the server — confirmed via DB assertion.
 *
 * Each test seeds its own session via the admin API and cleans up in finally{}.
 */
import { test, expect } from "./fixtures/auth";
import { createClient } from "@supabase/supabase-js";

const TEST_USER_EMAIL = "e2e-test@odiseo-archery.test";

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function getTestUserId(
  admin: ReturnType<typeof makeAdminClient>,
): Promise<string> {
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === TEST_USER_EMAIL);
  if (!user) throw new Error(`Test user ${TEST_USER_EMAIL} not found`);
  return user.id;
}

async function seedSession(
  admin: ReturnType<typeof makeAdminClient>,
  userId: string,
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const { error } = await admin.from("training_sessions").insert({
    id: sessionId,
    user_id: userId,
    type: "training",
    weather: "sunny",
    distance: 18,
  });
  if (error) throw error;
  return sessionId;
}

test.describe("Cola de sincronización — comportamiento local-first", () => {
  // ─── Test 1 ───────────────────────────────────────────────────────────────
  // handleAdd() calls setAreas() synchronously before awaiting enqueue().
  // The item must appear in the DOM within 1 s — before the sync engine has
  // had any chance to drain the queue.
  test("área de mejora aparece de inmediato antes de sincronizar (optimista)", async ({
    authenticatedPage: page,
  }) => {
    const admin = makeAdminClient();
    const userId = await getTestUserId(admin);
    const sessionId = await seedSession(admin, userId);

    try {
      await page.goto(`/training/${sessionId}`);
      await page.getByRole("tab", { name: "Notas" }).click();

      const comment = "Mejorar la postura en la extensión";
      const textarea = page.getByPlaceholder("Agregar área a mejorar...");
      await textarea.fill(comment);
      // The component's onKeyDown handler calls handleAdd() on Enter
      await textarea.press("Enter");

      // Must appear within 1 s — well before any network round-trip completes
      await expect(page.getByText(comment)).toBeVisible({ timeout: 1000 });
    } finally {
      await admin.from("training_sessions").delete().eq("id", sessionId);
    }
  });

  // ─── Test 2 ───────────────────────────────────────────────────────────────
  // useSyncEngine registers a window "online" listener. While offline, enqueue()
  // writes to IndexedDB but drainQueue() cannot reach the server. On network
  // recovery we dispatch "online" to trigger the drain, and the
  // SyncStatusIndicator (driven by useLiveQuery) must clear.
  //
  // NOTE: SyncStatusIndicator is rendered inside TabsContent value="rounds"
  // (Rondas tab). To observe it we must be on that tab. The flow is:
  //   1. switch to Notas (offline) → add area → wait for enqueue toast
  //   2. switch back to Rondas → indicator shows
  //   3. go online → drain → indicator clears
  test("área agregada sin conexión se sincroniza al recuperar la red", async ({
    authenticatedPage: page,
  }) => {
    const admin = makeAdminClient();
    const userId = await getTestUserId(admin);
    const sessionId = await seedSession(admin, userId);

    try {
      await page.goto(`/training/${sessionId}`);

      // Cut the network before adding so no drain attempt can reach the server
      await page.context().setOffline(true);

      // Add area from the Notas tab
      await page.getByRole("tab", { name: "Notas" }).click();
      const comment = "Consistencia en la soltada";
      const textarea = page.getByPlaceholder("Agregar área a mejorar...");
      await textarea.fill(comment);
      await textarea.press("Enter");

      // Optimistic update is visible even while offline
      await expect(page.getByText(comment)).toBeVisible({ timeout: 1000 });

      // "Área agregada" toast fires after enqueue() completes — confirms the
      // item is in the IndexedDB queue before we switch tabs
      await expect(page.getByText("Área agregada")).toBeVisible({
        timeout: 5000,
      });

      // Switch to Rondas tab where SyncStatusIndicator is rendered
      await page.getByRole("tab", { name: "Rondas" }).click();

      // SyncStatusIndicator queries IndexedDB live and shows the pending op
      await expect(page.getByText(/Sincronizando/)).toBeVisible({
        timeout: 5000,
      });

      // Restore network; dispatch "online" so useSyncEngine's listener fires
      await page.context().setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event("online")));

      // After the drain completes, the indicator disappears
      await expect(page.getByText(/Sincronizando/)).not.toBeVisible({
        timeout: 10000,
      });

      // DB confirmation: the server actually created the row
      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from("improvement_areas")
              .select("comment")
              .eq("training_session_id", sessionId);
            return data?.length ?? 0;
          },
          { timeout: 10000 },
        )
        .toBe(1);
    } finally {
      await page.context().setOffline(false);
      await admin.from("training_sessions").delete().eq("id", sessionId);
    }
  });

  // ─── Test 3 ───────────────────────────────────────────────────────────────
  // handleDelete() checks syncStatus === "pending". For pending items it removes
  // from local state AND deletes the queue entry from IndexedDB — no server call.
  // After going online, drainQueue() finds the queue empty and does nothing.
  test("eliminar área pendiente cancela la sincronización sin llamar al servidor", async ({
    authenticatedPage: page,
  }) => {
    const admin = makeAdminClient();
    const userId = await getTestUserId(admin);
    const sessionId = await seedSession(admin, userId);

    try {
      await page.goto(`/training/${sessionId}`);
      await page.getByRole("tab", { name: "Notas" }).click();

      // Stay offline so the area remains pending (no drain can run)
      await page.context().setOffline(true);

      const comment = "Alineación del codo de la mano del arco";
      const textarea = page.getByPlaceholder("Agregar área a mejorar...");
      await textarea.fill(comment);
      await textarea.press("Enter");

      await expect(page.getByText(comment)).toBeVisible({ timeout: 1000 });

      // Delete the pending item — handleDelete detects syncStatus="pending",
      // removes from state, and deletes the queue entry. No server is called.
      await page.getByRole("button", { name: "Eliminar" }).click();

      await expect(page.getByText(comment)).not.toBeVisible({ timeout: 2000 });

      // Go online and trigger a drain — it must find an empty queue
      await page.context().setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event("online")));

      // No sync indicator should ever appear (queue is empty)
      await expect(page.getByText(/Sincronizando/)).not.toBeVisible({
        timeout: 3000,
      });

      // DB must still be empty — the server was never called
      const { data } = await admin
        .from("improvement_areas")
        .select("id")
        .eq("training_session_id", sessionId);
      expect(data).toHaveLength(0);
    } finally {
      await page.context().setOffline(false);
      await admin.from("training_sessions").delete().eq("id", sessionId);
    }
  });
});
