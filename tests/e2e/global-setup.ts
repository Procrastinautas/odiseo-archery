import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const TEST_USER_EMAIL = "e2e-test@odiseo-archery.test";
const TEST_USER_PASSWORD = "E2eTest1234!";
const AUTH_STATE_PATH = path.resolve(__dirname, ".auth/user.json");

export default async function globalSetup(config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  // Seed test user via Admin API (idempotent: ignore "already registered" error)
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: createError } = await admin.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }

  // Capture real session cookies via headless browser login
  const baseURL = config.projects[0].use.baseURL ?? "http://127.0.0.1:3030";
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel("Correo electrónico").fill(TEST_USER_EMAIL);
    await page.getByLabel("Contraseña").fill(TEST_USER_PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await page.waitForURL(/\/training/, { timeout: 15000 });

    await context.storageState({ path: AUTH_STATE_PATH });
  } finally {
    await browser.close();
  }
}
