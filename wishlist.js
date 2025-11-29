document.addEventListener("DOMContentLoaded", () => {
  const wishlistGrid = document.getElementById("wishlistGrid");

  const favs = JSON.parse(localStorage.getItem("favorites") || "[]").map(String);
  const allProducts = JSON.parse(localStorage.getItem("allProducts") || "[]");

  let products = allProducts.filter(p => favs.includes(String(p.id)));

  if (products.length === 0) {
    wishlistGrid.innerHTML = "<p>Your wishlist is empty ❤️</p>";
    return;
  }

  // ✅ Build wishlist rows
  function renderWishlist() {
    products = allProducts.filter(p => favs.includes(String(p.id)));

    if (products.length === 0) {
      wishlistGrid.innerHTML = "<p>Your wishlist is empty ❤️</p>";
      return;
    }

    wishlistGrid.innerHTML = `
      <div class="wishlist-header">
        <div>Image</div>
        <div>Name</div>
        <div>Price</div>
        <div>Action</div>
      </div>
      ${products.map(p => `
        <div class="wishlist-row" data-id="${p.id}">
          <div class="wishlist-col image-col">
            <img src="${p.image}" alt="${p.name}" />
          </div>
          <div class="wishlist-col name-col">${p.name}</div>
          <div class="wishlist-col price-col">৳${p.current_price}</div>
          <div class="wishlist-col action-col">
            <button class="remove-btn" data-id="${p.id}">Remove</button>
          </div>
        </div>
      `).join("")}
    `;

    // ✅ Remove from wishlist handler
    wishlistGrid.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation(); // prevent row navigation
        const id = String(btn.getAttribute("data-id"));

        // remove from favs
        const updatedFavs = favs.filter(fid => fid !== id);
        localStorage.setItem("favorites", JSON.stringify(updatedFavs));

        // re-render UI
        location.reload();
      });
    });

    // ✅ Row click -> product details
    wishlistGrid.querySelectorAll(".wishlist-row").forEach(row => {
      row.addEventListener("click", e => {
        if (e.target.closest("button")) return; // ignore clicks on buttons
        const id = row.getAttribute("data-id");
        window.location.href = `product.html?id=${id}`;
      });
    });
  }

  renderWishlist();
});
