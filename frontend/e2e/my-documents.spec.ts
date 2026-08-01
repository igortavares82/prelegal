import { expect, test } from "@playwright/test";
import { logInAndOpenMutualNda } from "./helpers";

test.describe("My Documents", () => {
  test("saving a document surfaces it in My Documents, and reopening it restores the fields", async ({
    page,
  }) => {
    await page.goto("/");
    await logInAndOpenMutualNda(page);

    await page.fill("#purpose", "Evaluating a joint venture");
    await page.fill("#governingLaw", "Delaware");

    await page.getByLabel("Document name").fill("Acme Joint Venture NDA");
    await page.click('button:has-text("Save")');
    await expect(page.getByRole("status")).toContainText(
      "Saved as “Acme Joint Venture NDA”",
    );

    await page.click('button:has-text("My documents")');
    await expect(page.getByText("Acme Joint Venture NDA")).toBeVisible();

    await page.click("text=Acme Joint Venture NDA");
    await page.waitForSelector("#purpose");
    await expect(page.locator("#purpose")).toHaveValue("Evaluating a joint venture");
    await expect(page.locator("#governingLaw")).toHaveValue("Delaware");
  });

  test("shows an empty state before any document has been saved", async ({ page }) => {
    await page.goto("/");
    await logInAndOpenMutualNda(page);

    await page.click('button:has-text("My documents")');
    await expect(page.getByText(/haven't saved any documents yet/)).toBeVisible();
  });
});
