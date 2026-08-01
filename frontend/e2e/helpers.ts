import type { Page } from "@playwright/test";

export async function logIn(page: Page, email = "e2e@example.com") {
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Log in")');
  await page.waitForSelector('h1:has-text("Legal Document Creator")');
}

/**
 * Logs in and drives the resolver chat (mocked) straight to the Mutual NDA
 * editor, so specs that exercise the NDA-specific pipeline don't each need
 * to write their own resolver-chat interaction.
 */
export async function logInAndOpenMutualNda(page: Page, email = "e2e@example.com") {
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
