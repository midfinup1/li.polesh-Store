import { expect, test } from "@playwright/test";

const artist = {
  id: 1,
  name: "Елизавета Полещенко",
  name_en: "Elizaveta Poleshchenko",
  bio: "Artist statement RU",
  bio_en: "Artist statement EN",
  photo_url: "",
  home_photo_url: "",
  about_photo_url: "",
  email: "lis.polesh@gmail.com",
  instagram: "li.polesh",
};

const categories = [
  { id: 1, name: "картины", name_en: "paintings", slug: "paintings", sort_order: 0 },
  { id: 2, name: "постеры", name_en: "posters", slug: "posters", sort_order: 1 },
];

const artworks = [
  {
    id: 1,
    title: "Своё место",
    title_en: "Own Place",
    description: "Описание работы",
    description_en: "Artwork description",
    price: 39000,
    status: "available",
    category_id: 1,
    year: 2025,
    size: "40×50",
    size_en: "40×50",
    materials: "холст на подрамнике",
    materials_en: "canvas on stretcher",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    images: [],
  },
  {
    id: 2,
    title: "Постер",
    title_en: "Poster",
    description: "Описание постера",
    description_en: "Poster description",
    price: null,
    status: "available",
    category_id: 2,
    year: 2026,
    size: "30×40",
    size_en: "30×40",
    materials: "бумага",
    materials_en: "paper",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    images: [],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/artist", async (route) => {
    await route.fulfill({ json: artist });
  });

  await page.route("**/api/v1/categories", async (route) => {
    await route.fulfill({ json: categories });
  });

  await page.route("**/api/v1/artworks", async (route) => {
    const url = new URL(route.request().url());
    const categoryID = url.searchParams.get("category_id");
    const result = categoryID
      ? artworks.filter((artwork) => String(artwork.category_id) === categoryID)
      : artworks;

    await route.fulfill({ json: result });
  });

  await page.route("**/api/v1/artworks/1", async (route) => {
    await route.fulfill({ json: artworks[0] });
  });

  await page.route("**/api/v1/orders", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 201, json: { id: 1, status: "new" } });
      return;
    }

    await route.fallback();
  });


  await page.route("**/api/v1/analytics/view", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fallback();
  });
});

test("главная открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /artist statement/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /каталог/i })).toBeVisible();
});

test("категории кликаются", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /постеры/i }).click();
  await expect(page.getByText("Постер")).toBeVisible();
});

test("карточка открывается", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /своё место/i }).click();
  await expect(page).toHaveURL(/\/artwork\/1/);
  await expect(page.getByRole("heading", { name: /своё место/i })).toBeVisible();
});

test("форма заявки работает", async ({ page }) => {
  await page.goto("/artwork/1");
  await page.getByRole("button", { name: /забронировать/i }).click();
  await page.getByPlaceholder("Ваше имя").fill("Тест");
  await page.getByPlaceholder("Укажите желаемый способ связи").fill("@test");
  await page.getByPlaceholder("Комментарий").fill("Хочу работу");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /оставить заявку/i }).click();
  await expect(page.getByText(/заявка отправлена/i)).toBeVisible();
});
