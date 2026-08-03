import type { Page } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/**
 * Signs up a brand-new account and lands on the app. Login now requires a
 * real, previously-registered account (see PL-7), so tests that just need
 * to be "logged in" as some user sign up with a fresh, unique email rather
 * than reusing a fixed one across the whole Playwright run.
 */
export async function logIn(page: Page, email = uniqueEmail("e2e")) {
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Need an account? Sign up")');
  await page.click('button:has-text("Sign up")');
  await page.waitForSelector('h1:has-text("Legal Document Creator")');
}

/**
 * Logs in and drives the resolver chat (mocked) straight to the Mutual NDA
 * editor, so specs that exercise the NDA-specific pipeline don't each need
 * to write their own resolver-chat interaction.
 */
export async function logInAndOpenMutualNda(page: Page, email = uniqueEmail("e2e")) {
  await page.route("**/api/chat/resolve", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Great, let's build a Mutual NDA.",
        matched_slug: "mutual-nda",
      }),
    });
  });

  await logIn(page, email);
  await page.fill("#resolve-chat-input", "I need a mutual NDA");
  await page.click('button:has-text("Send")');
  await page.waitForSelector("#chat-input");
}
