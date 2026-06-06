import { expect, test } from "@playwright/test";

test("public pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /галерея/i })).toBeVisible();

  await page.goto("/gallery");
  await expect(page.getByRole("heading", { name: /галерея/i })).toBeVisible();

  await page.goto("/about");
  await expect(page.locator("main")).toBeVisible();

  await page.goto("/contacts");
  await expect(page.locator("main")).toBeVisible();
});

test("admin login page renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
});
