/**
 * Round score entry and sync.
 *
 * Verifies that:
 *  1. Entering 6 arrows in manual mode and saving navigates back to the
 *     session detail without getting stuck on "Sincronizando".
 *  2. The score is persisted to the DB (via the background drain triggered by
 *     the fixed enqueue()).
 *  3. After a fresh page load the round card shows the correct total score.
 *
 * Seeds a session + round via the admin API so the test is self-contained.
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

test.describe("Puntaje de ronda — entrada manual y sincronización", () => {
  test("guardar 6 flechas de 9 sincroni  sin quedar bloqueado y muestra 54 pts", async ({
    authenticatedPage: page,
  }) => {
    const admin = makeAdminClient();
    const userId = await getTestUserId(admin);

    // Seed session
    const sessionId = crypto.randomUUID();
    const { error: sessionError } = await admin.from("training_sessions").insert({
      id: sessionId,
      user_id: userId,
      type: "training",
      weather: "sunny",
      distance: 18,
    });
    if (sessionError) throw sessionError;

    // Seed a round
    const roundId = crypto.randomUUID();
    const { error: roundError } = await admin.from("rounds").insert({
      id: roundId,
      training_session_id: sessionId,
      round_number: 1,
    });
    if (roundError) throw roundError;

    try {
      // Navigate to the round score entry page
      await page.goto(`/training/${sessionId}/round/${roundId}`);

      // Click "9" six times to fill all ARROW_COUNT slots with 9
      const nineButton = page.getByRole("button", { name: "9" });
      await expect(nineButton).toBeVisible({ timeout: 8000 });
      for (let i = 0; i < 6; i++) {
        await nineButton.click();
      }

      // The score summary should show 54 pts (6 × 9)
      await expect(page.getByText("54 pts")).toBeVisible({ timeout: 3000 });

      // Submit
      await page.getByRole("button", { name: "Guardar ronda" }).click();

      // Should redirect back to the session detail
      await expect(page).toHaveURL(
        new RegExp(`/training/${sessionId}$`),
        { timeout: 10000 },
      );

      // SyncStatusIndicator is in the Rondas tab (default tab) — must NOT stay
      // stuck on "Sincronizando" indefinitely. With the enqueue→drainQueue fix
      // it should clear within a few seconds.
      await expect(page.getByText(/Sincronizando/)).not.toBeVisible({
        timeout: 10000,
      });

      // DB confirmation: round_scores row has total_score = 54
      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from("round_scores")
              .select("total_score")
              .eq("round_id", roundId);
            return data?.[0]?.total_score ?? null;
          },
          { timeout: 10000 },
        )
        .toBe(54);

      // After a fresh server render the round card must display "54 pts"
      await page.goto(`/training/${sessionId}`);
      await expect(page.getByText("54 pts")).toBeVisible({ timeout: 8000 });
    } finally {
      await admin.from("training_sessions").delete().eq("id", sessionId);
    }
  });
});
