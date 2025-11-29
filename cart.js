document.addEventListener("DOMContentLoaded", () => {
  const cartList = document.getElementById("cartList");
  const cartItemCount = document.getElementById("cartItemCount");
  const totalItemsEl = document.getElementById("totalItems");
  const totalAmountEl = document.getElementById("totalAmount");
  const checkoutBtn = document.getElementById("checkoutBtn");


  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let allProducts = JSON.parse(localStorage.getItem("allProducts")) || [];


  cart = cart.map(item => {
    return {
      id: item.id,
      name: item.name,
      image: item.image || "assets/images/default.png",
      price: Number(item.price) || 0,
      finalPrice: Number(item.finalPrice) || Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variantId: item.variantId || null,
      variantName: item.variantName || null,
      variantSize: item.variantSize || null
    };
  });


  function renderCart() {
    cartList.innerHTML = "";

    if (cart.length === 0) {
      cartList.innerHTML = `<p style="text-align:center;">Your cart is empty.</p>`;
      cartItemCount.textContent = "(0 items)";
      totalItemsEl.textContent = "Total Items: 0";
      totalAmountEl.textContent = "Total Amount: ৳0";
      return;
    }

    let totalItems = 0;
    let totalAmount = 0;

    // Group items by product id
    const grouped = {};
    cart.forEach((item) => {
      if (!grouped[item.id]) {
        grouped[item.id] = { ...item, variants: [] };
      }
      grouped[item.id].variants.push(item);
    });

    Object.values(grouped).forEach((group) => {
      // count total qty & price for this product
      let groupTotalQty = 0;
      let groupTotalPrice = 0;

      group.variants.forEach(v => {
        groupTotalQty += v.quantity;
        groupTotalPrice += v.finalPrice * v.quantity;
      });

      totalItems += groupTotalQty;
      totalAmount += groupTotalPrice;

      const div = document.createElement("div");
      div.classList.add("cart-item");

      // Create variant list HTML
      let variantsHtml = group.variants.map((variant, index) => `
           <div class="variant-row">
  <span class="variant-name">${variant.variantName || ""} ${variant.variantSize || ""}</span>

  <div class="qty-controls" data-id="${variant.id}" data-vid="${variant.variantId}">
    <button class="decrease">-</button>
    <span>${variant.quantity}</span>
    <button class="increase">+</button>
  </div>

  <span class="variant-price">৳${(variant.finalPrice * variant.quantity).toFixed(2)}</span>
  <button class="remove">Remove</button>
</div>

        `).join("");

      div.innerHTML = `
  <div class="cart-item-row">
    <img src="${group.image}" alt="${group.name}" />
    <h3 class="product-link" data-id="${group.id}" style="cursor:pointer; color:#e83a30;">
      ${group.name}
    </h3>
  </div>
  <div class="variant-list">
    ${variantsHtml}
  </div>
  <div class="cart-actions">
    <strong>Total for this product: ৳${groupTotalPrice.toFixed(2)}</strong>
    <button class="buy-now">Buy Now</button>
  </div>
`;


      // Redirect when clicking product name
      div.querySelector(".product-link").addEventListener("click", (e) => {
        const productId = e.target.getAttribute("data-id");
        window.location.href = `product.html?id=${productId}`;
      });


      // Attach events for each variant
      div.querySelectorAll(".variant-row").forEach((row, idx) => {
        const variant = group.variants[idx];

        row.querySelector(".remove").addEventListener("click", () => {
          cart = cart.filter(c => !(c.id === variant.id && c.variantId === variant.variantId));
          saveCart();
          renderCart();
        });

        row.querySelector(".increase").addEventListener("click", () => {
          variant.quantity += 1;
          saveCart();
          renderCart();
        });

        row.querySelector(".decrease").addEventListener("click", () => {
          if (variant.quantity > 1) {
            variant.quantity -= 1;
          } else {
            cart = cart.filter(c => !(c.id === variant.id && c.variantId === variant.variantId));
          }
          saveCart();
          renderCart();
        });
      });
      // Attach Buy Now handler for this product
      div.querySelector(".buy-now").addEventListener("click", () => {
        // Save ALL variants of this product as checkout items
        localStorage.setItem("checkoutItems", JSON.stringify(group.variants));
        window.location.href = "buynow.html";
      });

      // Outside Object.values(grouped).forEach(...)
      checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
          alert("Your cart is empty!");
          return;
        }
        localStorage.setItem("checkoutItems", JSON.stringify(cart));
        window.location.href = "buynow.html";
      });


      cartList.appendChild(div);
    });

    cartItemCount.textContent = `(${totalItems} items)`;
    totalItemsEl.textContent = `Total Items: ${totalItems}`;
    totalAmountEl.textContent = `Total Amount: ৳${totalAmount.toFixed(2)}`;
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  renderCart();
});


(function () {
  const htmlEl = document.documentElement;
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const themeIconImg = document.getElementById('themeIconImg');

  const themes = {
    light: {
      '--bg-color': '#f4f1f1',
      '--text-color': 'black',
      '--header-bg': '#fdfefe'
    },
    dark: {
      '--bg-color': '#1b1818e4',
      '--text-color': 'white',
      '--header-bg': '#362f2f'
    }
  };

  // Load initial theme
  let currentTheme = localStorage.getItem('theme') || 'light';
  applyTheme(currentTheme);

  themeToggleIcon.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    console.log('Theme switched to', currentTheme);
  });

  function applyTheme(theme) {
    const vars = themes[theme];
    Object.keys(vars).forEach(key => {
      htmlEl.style.setProperty(key, vars[key]);
    });
    themeIconImg.src = theme === 'light' ? 'assets/icons/moon.png' : 'assets/icons/sun.png';
  }
})();
