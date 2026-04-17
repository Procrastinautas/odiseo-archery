import type { Page } from "@playwright/test";

export function trainingListPage(page: Page) {
  return {
    heading: page.getByRole("heading", { name: "Entrenamientos" }),
    emptyStateLink: page.getByRole("link", { name: "Iniciar entreno" }),
    sessionCards: page.locator('[data-slot="card"]'),
    detailLinks: page.getByRole("link", { name: "Detalles" }),
    actionsButton: page.getByRole("button").filter({ hasText: /Acciones/ }),
    newMenuItem: page.getByRole("menuitem", { name: "Nuevo" }),
  };
}

export function newTrainingPage(page: Page) {
  return {
    // Phase 0 — recap gate
    continueButton: page.getByRole("button", { name: "Continuar a nueva sesion" }),

    // Step 1
    typeCombobox: page.locator("div").filter({ hasText: /Tipo/ }).locator('[role="combobox"]').first(),
    weatherCombobox: page.locator("div").filter({ hasText: /Clima/ }).locator('[role="combobox"]').first(),
    distanceInput: page.locator('input[name="distance"]'),
    nextButton: page.getByRole("button", { name: "Siguiente" }),

    // Step 2
    backButton: page.getByRole("button", { name: "Atrás" }),
    submitButton: page.getByRole("button", { name: "Comenzar" }),
  };
}

export function sessionDetailPage(page: Page) {
  return {
    roundsTab: page.getByRole("tab", { name: "Rondas" }),
    addRoundButton: page.getByRole("button", { name: "Agregar ronda" }),
    finalizeButton: page.getByRole("button", { name: /Finalizar/ }),
  };
}
