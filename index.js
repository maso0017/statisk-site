const CATEGORIES = ["Accessories", "Apparel", "Footwear", "Free Items", "Personal Care", "Sporting Goods"];

const $grid = document.getElementById("categoriesGrid");
$grid.innerHTML = CATEGORIES.map((cat) => {
  const href = `productlist.html?category=${encodeURIComponent(cat)}`;
  return `<a class="category-tile" href="${href}">${cat}</a>`;
}).join("");
