import { expect, test } from "@playwright/test";
import { logIn } from "./helpers";

test.describe("Generic document AI chat", () => {
  test("resolving to a non-NDA document type reaches its chat, form, and live preview", async ({
    page,
  }) => {
    await page.route("**/api/chat/resolve", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Got it, let's put together a Cloud Service Agreement.",
          matched_slug: "csa",
        }),
      });
    });

    await page.route("**/api/chat/document/csa", async (route) => {
      const request = route.request().postDataJSON();
      expect(request.field_keys).toContain("Customer");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply: "Great — what's the Effective Date?",
          fields: { Customer: "Acme Corp" },
          is_complete: false,
        }),
      });
    });

    await page.goto("/");
    await logIn(page);

    await page.fill("#resolve-chat-input", "I need to let a vendor use our cloud API");
    await page.click('button:has-text("Send")');

    // The resolver hands off to a fresh chat for the matched document type
    // (see ResolveChat/DocumentChat) rather than carrying its own transcript
    // forward, so its own transitional reply is expected to disappear here.
    await expect(
      page.getByText(/I'll help you put together your Cloud Service Agreement/),
    ).toBeVisible();

    await page.fill("#generic-chat-input", "The customer is Acme Corp");
    await page.click('button:has-text("Send")');

    await expect(page.getByText("Great — what's the Effective Date?")).toBeVisible();
    const preview = page.locator(".prose");
    await expect(preview).toContainText("Acme Corp");
    await expect(page.getByLabel("Customer", { exact: true })).toHaveValue("Acme Corp");
  });

  test("the resolver explains an unsupported request and offers the closest catalog match", async ({
    page,
  }) => {
    await page.route("**/api/chat/resolve", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply:
            "We can't generate an employment agreement, but the closest thing we support is a Professional Services Agreement — want to use that instead?",
          matched_slug: null,
        }),
      });
    });

    await page.goto("/");
    await logIn(page);

    await page.fill("#resolve-chat-input", "I need an employment agreement");
    await page.click('button:has-text("Send")');

    await expect(
      page.getByText(/closest thing we support is a Professional Services Agreement/),
    ).toBeVisible();
    // Still on the resolver — no document type was matched yet.
    await expect(page.locator("#resolve-chat-input")).toBeVisible();
  });
});
