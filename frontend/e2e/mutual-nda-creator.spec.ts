import { PDFParse } from "pdf-parse";
import { expect, test } from "@playwright/test";

async function fillForm(page: import("@playwright/test").Page) {
  await page.fill("#purpose", "Evaluating a potential software integration partnership.");
  await page.fill("#effectiveDate", "2026-07-20");
  await page.fill('fieldset:has-text("MNDA Term") input[type="number"]', "2");
  await page.click('fieldset:has-text("Term of Confidentiality") >> text=In perpetuity');
  await page.fill("#governingLaw", "Delaware");
  await page.fill("#jurisdiction", "courts located in New Castle, DE");
  await page.fill("#modifications", "None.");

  await page.fill("#party-1-signature", "Jane Smith");
  await page.fill("#party-1-printName", "Jane Smith");
  await page.fill("#party-1-title", "CEO");
  await page.fill("#party-1-company", "Acme Corp");
  await page.fill("#party-1-noticeAddress", "Suite <B>, 123 Main St");
  await page.fill("#party-1-date", "2026-07-20");

  await page.fill("#party-2-signature", "John Doe");
  await page.fill("#party-2-printName", "John Doe");
  await page.fill("#party-2-title", "COO");
  await page.fill("#party-2-company", "Beta LLC");
  await page.fill("#party-2-noticeAddress", "john@beta.example");
  await page.fill("#party-2-date", "2026-07-20");
}

test.describe("Mutual NDA Creator", () => {
  test("live preview reflects every field as the user fills the form", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);

    const preview = page.locator(".prose");
    await expect(preview).toContainText(
      "Evaluating a potential software integration partnership.",
    );
    await expect(preview).toContainText("July 20, 2026");
    await expect(preview).toContainText("2 year(s) from Effective Date");
    await expect(preview).toContainText("In perpetuity");
    await expect(preview).toContainText("Governing Law: Delaware");
    await expect(preview).toContainText("courts located in New Castle, DE");
    await expect(preview).toContainText("Jane Smith");
    await expect(preview).toContainText("John Doe");
    await expect(preview).toContainText("Introduction");

    // Neither the source template's instructional <label> hints nor the
    // Standard Terms' coverpage_link styling spans should leak as raw text.
    const previewText = await preview.innerText();
    expect(previewText).not.toContain("coverpage_link");
    expect(previewText).not.toContain("<label>");

    // Regression: free text shaped like an HTML tag must render, not vanish
    // (see lib/fillCoverPage.ts's MARKDOWN_ESCAPABLE escaping).
    expect(previewText).toContain("Suite <B>, 123 Main St");
  });

  test("downloading produces a real PDF with every field as extractable text", async ({
    page,
  }) => {
    await page.goto("/");
    await fillForm(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:has-text("Download .pdf")'),
    ]);

    expect(download.suggestedFilename()).toBe("Mutual-NDA.pdf");

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fs = await import("node:fs/promises");
    const pdfBytes = await fs.readFile(downloadPath!);
    expect(pdfBytes.subarray(0, 4).toString("ascii")).toBe("%PDF");

    const parser = new PDFParse({ data: pdfBytes });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text.replace(/\s+/g, " ");

    expect(parsed.total).toBeGreaterThan(1);
    expect(text).toContain("Evaluating a potential software integration partnership.");
    expect(text).toContain("July 20, 2026");
    expect(text).toContain("2 year(s) from Effective Date");
    expect(text).toContain("In perpetuity");
    expect(text).toContain("Governing Law: Delaware");
    expect(text).toContain("courts located in New Castle, DE");
    expect(text).toContain("Jane Smith");
    expect(text).toContain("John Doe");
    expect(text).toContain("Standard Terms");
    expect(text).toContain("Introduction");
    expect(text).toContain("Suite <B>, 123 Main St");
    expect(text).not.toContain("<label>");
    expect(text).not.toContain("coverpage_link");
  });

  test("toggling MNDA Term disables/enables the year count input", async ({ page }) => {
    await page.goto("/");
    const fieldset = page.locator('fieldset:has-text("MNDA Term")');
    const yearsInput = fieldset.locator('input[type="number"]');
    const continuesRadio = fieldset.getByText(
      "Continues until terminated in accordance with the terms of the MNDA",
    );
    const expiresRadio = fieldset.getByLabel("Expires");

    await expect(yearsInput).toBeEnabled();
    await continuesRadio.click();
    await expect(yearsInput).toBeDisabled();
    await expiresRadio.check();
    await expect(yearsInput).toBeEnabled();
  });
});
