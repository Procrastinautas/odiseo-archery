import { type Page } from "@playwright/test";

type LoginMode = "login" | "signup";

export function loginPage(page: Page) {
  return {
    title: page.getByText("Odiseo Archery"),
    email: page.getByLabel("Correo electrónico"),
    password: page.getByLabel("Contraseña"),
    confirmPassword: page.getByLabel("Confirmar contraseña"),
    description(mode: LoginMode) {
      return page.getByText(
        mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta",
      );
    },
    submitButton(mode: LoginMode) {
      return page.getByRole("button", {
        name: mode === "login" ? "Iniciar sesión" : "Crear cuenta",
      });
    },
    modeToggle(mode: LoginMode) {
      return page.getByRole("button", {
        name: mode === "login" ? "Regístrate" : "Inicia sesión",
      });
    },
  };
}

export async function openLoginPage(page: Page) {
  await page.goto("/login");
  return loginPage(page);
}