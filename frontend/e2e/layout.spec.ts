import { expect, test } from "@playwright/test";

test.describe("Responsive scroll layout", () => {
  test.describe("desktop (lg+)", () => {
    test.use({ viewport: { width: 1440, height: 800 } });

    test("the page itself does not scroll — form and preview panels do, independently", async ({
      page,
    }) => {
      await page.goto("/");

      const docScroll = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(docScroll.scrollHeight).toBeLessThanOrEqual(docScroll.clientHeight + 2);

      const panels = await page.evaluate(() => {
        const h1 = [...document.querySelectorAll("h1")].find(
          (h) => h.textContent === "Mutual NDA Creator",
        )!;
        const grid = h1.closest("header")!.nextElementSibling as HTMLElement;
        return [...grid.children].map((el) => ({
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflowY: getComputedStyle(el).overflowY,
        }));
      });

      expect(panels).toHaveLength(2);
      for (const panel of panels) {
        expect(["auto", "scroll"]).toContain(panel.overflowY);
        expect(panel.clientHeight).toBeLessThanOrEqual(800);
        // Content is taller than the box, i.e. it actually needs to scroll.
        expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
      }
    });

    test("scrolling the form panel does not move the preview panel", async ({ page }) => {
      await page.goto("/");

      const before = await page.evaluate(() => {
        const h1 = [...document.querySelectorAll("h1")].find(
          (h) => h.textContent === "Mutual NDA Creator",
        )!;
        const grid = h1.closest("header")!.nextElementSibling as HTMLElement;
        return {
          form: grid.children[0].scrollTop,
          preview: grid.children[1].scrollTop,
        };
      });
      expect(before).toEqual({ form: 0, preview: 0 });

      await page.evaluate(() => {
        const h1 = [...document.querySelectorAll("h1")].find(
          (h) => h.textContent === "Mutual NDA Creator",
        )!;
        const grid = h1.closest("header")!.nextElementSibling as HTMLElement;
        (grid.children[0] as HTMLElement).scrollTop = 400;
      });

      const after = await page.evaluate(() => {
        const h1 = [...document.querySelectorAll("h1")].find(
          (h) => h.textContent === "Mutual NDA Creator",
        )!;
        const grid = h1.closest("header")!.nextElementSibling as HTMLElement;
        return {
          form: grid.children[0].scrollTop,
          preview: grid.children[1].scrollTop,
        };
      });
      expect(after.form).toBe(400);
      expect(after.preview).toBe(0);
    });
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the whole page scrolls naturally (single stacked column)", async ({ page }) => {
      await page.goto("/");

      const docScroll = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      // Below the lg breakpoint, form + preview stack vertically and the
      // page itself should be taller than the viewport (not clipped).
      expect(docScroll.scrollHeight).toBeGreaterThan(docScroll.clientHeight);
    });
  });
});
