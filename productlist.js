/* ---------- Konfiguration ---------- */
const API = "https://kea-alt-del.dk/t7/api/products?limit=200";
const IMG = (id) => `https://kea-alt-del.dk/t7/images/webp/640/${id}.webp`;

/* ---------- DOM ---------- */
const $filters = document.querySelector("#filters");
const $list = document.querySelector("#productlist") || document.querySelector("#productList");
const $title = document.querySelector("#listTitle") || document.querySelector("h1");

/* ---------- URL / State ---------- */
const url = new URL(location.href);
const qs = url.searchParams;

let ALL = [];
const state = {
  gender: qs.get("gender") || "all",
  brand: qs.get("brand") || "all",
  season: qs.get("season") || "all",
  category: qs.get("category") || "all", // kategori fra forsiden
};

/* ---------- Utils ---------- */
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
const kr = (n) => (typeof n === "number" ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n) : n);

const escapeHtml = (s = "") => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function getProp(p, type) {
  if (type === "brand") return p.brandname || p.brand;
  return p[type];
}

function match(p, type) {
  const f = state[type];
  if (!f || f === "all") return true;
  return getProp(p, type) === f;
}

function applyFilters() {
  return ALL.filter((p) => match(p, "gender") && match(p, "brand") && match(p, "season") && match(p, "category"));
}

function setURLFromState() {
  const url = new URL(location.href);
  const qs = url.searchParams;

  Object.entries(state).forEach(([k, v]) => {
    if (!v || v === "all") qs.delete(k);
    else qs.set(k, v);
  });

  history.replaceState({}, "", url);
}

/* ---------- Render kort ---------- */
function card(p) {
  const price = p.price ?? p.mrp ?? p.list_price ?? 0;
  const hasDiscount = p.discount && Number(p.discount) > 0;
  const newPrice = hasDiscount ? Math.round(price * (1 - p.discount / 100)) : null;

  return `
    <li class="product-card ${p.soldout ? "is-soldout" : ""}">
      <a class="product-link" href="product.html?id=${p.id}">
        <div class="product-media" style="position:relative">
          ${p.soldout ? `<span class="badge soldout">Sold out</span>` : ""}
          ${hasDiscount ? `<span class="badge sale">Sale</span>` : ""}
          <img src="${IMG(p.id)}" alt="${escapeHtml(p.productdisplayname || p.name || "Produkt")}" loading="lazy">
        </div>

        <h3 class="product-title">${escapeHtml(p.productdisplayname || p.name || "Uden navn")}</h3>
        <p class="product-meta">${escapeHtml(p.brandname || p.brand)} · ${escapeHtml(p.category || "")}</p>

        <div class="price">
          ${hasDiscount ? `<span class="price-old">${kr(price)}</span><strong>${kr(newPrice)}</strong>` : `<strong>${kr(price)}</strong>`}
        </div>
      </a>
    </li>
  `;
}

function render(list) {
  if (!$list) return;
  if (!Array.isArray(list) || list.length === 0) {
    $list.innerHTML = `<li class="muted">Ingen produkter matcher filtrene.</li>`;
    return;
  }
  $list.innerHTML = list.map(card).join("");
}

/* ---------- Filter UI ---------- */
function chipsetHTML(type, label, values) {
  const chips = values
    .map(
      (v) => `
      <button class="chip ${state[type] === v ? "is-active" : ""}" data-type="${type}" data-value="${escapeHtml(v)}">
        ${escapeHtml(v)}
      </button>`
    )
    .join("");

  return `
    <div class="chipset" data-type="${type}">
      <span class="chip-label">${label}:</span>
      <button class="chip ${state[type] === "all" ? "is-active" : ""}" data-type="${type}" data-value="all">All</button>
      ${chips}
    </div>
  `;
}

function buildFilters(data) {
  if (!$filters) return;

  const genders = uniq(data.map((p) => getProp(p, "gender")));
  const brands = uniq(data.map((p) => getProp(p, "brand")));
  const seasons = uniq(data.map((p) => getProp(p, "season")));
  const categories = uniq(data.map((p) => getProp(p, "category")));

  $filters.innerHTML = chipsetHTML("gender", "Gender", genders) + chipsetHTML("brand", "Brand", brands) + chipsetHTML("season", "Season", seasons) + chipsetHTML("category", "Category", categories);

  // klik på chips
  $filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button.chip");
    if (!btn) return;

    const { type, value } = btn.dataset;
    state[type] = value;

    // Vis aktiv tilstand pr. chipset
    $filters.querySelectorAll(`.chipset[data-type="${type}"] .chip`).forEach((b) => b.classList.toggle("is-active", b === btn));

    setURLFromState();
    render(applyFilters());
  });

  // initial aktiv tilstand fra state
  ["gender", "brand", "season", "category"].forEach((type) => {
    $filters.querySelectorAll(`.chipset[data-type="${type}"] .chip`).forEach((b) => b.classList.toggle("is-active", b.dataset.value === state[type]));
  });
}

/* ---------- Init ---------- */
(async function init() {
  try {
    // Titel (fx “Products — Footwear”)
    if ($title) {
      $title.textContent = "Products" + (state.category !== "all" ? ` — ${state.category}` : "");
    }

    // Hent produkter
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    ALL = await res.json();

    buildFilters(ALL);
    render(applyFilters());
  } catch (err) {
    console.error(err);
    if ($list) {
      $list.innerHTML = `<li class="error-box">FEJL: ${escapeHtml(err.message || "Kunne ikke hente data")}</li>`;
    }
  }
})();
