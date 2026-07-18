import { test, expect } from "@playwright/test";

test.describe("TRV Crew Leader Board - Baseline", () => {
  test("app loads without crashing", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/trv");
    await page.waitForLoadState("load");

    // Page should have content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("renders SVG board", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/trv");
    await page.waitForLoadState("load");

    // Find SVG elements (the board)
    const svgs = await page.locator("svg").count();
    expect(svgs).toBeGreaterThan(0);
  });

  test("has save and export buttons", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/trv");
    await page.waitForLoadState("load");

    const buttons = await page.locator("button").count();
    expect(buttons).toBeGreaterThan(5);

    // Check for export-related button text
    const buttonTexts = await page.locator("button").allTextContents();
    const hasExportBtn = buttonTexts.some(text =>
      text.toUpperCase().includes("SNAPSHOT") ||
      text.toUpperCase().includes("EXPORT") ||
      text.toUpperCase().includes("DOWNLOAD") ||
      text.toUpperCase().includes("PNG")
    );
    expect(hasExportBtn).toBe(true);
  });
});
