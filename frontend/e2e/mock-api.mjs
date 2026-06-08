import http from "node:http";

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

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1:18080");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/v1/artist") {
    sendJSON(res, 200, artist);
    return;
  }

  if (url.pathname === "/api/v1/categories") {
    sendJSON(res, 200, categories);
    return;
  }

  if (url.pathname === "/api/v1/artworks") {
    const categoryID = url.searchParams.get("category_id");
    const result = categoryID
      ? artworks.filter((artwork) => String(artwork.category_id) === categoryID)
      : artworks;
    sendJSON(res, 200, result);
    return;
  }

  if (url.pathname === "/api/v1/artworks/1") {
    sendJSON(res, 200, artworks[0]);
    return;
  }

  if (url.pathname === "/api/v1/orders" && req.method === "POST") {
    sendJSON(res, 201, { id: 1, status: "new" });
    return;
  }

  sendJSON(res, 404, { error: "not found" });
});

server.listen(18080, "127.0.0.1", () => {
  console.log("Mock API listening on http://127.0.0.1:18080");
});
