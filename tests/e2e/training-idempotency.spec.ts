/**
 * Group B — server-side idempotency and conflict-detection edge cases.
 *
 * Two behaviours under test:
 *  1. Submit button disables during an in-flight server action (double-click guard).
 *  2. createRound returns a specific conflict error when round_number already exists
 *     (race condition: another client inserted the same round while the page was open).
 */
import { test, expect } from "./fixtures/auth";
import { createClient } from "@supabase/supabase-js";
import {
  newTrainingPage,
  selectRadixOption,
  sessionDetailPage,
} from "./pages/training-page";

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

test.describe("Idempotencia y detección de conflictos", () => {
  // ─── Test 1 ───────────────────────────────────────────────────────────────
  // Next.js server actions POST to the current page URL. We add a 1.5 s delay
  // via Playwright route interception so the isPending state is long enough to
  // observe: the button must show "Creando sesión..." and be disabled while the
  // transition is in flight.
  test("botón Comenzar queda deshabilitado durante el envío (previene doble clic)", async ({
    authenticatedPage: page,
  }) => {
    await page.route("**/training/new", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });

    await page.goto("/training/new");
    const form = newTrainingPage(page);
    await expect(form.continueButton).toBeVisible({ timeout: 10000 });
    await form.continueButton.click();
    await expect(form.nextButton).toBeVisible({ timeout: 10000 });

    await selectRadixOption(page, form.typeCombobox, "Entrenamiento");
    await selectRadixOption(page, form.weatherCombobox, "Soleado");
    await form.distanceInput.fill("18");
    await form.nextButton.click();
    await expect(form.submitButton).toBeVisible({ timeout: 5000 });

    await form.submitButton.click();

    // Within the 1.5 s window, isPending = true → button disabled + label changes
    await expect(
      page.getByRole("button", { name: "Creando sesión..." }),
    ).toBeDisabled({ timeout: 2000 });

    // After the delay, the action completes and the app redirects
    await expect(page).toHaveURL(/\/training\/[0-9a-f-]{36}$/, {
      timeout: 20000,
    });
  });

  // ─── Test 2 ───────────────────────────────────────────────────────────────
  // Simulates a race condition: the server-side render fetches 0 rounds
  // (currentRoundCount = 0), but before the user clicks "Agregar ronda",
  // another client inserts round 1 directly into the DB. The UI tries to
  // create round 1 again → createRound detects the unique-constraint conflict
  // and returns the specific error text that SessionActions renders inline.
  test("detecta conflicto cuando ya existe una ronda con el mismo número", async ({
    authenticatedPage: page,
  }) => {
    const admin = makeAdminClient();
    const userId = await getTestUserId(admin);

    // Seed a session via admin — no UI needed, keeps the test independent
    const sessionId = crypto.randomUUID();
    const { error: sessionInsertError } = await admin
      .from("training_sessions")
      .insert({
        id: sessionId,
        user_id: userId,
        type: "training",
        weather: "sunny",
        distance: 18,
      });
    if (sessionInsertError) throw sessionInsertError;

    try {
      // Navigate: server renders with rounds = [] → currentRoundCount = 0
      await page.goto(`/training/${sessionId}`);
      const detail = sessionDetailPage(page);
      await expect(detail.addRoundButton).toBeVisible({ timeout: 10000 });

      // Race: insert round 1 behind the scenes while the page is already open
      const { error: roundInsertError } = await admin.from("rounds").insert({
        id: crypto.randomUUID(),
        training_session_id: sessionId,
        round_number: 1,
      });
      if (roundInsertError) throw roundInsertError;

      // UI believes currentRoundCount is still 0 → tries to create round 1 → conflict
      await detail.addRoundButton.click();

      await expect(
        page.getByText("Ronda con este número ya existe"),
      ).toBeVisible({ timeout: 10000 });

      // "Reintentar" retry button also rendered alongside the error
      await expect(
        page.getByRole("button", { name: "Reintentar" }),
      ).toBeVisible();
    } finally {
      // Cascade delete cleans up rounds as well (FK: rounds.training_session_id)
      await admin.from("training_sessions").delete().eq("id", sessionId);
    }
  });
});
