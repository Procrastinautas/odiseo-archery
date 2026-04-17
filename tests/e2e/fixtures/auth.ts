/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from "@playwright/test";
import path from "node:path";

const STORAGE_STATE = path.resolve(__dirname, "../.auth/user.json");

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
