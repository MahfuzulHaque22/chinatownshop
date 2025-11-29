
document.addEventListener("DOMContentLoaded", () => {

  // all your current code here
  const subDrawerCloseBtn = document.getElementById("subDrawerClose");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const openCategoryDrawerBtn = document.getElementById("openCategoryDrawer");
  // const closeCategoryDrawerBtn = document.getElementById("closeCategoryDrawer");
  const mainOverlay = document.getElementById("overlay");      // for category drawer
  const userOverlay = document.getElementById("drawerOverlay"); // for user drawer
  const subDrawer = document.getElementById("subCategoryDrawer");
  const userDrawer = document.getElementById("userDrawer");
  const drawerCloseBtn = document.getElementById("drawerClose");
  const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
  const sheetName = "Sheet1"; // Change to your actual sheet tab name
  const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";
  const sheetAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
  const productGrid = document.getElementById("productGrid");
  const params = new URLSearchParams(window.location.search);
  const selectedCategory = params.get("category");
  const selectedSub = params.get("sub_category");
  const searchInputs = [
    document.getElementById("searchInputDesktop"),
    document.getElementById("searchInputMobile")
  ];
  const spinner = document.getElementById("loadingSpinner");
  const userText = document.getElementById("userText");

  let allProducts = [];
  let categoryMap = {};

  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");


  const drawerContent = document.getElementById("drawerContent");
  const drawerBack = document.getElementById("drawerBack");
  const drawerTitle = document.getElementById("drawerTitle");





  // Dummy user login state
  // const user = JSON.parse(localStorage.getItem("user") || "{}");
  // userText.textContent = user.name || "Login / Sign Up";



  const categoryIcons = {
    Bag: "assets/icons/bag.png",
    Jewellery: "assets/icons/jewlery.png",
    Shoe: "assets/icons/shoe.png",
    Toys: "assets/icons/toys.png",
    Baby: "assets/icons/baby.png",
    Beauty: "assets/icons/beauty.png",
    Daily: "assets/icons/daily.png",
    Decoration: "assets/icons/decoration.png",
    Electronics: "assets/icons/electronic.png",
    Eyeware: "assets/icons/eyeware.png",
    Households: "assets/icons/households.png",
    Kitchen: "assets/icons/kitchen.png",
    Seasonal: "assets/icons/seasonal.png",
    Stationary: "assets/icons/stationary.png",
    default: "assets/icons/categories.png"
  };


  updateCounts();



  // Fetch and render
  showSpinner();



  // function filterProducts(products) {
  //   return products.filter(p => {
  //     const catOK = selectedCategory ? p.category?.toLowerCase() === selectedCategory.toLowerCase() : true;
  //     const subOK = selectedSub ? p.sub_category?.toLowerCase() === selectedSub.toLowerCase() : true;
  //     return catOK && subOK;
  //   });
  // }

  function filterProducts(products) {
    return products.filter(p => {
      const catOK =
        selectedCategory
          ? (p.category?.trim().toLowerCase() === selectedCategory.toLowerCase())
          : true;

      const subOK =
        selectedSub
          ? (p.sub_category?.trim().toLowerCase() === selectedSub.toLowerCase())
          : true;

      return catOK && subOK;
    });
  }


  function renderProducts(products, reset = false) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    if (reset) {
      grid.innerHTML = "";
      displayedCount = 0;
    }

    // const toRender = products; // just render all
    const toRender = products.slice(displayedCount, displayedCount + productsToShow);



    toRender.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      const isFav = favs.includes(p.id);
      let priceHTML;
      const price = Number(p.current_price);
      const discount = Number(p.discount_price);

      if (discount && discount < price) {
        priceHTML = `<s>৳${price}</s><strong>৳${discount}</strong>`;
      } else {
        priceHTML = `<strong>৳${price}</strong>`;
      }


      card.innerHTML = `
  <div class="image-wrapper">
    <img src="${p.image}" alt="${p.name}" loading="lazy" />
    <button class="add-cart-btn" data-id="${p.id}">
      <lord-icon src="https://cdn.lordicon.com/ggirntso.json" trigger="hover"
          colors="primary:#e83a30,secondary:#e83a30" style="width: 20px;
    height: 20px;">
        </lord-icon>
    </button>
    <span class="heart-btn ${isFav ? "fav" : ""}" data-id="${p.id}">
      <lord-icon
    src="https://cdn.lordicon.com/nvsfzbop.json"
    trigger="morph"
    state="morph-slider"
    colors="primary:#c71f16,secondary:#e83a30"
    style="width:20px;height:20px">
</lord-icon>
    </span>
  </div>
  <h3>${p.name}</h3>
  <div class="price-row">${priceHTML}</div>
`;



      // Click to view product
      card.addEventListener("click", e => {
        if (!e.target.closest(".heart-btn") && !e.target.closest("button")) {
          window.location.href = `product.html?id=${p.id}`;
        }
      });

      // Favorite
      card.querySelector(".heart-btn").addEventListener("click", e => {
        e.stopPropagation();
        toggleFavorite(p.id);
      });

      // Add to Cart
      card.querySelector(".add-cart-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");
        addToCart(id);
      });
      grid.appendChild(card);
    });

    displayedCount += toRender.length;
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      const hasMore = displayedCount < products.length;
      loadMoreBtn.style.display = hasMore ? "block" : "none";
    }

  }

  let currentProducts = []; // To track filtered or searched products


  let debounceTimer;
  searchInputs.forEach(input => {
    input.addEventListener("input", e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => p.name?.toLowerCase().includes(query));
        currentProducts = filtered; // ← this is the missing part
        renderProducts(currentProducts, true);
      }, 300);
    });
  });



  function toggleFavorite(id) {
    favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem("favorites", JSON.stringify(favs));
    updateCounts();
    renderProducts(currentProducts, true); // ← Use current view, not allProducts

  }

  function addToCart(id) {
    const product = allProducts.find(p => p.id == id);
    if (!product) return alert("Product not found!");

    const existingItem = cart.find(item => item.id == id);
    const currentPrice = Number(product.current_price) || 0;
    const discountedPrice = Number(product.discount_price) || currentPrice;

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: currentPrice,
        finalPrice: discountedPrice, // store final price directly
        image: product.image,
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCounts();
    alert("Added to cart!");
  }




  function updateCounts() {
    const cartCountEl = document.getElementById("cartCount");
    const favCountEl = document.getElementById("favCount");

    const totalCartQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (totalCartQty > 0) {
      cartCountEl.textContent = totalCartQty;
      cartCountEl.classList.remove("hide");
    } else {
      cartCountEl.classList.add("hide");
    }

    if (favs.length > 0) {
      favCountEl.textContent = favs.length;
      favCountEl.classList.remove("hide");
    } else {
      favCountEl.classList.add("hide");
    }
  }



  function showSpinner() {
    spinner.style.display = "block";
  }
  function hideSpinner() {
    spinner.style.display = "none";
  }


  function loadCartAndFavs() {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");

      // 🔒 Validate cart format
      cart = storedCart.map(item => {
        if (typeof item === "string") {
          return { id: item, quantity: 1 };
        }
        return item;
      });

      favs = storedFavs;
    } catch (e) {
      cart = [];
      favs = [];
    }

    updateCounts();
  }



  const htmlEl = document.documentElement;
  const themeToggleIcon = document.getElementById("themeToggleIcon");
  const themeIconImg = document.getElementById("themeIconImg");

  // Load saved theme or default to light
  function loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    htmlEl.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  // Update the theme icon image
  function updateThemeIcon(theme) {
    themeIconImg.src = theme === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
    themeIconImg.alt = theme === "dark" ? "Light Mode" : "Dark Mode";
  }

  // Toggle theme and save it
  themeToggleIcon.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    htmlEl.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });

  // Initialize theme on page load
  loadSavedTheme();




  let displayedCount = 0;
  let productsToShow = 50;

  // Category list (from products)
  function extractCategories(products) {
    const categories = new Set();
    products.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }

  function renderCategories(categories) {
    const categoryGrid = document.getElementById("categoryGrid");
    categoryGrid.innerHTML = "";
    categories.forEach(cat => {
      const div = document.createElement("div");
      div.className = "category-item";
      div.textContent = cat;
      div.addEventListener("click", () => {
        window.location.href = `?category=${encodeURIComponent(cat)}`;
      });
      categoryGrid.appendChild(div);
    });
  }






  // Helper: convert sheet rows array to array of objects using header row
  function parseSheetData(values) {
    const [header, ...rows] = values;
    return rows.map(row => {
      const obj = {};
      header.forEach((key, i) => {
        obj[key] = row[i] || "";
      });
      return obj;
    });
  }

  // On Load
  showSpinner();
  const allSheetsAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=true&key=${apiKey}`;

  fetch(allSheetsAPI)
    .then(res => res.json())
    .then(data => {
      if (!data.sheets) throw new Error("No sheets found");

      let mergedProducts = [];

      // --- MERGE ALL SHEETS FIRST ---
      data.sheets.forEach(sheet => {
        const grid = sheet.data?.[0]?.rowData || [];
        if (!grid.length) return;

        const headers = (grid[0].values || []).map(v => v.formattedValue || "");
        const rows = grid.slice(1);

        rows.forEach(row => {
          const obj = {};
          let hasData = false;

          (row.values || []).forEach((cell, i) => {
            const val = cell.formattedValue || "";
            if (val.trim() !== "") hasData = true;
            obj[headers[i]] = val;
          });

          if (hasData) mergedProducts.push(obj);
        });

      });

      // --- NOW FILTER ONLY ONLINE PRODUCTS (ONCE) ---
      mergedProducts = mergedProducts.filter(p =>
        (p.status || "").toLowerCase().trim() === "online"
      );

      // --- CONTINUE NORMAL WORKFLOW ---
      allProducts = shuffleArray(filterProducts(mergedProducts));
      currentProducts = [...allProducts];
      categoryMap = buildCategoryMap(mergedProducts);

      localStorage.setItem("allProducts", JSON.stringify(allProducts));

      renderDesktopCategoryGrid();
      renderProducts(currentProducts, true);
      showMainCategories();
    })
    .catch(err => {
      console.error(err);
      productGrid.innerHTML = "<p style='text-align:center;'>Failed to load products. Please try again later.</p>";
    })
    .finally(hideSpinner);




  function resetInfiniteScroll() {
    displayedCount = 0;
    observer.disconnect();
    observer.observe(document.getElementById("loadMoreBtn"));
  }




  function shuffleArray(array) {
    return array.map(a => [Math.random(), a]).sort().map(a => a[1]);
  }


  function buildCategoryMap(products) {
    const map = {};
    products.forEach(p => {
      if (p.category) {
        if (!map[p.category]) {
          map[p.category] = [];
        }
        map[p.category].push(p); // ✅ Store full product objects
      }
    });
    return map;
  }





  function renderDesktopCategoryGrid() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    Object.keys(categoryMap).forEach(cat => {
      const tile = document.createElement("div");
      tile.className = "category-tile";

      // Add category icon + title
      const iconSrc = categoryIcons[cat] || categoryIcons.default;

      tile.innerHTML = `
  <img src="${iconSrc}" alt="${cat}" style="width:40px;height:40px;margin-bottom:5px;" />
  <div>${cat}</div>
`;


      tile.addEventListener("click", () => {
        showDesktopSubcategories(cat);
      });

      grid.appendChild(tile);
    });
  }


  showMainCategories(); // Populate mobile drawer


  function showDesktopSubcategories(categoryName) {
    const drawer = document.getElementById("subCategoryDrawer");
    const title = document.getElementById("subDrawerTitle");
    const content = document.getElementById("subDrawerContent");

    if (!drawer || !title || !content) return;

    const productsInCategory = categoryMap[categoryName] || [];

    const subcategorySet = new Set();
    productsInCategory.forEach(product => {
      if (product.sub_category) {
        subcategorySet.add(product.sub_category);
      }
    });



    const subcategories = Array.from(subcategorySet);
    content.innerHTML = "";

    if (subcategories.length === 0) {
      content.innerHTML = "<p style='padding:10px;'>No subcategories found.</p>";
    } else {
      subcategories.forEach(sub => {
        const item = document.createElement("div");
        item.className = "subcategory-item";
        item.textContent = sub;
        item.addEventListener("click", () => {
          const filtered = allProducts.filter(p =>
            p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase() &&
            p.sub_category?.trim().toLowerCase() === sub.trim().toLowerCase()
          );

          currentProducts = filtered;
          renderProducts(currentProducts, true);

          currentProducts = filtered;   // <-- must update currentProducts
          renderProducts(currentProducts, true);
          drawer.classList.add("hidden");
        });
        content.appendChild(item);
      });

    }

    title.textContent = categoryName;
    drawer.classList.remove("hidden");
  }


  if (subDrawerCloseBtn) {
    subDrawerCloseBtn.addEventListener("click", () => {
      subDrawer.classList.add("hidden");
    });
  }





  // drawer

  const categoryDrawer = document.getElementById("categoryDrawer");
  const overlay = document.getElementById("overlay");

  // openCategoryDrawerBtn.addEventListener("click", () => {
  //   categoryDrawer.classList.add("active"); // Show drawer
  //   overlay.classList.remove("hidden");      // Show overlay
  // });

  // overlay.addEventListener("click", () => {
  //   categoryDrawer.classList.remove("active"); // Hide drawer
  //   overlay.classList.add("hidden");           // Hide overlay
  // });

  // Close button inside drawer

  drawerCloseBtn.addEventListener("click", () => {
    categoryDrawer.classList.remove("active");
    overlay.classList.add("hidden");
  });


  drawerBack.addEventListener("click", () => {
    showMainCategories();
    drawerBack.classList.add("hidden");
    drawerTitle.textContent = "Categories";
  });

  function showMainCategories() {
    drawerContent.innerHTML = "";

    // Add a wrapper for grid
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr 1fr";
    grid.style.gap = "10px";

    Object.keys(categoryMap).forEach(cat => {
      const div = document.createElement("div");
      div.className = "mobile-category-tile";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
      div.style.padding = "10px";


      div.style.cursor = "pointer";

      const icon = document.createElement("img");
      icon.src = categoryIcons[cat] || categoryIcons.default;
      icon.alt = cat;
      icon.style.width = "32px";
      icon.style.height = "32px";
      icon.style.marginBottom = "5px";

      const label = document.createElement("div");
      label.textContent = cat;
      label.style.fontSize = "14px";
      label.style.textAlign = "center";

      div.appendChild(icon);
      div.appendChild(label);

      div.addEventListener("click", () => {
        showSubcategories(cat);
      });

      grid.appendChild(div);
    });

    drawerContent.appendChild(grid);
  }


  function showSubcategories(mainCategory) {
    const subCats = new Set();
    const items = categoryMap[mainCategory] || [];

    items.forEach(item => {
      if (item.sub_category) {
        subCats.add(item.sub_category);
      }
    });

    drawerContent.innerHTML = "";
    Array.from(subCats).forEach(sub => {
      const div = document.createElement("div");
      div.textContent = sub;
      div.addEventListener("click", () => {
        const filtered = allProducts.filter(p =>
          p.category?.trim().toLowerCase() === categoryName.trim().toLowerCase() &&
          p.sub_category?.trim().toLowerCase() === sub.trim().toLowerCase()
        );

        currentProducts = filtered;
        renderProducts(currentProducts, true);

        currentProducts = filtered;
        renderProducts(currentProducts, true);

        categoryDrawer.classList.remove("active");
      });
      drawerContent.appendChild(div);
    });

    drawerBack.classList.remove("hidden");
    drawerTitle.textContent = mainCategory;
  }




  function openUserDrawer() {
    const user = JSON.parse(localStorage.getItem("user")) || {
      name: "Guest",
      email: "Email",
      photoURL: "assets/icons/user.png",
    };

    // Profile image
    const imgEl = document.getElementById("drawerProfileImg");
    if (imgEl) {
      imgEl.src = user.photoURL || "assets/icons/user.png";
    }

    // Name (span or input)
    const nameEl = document.getElementById("drawerName");
    if (nameEl) {
      if (nameEl.tagName === "INPUT") {
        nameEl.value = user.name || "Guest";
      } else {
        nameEl.innerText = user.name || "Guest";
      }
    }

    // Alternative editable input (drawerNameInput)
    const nameInputEl = document.getElementById("drawerNameInput");
    if (nameInputEl) {
      nameInputEl.value = user.name || "Guest";
    }

    // Email (span or input)
    const emailEl = document.getElementById("drawerEmail");
    if (emailEl) {
      if (emailEl.tagName === "INPUT") {
        emailEl.value = user.email || "Email";
      } else {
        emailEl.innerText = user.email || "Email";
      }
    }

    // Show drawer + overlay
    const drawer = document.getElementById("userDrawer");


    if (drawer) drawer.classList.add("open");
    if (userOverlay) userOverlay.classList.add("show");
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener("click", () => {
        categoryDrawer.classList.remove("active");
        overlay.classList.add("hidden");
      });
    }

  }



  // Load More Button

  // const productCards = document.querySelectorAll(".product-card");



  // ✅ Add this after renderProducts is defined
  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    renderProducts(currentProducts); // show next batch
  });










  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // load next batch if there are more
        if (displayedCount < currentProducts.length) {
          renderProducts(currentProducts);
        }
      }
    });
  }, { rootMargin: '200px' });

  observer.observe(document.getElementById('loadMoreBtn'));



  // Open drawer
  function openCategoryDrawer() {
    categoryDrawer.classList.add("active");   // show drawer
    mainOverlay.classList.add("active");      // show overlay
  }

  // Close drawer
  function closeCategoryDrawer() {
    categoryDrawer.classList.remove("active");
    mainOverlay.classList.remove("active");
  }

  // Event listeners
  openCategoryDrawerBtn.addEventListener("click", openCategoryDrawer);

  mainOverlay.addEventListener("click", closeCategoryDrawer);

  if (subDrawerCloseBtn) {
    subDrawerCloseBtn.addEventListener("click", () => {

      if (subDrawer) subDrawer.classList.add("hidden");
    });
  }


  document.addEventListener("DOMContentLoaded", () => {
    const userOverlay = document.getElementById("userOverlay");
    const userDrawer = document.getElementById("userDrawer");

    if (userOverlay && userDrawer) {
      userOverlay.addEventListener("click", () => {
        userDrawer.classList.remove("open");
        userOverlay.classList.remove("show");
      });
    }
  });





  function toggleFavorite(id) {
    favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    // Save favorites
    localStorage.setItem("favorites", JSON.stringify(favs));
    updateCounts();
    renderProducts(currentProducts, true);
  }


});






document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const loginPopup = document.getElementById("loginPopup");
  const userDrawer = document.getElementById("userDrawer");
  const userDrawerClose = document.getElementById("userDrawerClose");

  // called when icon clicked
  window.toggleLoginPopup = function () {
    if (window.auth && auth.currentUser) {
      // ✅ User logged in → open drawer
      userDrawer.classList.remove("hidden");
      overlay.classList.remove("hidden");
    } else {
      // ❌ Not logged in → show login popup
      loginPopup.classList.remove("hidden");
      overlay.classList.remove("hidden");
    }
  };

  window.closeLoginPopup = function () {
    loginPopup.classList.add("hidden");
    overlay.classList.add("hidden");
  };

  userDrawerClose?.addEventListener("click", () => {
    userDrawer.classList.add("hidden");
    overlay.classList.add("hidden");
  });

  // Overlay click closes whichever is open
  overlay.addEventListener("click", () => {
    loginPopup.classList.add("hidden");
    userDrawer.classList.add("hidden");
    // Category drawer uses its own close logic
  });
});







// // Example pseudo logic:
// const userLoggedIn = false; // replace with Firebase auth status

// document.getElementById('userArea').addEventListener('click', () => {
//   if (userLoggedIn) {
//     openUserDrawer();
//   } else {
//     toggleLoginPopup();
//   }
// });



// // LOGIN POPUP
// function toggleLoginPopup() {
//   document.getElementById('loginPopup').classList.toggle('active');
// }
// function closeLoginPopup() {
//   document.getElementById('loginPopup').classList.remove('active');
// }

// // USER DRAWER
// function openUserDrawer() {
//   document.getElementById('userDrawer').classList.add('open');
// }
// function closeUserDrawer() {
//   document.getElementById('userDrawer').classList.remove('open');
// }

// // OPTIONAL: Close popup if you click outside
// document.addEventListener('click', (e) => {
//   const popup = document.getElementById('loginPopup');
//   if (popup.classList.contains('active') && e.target === popup) {
//     popup.classList.remove('active');
//   }
// });






// if (window.auth) {
//   auth.onAuthStateChanged(user => {
//     if (user) {
//       console.log("✅ Logged in as:", user.email);
//       document.getElementById("userText").textContent = user.displayName || "My Account";
//     } else {
//       console.log("❌ Not logged in");
//       document.getElementById("userText").textContent = "Login / Sign Up";
//     }
//   });
// }
