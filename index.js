const API = "https://kea-alt-del.dk/t7/api";

// Hent kategorier og lav links til productlist.html?category=...
(async function loadCategories() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Henter kategorier…</p>";

  try {
    const res = await fetch(`${API}/categories`);
    const categories = await res.json();

    grid.innerHTML = "";
    categories.forEach((cat) => {
      const a = document.createElement("a");
      a.className = "category-tile";
      a.href = `productlist.html?category=${encodeURIComponent(cat.category)}`;
      a.textContent = toTitle(cat.category);
      grid.appendChild(a);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="error">Kunne ikke hente kategorier.</p>`;
  }
})();

function toTitle(str = "") {
  return String(str)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
