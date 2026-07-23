import { expect, test } from "@playwright/test";

test.describe("Login", () => {
  test("shows a login screen before the NDA creator, and logs in with any credentials", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).not.toBeVisible();

    await page.fill("#email", "playwright@example.com");
    await page.fill("#password", "anything");
    await page.click('button:has-text("Log in")');

    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();
    await expect(page.getByText("playwright@example.com")).toBeVisible();
  });

  test("logging out returns to the login screen", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "playwright-logout@example.com");
    await page.fill("#password", "anything");
    await page.click('button:has-text("Log in")');
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();

    await page.click('button:has-text("Log out")');
    await expect(
      page.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeVisible();
  });

  test("persists the session across a reload", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "playwright-persist@example.com");
    await page.fill("#password", "anything");
    await page.click('button:has-text("Log in")');
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();
  });
});
