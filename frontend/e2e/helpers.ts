import type { Page } from "@playwright/test";

export async function logIn(page: Page, email = "e2e@example.com") {
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Log in")');
  await page.waitForSelector("h1:has-text(\"Mutual NDA Creator\")");
}
