import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("homepage renders the approved design", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /indoor golf\.\s*real connections\./i }),
    ).toBeVisible();
    await expect(page.getByText(/linton, indiana/i).first()).toBeVisible();
    // Value pillars
    await expect(page.getByRole("heading", { name: "Play", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Connect", exact: true }),
    ).toBeVisible();
    // Gallery + signup band
    await expect(
      page.getByRole("heading", { name: /where golf brings people together/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /photo gallery/i }),
    ).toBeVisible();
  });

  test("navigation reaches leagues", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: /main navigation/i })
      .getByRole("link", { name: "Leagues" })
      .click();
    await expect(
      page.getByRole("heading", { name: /find your league/i }),
    ).toBeVisible();
  });

  test("menu page filters by search", async ({ page }) => {
    await page.goto("/menu");
    await expect(
      page.getByRole("heading", { name: /clubhouse pretzel bites/i }),
    ).toBeVisible();
    await page.getByRole("searchbox", { name: /search the menu/i }).fill("nachos");
    await expect(
      page.getByRole("heading", { name: /loaded bunker nachos/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /clubhouse pretzel bites/i }),
    ).toBeHidden();
  });

  test("league detail page shows registration state", async ({ page }) => {
    await page.goto("/leagues/mens-winter-league");
    await expect(
      page.getByRole("heading", { name: /men's winter league/i }),
    ).toBeVisible();
    await expect(page.getByText(/interest list/i).first()).toBeVisible();
  });

  test("booking page shows the booking flow when reservations are open", async ({
    page,
  }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: /book a bay/i })).toBeVisible();
  });

  test("opening list form validates email", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#opening-list");
    await section.scrollIntoViewIfNeeded();
    await section.getByLabel(/email address/i).fill("not-an-email");
    await section.getByRole("button", { name: /join the list/i }).click();
    await expect(section.getByRole("alert").first()).toBeVisible();
  });

  test("404 page offers a way home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });
});

test.describe("accessibility basics", () => {
  test("skip link focuses main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip to main content/i })).toBeFocused();
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
