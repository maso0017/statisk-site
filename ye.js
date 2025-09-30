document.addEventListener("DOMContentLoaded", () => {
  // Kør kun hvis produktliste-containeren findes
  if (document.getElementById("productList")) loadProducts();
});

// Hent og vis ALLE produkter (ingen limit)
async function loadProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  // Valgfri filtre via URL (f.eks. ?category=Apparel&brand=Nike)
  const params = new URLSearchParams(location.search);
  const category = params.get("category");
  const brand = params.get("brand");
  const season = params.get("season");

  const url = new URL(`${API}/products/`);
  if (category) url.searchParams.set("category", category);
  if (brand) url.searchParams.set("brandname", brand);
  if (season && season !== "all") url.searchParams.set("season", season);

  try {
    const res = await fetch(url);
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      list.innerHTML = `<p>Ingen produkter fundet.</p>`;
      return;
    }

    products.forEach((p) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const imgSrc = p.id ? `https://kea-alt-del.dk/t7/images/webp/640/${p.id}.webp` : "";

      card.innerHTML = `
        <a class="image-wrap" href="product.html?id=${p.id}">
          <img loading="lazy" src="${imgSrc}" alt="${escapeHtml(p.productdisplayname || "")}" />
        </a>
        <div class="meta">
          <h3 class="name">
            <a href="product.html?id=${p.id}">${escapeHtml(p.productdisplayname || "Unnamed product")}</a>
          </h3>
          <p class="brand">${escapeHtml(p.brandname || "")}</p>
          <p class="price">${formatPrice(p.price)} kr</p>
        </div>
      `;

      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p class="error">Kunne ikke hente produkter.</p>`;
    console.error(err);
  }
}

// Helpers
function escapeHtml(str = "") {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function formatPrice(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(2).replace(".", ",");
}
