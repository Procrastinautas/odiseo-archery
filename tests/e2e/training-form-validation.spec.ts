/**
 * Group A — form validation and step-navigation edge cases.
 *
 * These tests do NOT depend on each other (no describe.serial) — each gets
 * a fresh authenticated page via the fixture.
 */
import { test, expect } from "./fixtures/auth";
import { newTrainingPage, selectRadixOption } from "./pages/training-page";

test.describe("Training form — validación y navegación", () => {
  // Dismiss the recap gate and land on step 1 before every test.
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto("/training/new");
    const form = newTrainingPage(page);
    await expect(form.continueButton).toBeVisible({ timeout: 10000 });
    await form.continueButton.click();
    await expect(form.nextButton).toBeVisible({ timeout: 10000 });
  });

  test("no avanza al paso 2 si la distancia está vacía", async ({
    authenticatedPage: page,
  }) => {
    const form = newTrainingPage(page);

    await selectRadixOption(page, form.typeCombobox, "Entrenamiento");
    await selectRadixOption(page, form.weatherCombobox, "Soleado");
    // Leave distance empty and try to advance
    await form.nextButton.click();

    // Step 1 is still rendered
    await expect(form.nextButton).toBeVisible();
    await expect(form.submitButton).not.toBeVisible();
    // Inline zod error from schema: z.string().min(1, "Ingresa la distancia")
    await expect(page.getByText("Ingresa la distancia")).toBeVisible();
  });

  test("no avanza al paso 2 si no se selecciona el tipo", async ({
    authenticatedPage: page,
  }) => {
    const form = newTrainingPage(page);

    // Fill weather and distance but skip type
    await selectRadixOption(page, form.weatherCombobox, "Soleado");
    await form.distanceInput.fill("18");
    await form.nextButton.click();

    // Still on step 1 — submit button (step 2) must not be visible
    await expect(form.nextButton).toBeVisible();
    await expect(form.submitButton).not.toBeVisible();
  });

  test("distancia 0 avanza al paso 2 pero bloquea el envío", async ({
    authenticatedPage: page,
  }) => {
    const form = newTrainingPage(page);

    // "0" passes the zod string.min(1) check (length=1) so step 1 is valid,
    // but onSubmit rejects it with distance < 1 before calling the server.
    await selectRadixOption(page, form.typeCombobox, "Entrenamiento");
    await selectRadixOption(page, form.weatherCombobox, "Soleado");
    await form.distanceInput.fill("0");
    await form.nextButton.click();

    await expect(form.submitButton).toBeVisible({ timeout: 5000 });
    await form.submitButton.click();

    await expect(page.getByText("Ingresa una distancia válida")).toBeVisible({
      timeout: 5000,
    });
    // No redirect — still on the new-training page
    await expect(page).toHaveURL("/training/new");
  });

  test("el botón Atrás conserva el estado del paso 1", async ({
    authenticatedPage: page,
  }) => {
    const form = newTrainingPage(page);

    // Fill step 1
    await selectRadixOption(page, form.typeCombobox, "Entrenamiento");
    await selectRadixOption(page, form.weatherCombobox, "Soleado");
    await form.distanceInput.fill("25");
    await form.nextButton.click();

    // Confirm we're on step 2
    await expect(form.submitButton).toBeVisible({ timeout: 5000 });

    await form.backButton.click();

    // Back on step 1
    await expect(form.nextButton).toBeVisible();
    // Registered input value is preserved by react-hook-form
    await expect(form.distanceInput).toHaveValue("25");

    // RHF still holds type & weather — clicking Siguiente advances without re-filling
    await form.nextButton.click();
    await expect(form.submitButton).toBeVisible({ timeout: 5000 });
  });
});
