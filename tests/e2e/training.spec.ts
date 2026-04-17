import { test, expect } from "./fixtures/auth";
import {
  trainingListPage,
  newTrainingPage,
  sessionDetailPage,
} from "./pages/training-page";

test.describe.serial("Training lifecycle", () => {
  test("muestra el encabezado de Entrenamientos", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/training");
    const list = trainingListPage(page);
    await expect(list.heading).toBeVisible();
    await expect(page).toHaveURL("/training");
  });

  test.skip("crea una sesión de entrenamiento nueva", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/training/new");
    const form = newTrainingPage(page);

    // Phase 0: dismiss recap gate
    await expect(form.continueButton).toBeVisible({ timeout: 10000 });
    await form.continueButton.click();

    // Wait for form to appear after recap gate is dismissed
    await expect(form.nextButton).toBeVisible({ timeout: 10000 });

    // Step 1: required fields
    await form.typeCombobox.click();
    const typeOption = page.getByRole("option", { name: "Entrenamiento" });
    await typeOption.waitFor({ state: "visible", timeout: 5000 });
    await typeOption.click();

    // Use keyboard to select weather (Select might have issues with click)
    await form.weatherCombobox.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await form.distanceInput.fill("18");
    await form.nextButton.click();

    // Step 2: submit with optional fields skipped
    await expect(form.submitButton).toBeVisible({ timeout: 10000 });
    await form.submitButton.click();

    // Verify redirect to session detail
    await expect(page).toHaveURL(/\/training\/[0-9a-f-]{36}$/, {
      timeout: 15000,
    });
  });

  test.skip("la página de detalle muestra las pestañas de sesión", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to list and click into first session (created by previous test)
    await page.goto("/training");
    const list = trainingListPage(page);
    const detailLink = list.detailLinks.first();
    await expect(detailLink).toBeVisible();
    await detailLink.click();

    await expect(page).toHaveURL(/\/training\/[0-9a-f-]{36}$/);
    const detail = sessionDetailPage(page);
    await expect(detail.roundsTab).toBeVisible();
    await expect(detail.addRoundButton).toBeVisible();
  });
});
