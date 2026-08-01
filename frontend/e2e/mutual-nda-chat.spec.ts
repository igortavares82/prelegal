import { expect, test } from "@playwright/test";
import { logInAndOpenMutualNda } from "./helpers";

test.describe("Mutual NDA AI chat", () => {
  test("a chat reply updates the live preview and the manual form", async ({ page }) => {
    await page.route("**/api/chat/mutual-nda", async (route) => {
      const request = route.request().postDataJSON();
      expect(request.messages.at(-1)).toEqual({
        role: "user",
        content: "Evaluating a potential software integration partnership.",
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Got it — what's the effective date?",
          fields: {
            purpose: "Evaluating a potential software integration partnership.",
            effectiveDate: "",
            mndaTermType: "expires",
            mndaTermYears: "1",
            confidentialityTermType: "expires",
            confidentialityTermYears: "1",
            governingLaw: "",
            jurisdiction: "",
            modifications: "",
            party1: {
              signature: "",
              printName: "",
              title: "",
              company: "",
              noticeAddress: "",
              date: "",
            },
            party2: {
              signature: "",
              printName: "",
              title: "",
              company: "",
              noticeAddress: "",
              date: "",
            },
          },
          is_complete: false,
        }),
      });
    });

    await page.goto("/");
    await logInAndOpenMutualNda(page);

    await page.fill(
      "#chat-input",
      "Evaluating a potential software integration partnership.",
    );
    await page.click('button:has-text("Send")');

    await expect(page.getByText("Got it — what's the effective date?")).toBeVisible();

    const preview = page.locator(".prose");
    await expect(preview).toContainText(
      "Evaluating a potential software integration partnership.",
    );
    await expect(page.locator("#purpose")).toHaveValue(
      "Evaluating a potential software integration partnership.",
    );
  });

  test("a failed chat request shows an error with a retry option", async ({ page }) => {
    await page.route("**/api/chat/mutual-nda", async (route) => {
      await route.fulfill({ status: 502 });
    });

    await page.goto("/");
    await logInAndOpenMutualNda(page);

    await page.fill("#chat-input", "Hi");
    await page.click('button:has-text("Send")');

    await expect(
      page.getByRole("alert").filter({ hasText: "temporarily unavailable" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
