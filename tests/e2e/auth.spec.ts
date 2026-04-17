import { expect, test } from "@playwright/test";
import { openLoginPage } from "./pages/login-page";

test.describe("Autenticación", () => {
  test("muestra el formulario de inicio de sesión y permite cambiar a registro", async ({
    page,
  }) => {
    const login = await openLoginPage(page);

    await expect(login.title).toBeVisible();
    await expect(login.description("login")).toBeVisible();
    await expect(login.email).toBeVisible();
    await expect(login.password).toBeVisible();
    await expect(login.submitButton("login")).toBeVisible();

    await login.modeToggle("login").click();

    await expect(login.description("signup")).toBeVisible();
    await expect(login.confirmPassword).toBeVisible();
    await expect(login.submitButton("signup")).toBeVisible();
  });

  test("redirige una ruta protegida al inicio de sesión", async ({ page }) => {
    await page.goto("/training");

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  });
});