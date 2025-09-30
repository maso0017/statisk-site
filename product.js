const API = "https://kea-alt-del.dk/t7/api";

(async function loadProduct() {
  const out = document.getElementById("productDetail");
  if (!out) return;

  const id = new URLSearchParams(location.search).get("id"); // krav: vis valgt produkt
  if (!id) {
    out.innerHTML = "<p class='error'>Mangler produkt-id i URL’en.</p>";
    return;
  }

  out.innerHTML = "<p>Henter produkt…</p>";

  try {
    const res = await fetch(`${API}/products/${id}`);
    const p = await res.json();

    const imgSrc = p.id ? `https://kea-alt-del.dk/t7/images/webp/1000/${p.id}.webp` : "";

    out.innerHTML = `
      <article class="product-detail-card">
        <div class="media">
          <img src="${imgSrc}" alt="${escapeHtml(p.productdisplayname || "")}" />
        </div>
        <div class="info">
          <h2>${escapeHtml(p.productdisplayname || "Product")}</h2>
          <p><strong>Brand:</strong> ${escapeHtml(p.brandname || "—")}</p>
          <p><strong>Category:</strong> ${escapeHtml(p.category || "—")}</p>
          <p><strong>Season:</strong> ${escapeHtml(p.season || "—")}</p>
          <p><strong>Price:</strong> ${formatPrice(p.price)} kr</p>
          ${p.soldout ? "<p class='soldout'>Sold out</p>" : "<button class='buy-btn' type='button'>Add to cart</button>"}
          <p class="desc">${escapeHtml(p.description || "No description available.")}</p>
        </div>
      </article>
    `;
  } catch (err) {
    console.error(err);
    out.innerHTML = "<p class='error'>Kunne ikke hente produktet.</p>";
  }
})();

function escapeHtml(str = "") {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function formatPrice(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(2).replace(".", ",");
}
