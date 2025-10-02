// product.js — REN VERSION m. hård rens af description

const API = "https://kea-alt-del.dk/t7/api";

// ---------- utils ----------
const kr = (n) => (typeof n === "number" && n >= 0 ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n) : "");

const get = (obj, key, fallback = "") => (obj && obj[key] != null && obj[key] !== "" ? obj[key] : fallback);

// Dekodér HTML-entiteter (&amp;nbsp; -> &nbsp;)
function decodeEntities(str = "") {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent || "";
}

// Escape (sikkerhed)
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}

/**
 * HÅRD rengøring af beskrivelse:
 * - fjerner tags (&nbsp;, <br>, div, p, ul/li, tabeller, osv.)
 * - splitter til linjer
 * - smider tomme/korte/junk-linjer væk (enkeltord, ingen mellemrum, ingen vokaler, URL'er)
 * - fjerner dubletter
 * - returnerer <p>…</p> blokke
 */
function cleanDescription(raw = "") {
  if (!raw) return `<p>Ingen beskrivelse.</p>`;

  // 1) Normalisér <br> til newline, strip alle tags
  let s = raw.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/g, "");

  // 2) Dekodér entiteter og normalisér mellemrum
  s = decodeEntities(s)
    .replace(/\u00A0|&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!s) return `<p>Ingen beskrivelse.</p>`;

  // 3) Split og filtrér junk
  const lines = s.split(/\r?\n+/);
  const keep = [];
  const seen = new Set();

  for (let line of lines) {
    line = line.trim().replace(/\s{2,}/g, " ");
    if (!line) continue;

    // Heuristikker mod vrøvl (fanger fx "asfafaf", "kasjhdkashd" m.m.)
    const hasLetters = /[A-Za-zÆØÅæøå]/.test(line);
    const hasVowel = /[AEIOUYÆØÅaeiouyæøå]/.test(line);
    const hasSpace = /\s/.test(line);
    const longEnough = line.length >= 12 || line.split(/\s+/).length >= 3;
    const notUrl = !/(https?:\/\/|www\.)/i.test(line);

    // Smid énkeltord og “vrøvl”-token-linjer væk
    if (!hasLetters || !hasVowel || !hasSpace || !longEnough || !notUrl) continue;

    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    keep.push(`<p>${escapeHtml(line)}</p>`);
  }

  return keep.length ? keep.join("") : `<p>Ingen beskrivelse.</p>`;
}

// ---------- render ----------
document.addEventListener("DOMContentLoaded", async () => {
  const out = document.getElementById("productDetail");
  if (!out) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    out.innerHTML = `
      <p class="error">Mangler produkt-id i URL'en.</p>
      <p><a class="backlink" href="productlist.html">Til produktlisten</a></p>`;
    return;
  }

  out.textContent = "Henter produkt…";

  try {
    const res = await fetch(`${API}/products/${id}`);
    if (!res.ok) throw new Error("Kunne ikke hente data");
    const p = await res.json();

    const img = `https://kea-alt-del.dk/t7/images/webp/1000/${p.id}.webp`;
    const title = get(p, "productdisplayname", get(p, "name", "Produkt"));
    const brand = get(p, "brandname", get(p, "brand", "Uden brand"));
    const gender = get(p, "gender", "");
    const category = get(p, "category", "");
    const season = get(p, "season", "");

    // pris
    const basePrice = Number(get(p, "price", get(p, "mrp", get(p, "list_price", 0))));
    const discount = Number(get(p, "discount", 0));
    const hasDiscount = discount > 0;
    const newPrice = hasDiscount ? Math.round(basePrice * (1 - discount / 100)) : null;

    const descHTML = cleanDescription(get(p, "description", ""));

    out.innerHTML = `
      <article class="product-detail-card">
        <div class="media">
          ${hasDiscount ? `<span class="badge sale">Sale</span>` : ""}
          ${p.soldout ? `<span class="badge soldout">Sold out</span>` : ""}
          <img src="${img}" alt="${escapeHtml(title)}" loading="eager" />
        </div>

        <div class="info">
          <h1 class="title">${escapeHtml(title)}</h1>

          <p class="brand"><strong>Brand:</strong> ${escapeHtml(brand)}</p>

          <p class="meta-line">
            ${category ? `<span><strong>Category:</strong> ${escapeHtml(category)}</span>` : ""}
            ${season ? `<span><strong>Season:</strong> ${escapeHtml(season)}</span>` : ""}
            ${gender ? `<span><strong>Gender:</strong> ${escapeHtml(gender)}</span>` : ""}
          </p>

          <div class="price">
            ${hasDiscount ? `<span class="price-old">${kr(basePrice)}</span> <strong>${kr(newPrice)}</strong>` : `<strong>${kr(basePrice)}</strong>`}
          </div>

          <div class="desc">${descHTML}</div>

          <div class="links">
            <a class="backlink" href="javascript:history.back()">← Tilbage</a>
            <a class="backlink" href="productlist.html">Alle produkter</a>
          </div>
        </div>
      </article>
    `;
  } catch (err) {
    out.innerHTML = `
      <p class="error">FEJL: ${escapeHtml(err.message || "Ukendt fejl")}.</p>
      <p><a class="backlink" href="productlist.html">Til produktlisten</a></p>`;
  }
});
