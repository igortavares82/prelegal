import { expect, test } from "@playwright/test";
import { uniqueEmail } from "./helpers";

async function signUp(page: import("@playwright/test").Page, email: string, password = "password123") {
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button:has-text("Need an account? Sign up")');
  await page.click('button:has-text("Sign up")');
}

test.describe("Login", () => {
  test("shows a login screen before the app, and signs up with a new account", async ({ page }) => {
    const email = uniqueEmail("playwright-signup");
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).not.toBeVisible();

    await signUp(page, email);

    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("logs back in with the same credentials after signing up", async ({ page }) => {
    const email = uniqueEmail("playwright-login");
    await page.goto("/");
    await signUp(page, email);
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();

    await page.click('button:has-text("Log out")');
    await page.fill("#email", email);
    await page.fill("#password", "password123");
    await page.click('button:has-text("Log in")');

    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();
  });

  test("rejects an incorrect password", async ({ page }) => {
    const email = uniqueEmail("playwright-badpw");
    await page.goto("/");
    await signUp(page, email);
    await page.click('button:has-text("Log out")');

    await page.fill("#email", email);
    await page.fill("#password", "wrong-password");
    await page.click('button:has-text("Log in")');

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).not.toBeVisible();
  });

  test("logging out returns to the login screen", async ({ page }) => {
    const email = uniqueEmail("playwright-logout");
    await page.goto("/");
    await signUp(page, email);
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();

    await page.click('button:has-text("Log out")');
    await expect(
      page.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeVisible();
  });

  test("persists the session across a reload", async ({ page }) => {
    const email = uniqueEmail("playwright-persist");
    await page.goto("/");
    await signUp(page, email);
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Legal Document Creator" }),
    ).toBeVisible();
  });
});
