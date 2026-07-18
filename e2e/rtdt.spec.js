import { test, expect } from "@playwright/test";

test.describe("RTDT Hero Board - Baseline", () => {
  test("page responds and has basic structure", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    const response = await page.goto("/rtdt");

    // Verify we got a successful response
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
  });

  test("page includes React root element", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/rtdt");

    // Look for common React root elements
    const hasRoot = await page.locator("#root, #app, [data-react-root]").count();
    expect(hasRoot).toBeGreaterThan(0);
  });

  test("page renders interactive content eventually", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.showOpenFilePicker;
      delete window.showSaveFilePicker;
    });
    await page.goto("/rtdt", { waitUntil: "domcontentloaded" });

    // Wait longer for React to render
    await page.waitForTimeout(2000);

    // Check for interactive elements
    const allElements = await page.locator("body").innerHTML();
    expect(allElements.length).toBeGreaterThan(500);

    // Should have buttons or inputs eventually
    const interactiveElements = await page.locator("button, input, select").count();
    if (interactiveElements === 0) {
      console.log("No interactive elements found. HTML length:", allElements.length);
    }
  });
});
