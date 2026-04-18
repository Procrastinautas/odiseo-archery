import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Radix UI Select renders its dropdown in a portal on document.body.
 * We must wait for the listbox to appear before clicking the option,
 * otherwise the click races with the portal mount animation.
 */
export async function selectRadixOption(
  page: Page,
  trigger: Locator,
  optionText: string,
) {
  await trigger.click();
  // Both Select components render their listboxes in the DOM simultaneously (hidden).
  // Scoping by hasText avoids the strict-mode "resolved to 2 elements" error.
  const listbox = page.locator('[role="listbox"]').filter({ hasText: optionText });
  await listbox.waitFor({ state: "visible", timeout: 8000 });
  const option = listbox.getByRole("option", { name: optionText });
  await option.waitFor({ state: "visible", timeout: 5000 });
  // Base UI onClick guard (SelectItem.js:175):
  //   `pointerTypeRef.current !== 'touch' && !highlighted` → silently drops click.
  // Keyboard (Enter) path was also broken: after onKeyDown commits selection and
  // setOpen(false) returns focus to the trigger (<button>), keyup fires on the
  // trigger — which the browser turns into a native click, reopening the popup.
  // Fix: simulate touch pointer events via evaluate. 'touch' short-circuits the
  // guard (`'touch' !== 'touch'` = false), so commitSelection always fires.
  await option.evaluate((el) => {
    el.dispatchEvent(
      new PointerEvent("pointerenter", { pointerType: "touch", bubbles: true }),
    );
    el.dispatchEvent(
      new PointerEvent("pointerdown", { pointerType: "touch", bubbles: true }),
    );
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  // aria-expanded flips to "false" as soon as React processes setOpen(false),
  // but the popup plays a 100ms exit animation (duration-100 in Tailwind) and
  // stays in the DOM while it fades out. Wait for the listbox to become hidden
  // (opacity→0 = Playwright hidden) so the next trigger.click() doesn't find
  // the still-exiting listbox instead of the newly opened one.
  await expect(trigger).not.toHaveAttribute("aria-expanded", "true", {
    timeout: 5000,
  });
  await listbox.waitFor({ state: "hidden", timeout: 1000 });
}

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

    // Step 1 — use positional nth(): filter({ hasText }) matches ancestor divs
    // that contain BOTH comboboxes, so .first() on either filter returns the
    // same (type) combobox. There are exactly 2 comboboxes on step 1.
    typeCombobox: page.getByRole("combobox").first(),
    weatherCombobox: page.getByRole("combobox").nth(1),
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
