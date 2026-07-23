import { expect, test } from "@playwright/test";

/**
 * Auth flows against the degraded (no-Supabase) preview environment.
 * With Supabase configured, these same flows exercise real signup.
 */
test.describe("authentication pages", () => {
  test("login page renders and validates", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("signup validates password strength", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel(/first name/i).fill("Test");
    await page.getByLabel(/last name/i).fill("Golfer");
    await page.getByLabel(/^email$/i).fill("test@example.com");
    await page.getByLabel(/^password$/i).fill("short");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/at least 10 characters/i).first()).toBeVisible();
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /forgot your password/i }),
    ).toBeVisible();
  });

  test("account area requires configuration or sign-in", async ({ page }) => {
    await page.goto("/account");
    // Degraded mode: explanatory notice; configured mode: login redirect.
    await expect(
      page
        .getByText(/accounts not connected/i)
        .or(page.getByRole("heading", { name: /welcome back/i })),
    ).toBeVisible();
  });
});
