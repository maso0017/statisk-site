const API = "https://kea-alt-del.dk/t7/api";

(async function loadProducts() {
  const listEl = document.getElementById("productlist");
  const titleEl = document.getElementById("listTitle");
  if (!listEl) return;

  const params = new URLSearchParams(location.search);
  const category = params.get("category"); // krav: filter på valgt kategori
  const season = params.get("season"); // valgfrit – hvis du bruger den i menuen

  // Byg API-url ud fra URL-parametre
  const url = new URL(`${API}/products/`);
  if (category) url.searchParams.set("category", category);
  if (season && season !== "all") url.searchParams.set("season", season);

  // Titel
  titleEl.textContent = category ? `Products – ${toTitle(category)}` : "Products";

  listEl.innerHTML = "<p>Henter produkter…</p>";

  try {
    const res = await fetch(url);
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      listEl.innerHTML = "<p>Ingen produkter fundet.</p>";
      return;
    }

    listEl.innerHTML = "";
    const frag = document.createDocumentFragment();

    products.forEach((p) => {
      const art = document.createElement("article");
      art.className = "product-card";

      const imgSrc = p.id ? `https://kea-alt-del.dk/t7/images/webp/640/${p.id}.webp` : "";

      art.innerHTML = `
        <a class="image-wrap" href="product.html?id=${p.id}">
          <img loading="lazy" src="${imgSrc}" alt="${escapeHtml(p.productdisplayname || "")}" />
        </a>
        <div class="meta">
          <h3 class="name">
            <a href="product.html?id=${p.id}">${escapeHtml(p.productdisplayname || "Product")}</a>
          </h3>
          <p class="brand">${escapeHtml(p.brandname || "")}</p>
          <p class="price">${formatPrice(p.price)} kr</p>
          ${p.soldout ? "<p class='soldout'>Sold out</p>" : ""}
        </div>
      `;
      frag.appendChild(art);
    });

    listEl.appendChild(frag);
  } catch (err) {
    console.error(err);
    listEl.innerHTML = "<p class='error'>Kunne ikke hente produkter.</p>";
  }
})();

function toTitle(str = "") {
  return String(str)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
function escapeHtml(str = "") {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function formatPrice(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(2).replace(".", ",");
}
