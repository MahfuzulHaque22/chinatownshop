
// document.addEventListener("DOMContentLoaded", () => {

//     // all your current code here
//     const subDrawerCloseBtn = document.getElementById("subDrawerClose");
//     const loadMoreBtn = document.getElementById("loadMoreBtn");
//     const openCategoryDrawerBtn = document.getElementById("openCategoryDrawer");
//     // const closeCategoryDrawerBtn = document.getElementById("closeCategoryDrawer");
//     const mainOverlay = document.getElementById("overlay");      // for category drawer
//     const userOverlay = document.getElementById("drawerOverlay"); // for user drawer
//     const subDrawer = document.getElementById("subCategoryDrawer");
//     const userDrawer = document.getElementById("userDrawer");
//     const drawerCloseBtn = document.getElementById("drawerClose");
//     const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
//     const sheetName = "Sheet1"; // Change to your actual sheet tab name
//     const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";
//     const sheetAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
//     const allSheetsAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=true&key=${apiKey}`;
//     const productGrid = document.getElementById("productGrid");
//     const params = new URLSearchParams(window.location.search);
//     const selectedCategory = params.get("category");
//     const selectedSub = params.get("sub_category");
//     const searchInputs = [
//         document.getElementById("searchInputDesktop"),
//         document.getElementById("searchInputMobile")
//     ];
//     const spinner = document.getElementById("loadingSpinner");
//     const userText = document.getElementById("userText");

//     let allProducts = [];
//     let categoryMap = {};

//     let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
//     let cart = JSON.parse(localStorage.getItem("cart") || "[]");


//     const drawerContent = document.getElementById("drawerContent");
//     const drawerBack = document.getElementById("drawerBack");
//     const drawerTitle = document.getElementById("drawerTitle");

//     const categoryIcons = {
//         Bag: "assets/icons/bag.png",
//         Jewellery: "assets/icons/jewlery.png",
//         Shoe: "assets/icons/shoe.png",
//         Toys: "assets/icons/toys.png",
//         Baby: "assets/icons/baby.png",
//         Beauty: "assets/icons/beauty.png",
//         Daily: "assets/icons/daily.png",
//         Decoration: "assets/icons/decoration.png",
//         Electronics: "assets/icons/electronic.png",
//         Eyeware: "assets/icons/eyeware.png",
//         Households: "assets/icons/households.png",
//         Kitchen: "assets/icons/kitchen.png",
//         Seasonal: "assets/icons/seasonal.png",
//         Stationary: "assets/icons/stationary.png",
//         default: "assets/icons/categories.png"
//     };


//     updateCounts();

//     // Fetch and render
//     showSpinner();

//     function filterProducts(products) {
//         return products.filter(p => {
//             const catOK = selectedCategory ? p.category?.toLowerCase() === selectedCategory.toLowerCase() : true;
//             const subOK = selectedSub ? p.sub_category?.toLowerCase() === selectedSub.toLowerCase() : true;
//             return catOK && subOK;
//         });
//     }

//     const itemsPerPage = 500; // show 12 products each time

//     function renderProducts(products, append = false) {
//         const container = document.getElementById("productGrid");
//         if (!append) container.innerHTML = ""; // clear container if not appending

//         const nextProducts = products.slice(displayedCount, displayedCount + itemsPerPage);

//         nextProducts.forEach(product => {
//             if (product.wholesale_availabe?.toLowerCase() === "yes") {
//                 const card = document.createElement("div");
//                 card.className = "product-card";

//                 card.innerHTML = `
//                 <img src="${product.image || product.image_url}" alt="${product.name}" class="product-img" />
//                 <h3 class="product-name">${product.name}</h3>
//                 <div class="price-box">
//                     <span class="wholesale-price">৳${product.wholesale_price || "N/A"}</span>
//                     <span class="moq">MOQ: ${product.wholesale_moq || "-"}</span>
//                 </div>
//             `;

//                 card.addEventListener("click", () => {
//                     window.location.href = `wholesale_product.html?id=${encodeURIComponent(product.id)}`;
//                 });

//                 container.appendChild(card); // only once
//             }
//         });

//         displayedCount += nextProducts.length;

//         document.getElementById("loadMoreBtn").style.display =
//             displayedCount >= products.length ? "none" : "block";
//     }


//     // fetch(sheetAPI)
//     //     .then(res => res.json())
//     //     .then(data => {
//     //         const mergedProducts = parseSheetData(data.values);
//     //         allProducts = mergedProducts.filter(p => p.wholesale_availabe?.toLowerCase() === "yes");
//     //         currentProducts = [...allProducts];
//     //         categoryMap = buildCategoryMap(allProducts);

//     //         renderDesktopCategoryGrid(); // desktop
//     //         renderProducts(currentProducts, false); // first batch
//     //         showMainCategories(); // mobile drawer
//     //     })
//     //     .catch(err => console.error(err))
//     //     .finally(hideSpinner);




//     // Load More button
//     document.getElementById("loadMoreBtn").addEventListener("click", () => {
//         renderProducts(allProducts, true);
//     });



//     let currentProducts = []; // To track filtered or searched products


//     let debounceTimer;
//     searchInputs.forEach(input => {
//         input.addEventListener("input", e => {
//             clearTimeout(debounceTimer);
//             debounceTimer = setTimeout(() => {
//                 const query = e.target.value.toLowerCase();
//                 const filtered = allProducts.filter(p => p.name?.toLowerCase().includes(query));
//                 currentProducts = filtered;
//                 displayedCount = 0; // reset before rendering
//                 renderProducts(currentProducts, false);
//             }, 300);
//         });
//     });




//     function hideProductDetails() {
//         const detailDrawer = document.getElementById("productDetailDrawer");
//         if (detailDrawer) detailDrawer.classList.add("hidden");
//     }


//     function toggleFavorite(id) {
//         favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
//         localStorage.setItem("favorites", JSON.stringify(favs));
//         updateCounts();
//         renderProducts(currentProducts, true); // ← Use current view, not allProducts

//     }

//     function addToCart(id) {
//         const product = allProducts.find(p => p.id == id);
//         if (!product) return alert("Product not found!");

//         const existingItem = cart.find(item => item.id == id);
//         const currentPrice = Number(product.current_price) || 0;
//         const discountedPrice = Number(product.discount_price) || currentPrice;

//         if (existingItem) {
//             existingItem.quantity += 1;
//         } else {
//             cart.push({
//                 id: product.id,
//                 name: product.name,
//                 price: currentPrice,
//                 finalPrice: discountedPrice, // store final price directly
//                 image: product.image,
//                 quantity: 1
//             });
//         }

//         localStorage.setItem("cart", JSON.stringify(cart));
//         updateCounts();
//         alert("Added to cart!");
//     }

//     function updateCounts() {
//         const cartCountEl = document.getElementById("cartCount");
//         const favCountEl = document.getElementById("favCount");

//         const totalCartQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

//         if (totalCartQty > 0) {
//             cartCountEl.textContent = totalCartQty;
//             cartCountEl.classList.remove("hide");
//         } else {
//             cartCountEl.classList.add("hide");
//         }

//         if (favs.length > 0) {
//             favCountEl.textContent = favs.length;
//             favCountEl.classList.remove("hide");
//         } else {
//             favCountEl.classList.add("hide");
//         }
//     }



//     function showSpinner() {
//         spinner.style.display = "block";
//     }
//     function hideSpinner() {
//         spinner.style.display = "none";
//     }


//     function loadCartAndFavs() {
//         try {
//             const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
//             const favs = JSON.parse(localStorage.getItem("favorites") || "[]");

//             // 🔒 Validate cart format
//             cart = storedCart.map(item => {
//                 if (typeof item === "string") {
//                     return { id: item, quantity: 1 };
//                 }
//                 return item;
//             });

//             favs = storedFavs;
//         } catch (e) {
//             cart = [];
//             favs = [];
//         }

//         updateCounts();
//     }

//     const htmlEl = document.documentElement;
//     const themeToggleIcon = document.getElementById("themeToggleIcon");
//     const themeIconImg = document.getElementById("themeIconImg");

//     // Load saved theme or default to light
//     function loadSavedTheme() {
//         const savedTheme = localStorage.getItem("theme") || "light";
//         htmlEl.setAttribute("data-theme", savedTheme);
//         updateThemeIcon(savedTheme);
//     }

//     // Update the theme icon image
//     function updateThemeIcon(theme) {
//         themeIconImg.src = theme === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
//         themeIconImg.alt = theme === "dark" ? "Light Mode" : "Dark Mode";
//     }

//     // Toggle theme and save it
//     themeToggleIcon.addEventListener("click", () => {
//         const currentTheme = htmlEl.getAttribute("data-theme");
//         const newTheme = currentTheme === "dark" ? "light" : "dark";
//         htmlEl.setAttribute("data-theme", newTheme);
//         localStorage.setItem("theme", newTheme);
//         updateThemeIcon(newTheme);
//     });

//     // Initialize theme on page load
//     loadSavedTheme();

//     let displayedCount = 0;
//     let productsToShow = 50;

//     // Category list (from products)
//     function extractCategories(products) {
//         const categories = new Set();
//         products.forEach(p => {
//             if (p.category) categories.add(p.category);
//         });
//         return Array.from(categories);
//     }

//     function renderCategories(categories) {
//         const categoryGrid = document.getElementById("categoryGrid");
//         categoryGrid.innerHTML = "";
//         categories.forEach(cat => {
//             const div = document.createElement("div");
//             div.className = "category-item";
//             div.textContent = cat;
//             div.addEventListener("click", () => {
//                 window.location.href = `?category=${encodeURIComponent(cat)}`;
//             });
//             categoryGrid.appendChild(div);
//         });
//     }

//     // Helper: convert sheet rows array to array of objects using header row
//     function parseSheetData(values) {
//         const [header, ...rows] = values;
//         return rows.map(row => {
//             const obj = {};
//             header.forEach((key, i) => {
//                 obj[key] = row[i] || "";
//             });
//             return obj;
//         });
//     }

//     // On Load
//     showSpinner();
//     let mergedProducts = []; // define globally

//     fetch(allSheetsAPI)
//         .then(res => res.json())
//         .then(data => {

//             data.sheets.forEach(sheet => {
//                 const rowData = sheet.data[0]?.rowData;
//                 if (!rowData || rowData.length < 2) return; // skip empty sheet

//                 const headerRow = rowData[0].values.map(v => v.formattedValue || "");

//                 for (let i = 1; i < rowData.length; i++) {
//                     const row = rowData[i].values || [];
//                     const obj = {};
//                     headerRow.forEach((key, idx) => {
//                         obj[key] = row[idx]?.formattedValue || "";
//                     });
//                     mergedProducts.push(obj);
//                 }
//             });

//             // Filter wholesale products only
//             allProducts = mergedProducts.filter(p => p.wholesale_availabe?.toLowerCase() === "yes");
//             currentProducts = [...allProducts];
//             categoryMap = buildCategoryMap(allProducts);

//             renderDesktopCategoryGrid();
//             displayedCount = 0;  // reset displayedCount before rendering
//             renderProducts(currentProducts, false);
//             showMainCategories();
//         })
//         .catch(err => console.error(err))
//         .finally(hideSpinner);



//     function shuffleArray(array) {
//         return array.map(a => [Math.random(), a]).sort().map(a => a[1]);
//     }

//     // Keep only products where wholesale_availabe = "yes"
//     allProducts = mergedProducts.filter(p => p.wholesale_availabe?.toLowerCase() === "yes");

//     // Keep a copy for rendering
//     currentProducts = [...allProducts];


//     function buildCategoryMap(products) {
//         const map = {};
//         products.forEach(p => {
//             if (p.category) {
//                 if (!map[p.category]) map[p.category] = [];
//                 map[p.category].push(p); // Already filtered by wholesale
//             }
//         });
//         return map;
//     }

//     function renderDesktopCategoryGrid() {
//         const grid = document.getElementById("categoryGrid");
//         if (!grid) return;

//         grid.innerHTML = "";

//         Object.keys(categoryMap).forEach(cat => {
//             // Skip category if no wholesale products
//             if (!categoryMap[cat].some(p => p.wholesale_availabe?.toLowerCase() === "yes")) return;

//             const tile = document.createElement("div");
//             tile.className = "category-tile";

//             const iconSrc = categoryIcons[cat] || categoryIcons.default;

//             tile.innerHTML = `
//       <img src="${iconSrc}" alt="${cat}" style="width:40px;height:40px;margin-bottom:5px;" />
//       <div>${cat}</div>
//     `;

//             tile.addEventListener("click", () => {
//                 showDesktopSubcategories(cat);
//             });

//             grid.appendChild(tile);
//         });
//     }

//     showMainCategories(); // Populate mobile drawer


//     function showDesktopSubcategories(categoryName) {
//         const drawer = document.getElementById("subCategoryDrawer");
//         const title = document.getElementById("subDrawerTitle");
//         const content = document.getElementById("subDrawerContent");
//         if (!drawer || !title || !content) return;

//         // Only wholesale products in this category
//         const productsInCategory = (categoryMap[categoryName] || []).filter(
//             p => p.wholesale_availabe?.toLowerCase() === "yes"
//         );

//         const subcategorySet = new Set();
//         productsInCategory.forEach(product => {
//             if (product.sub_category) subcategorySet.add(product.sub_category);
//         });

//         content.innerHTML = "";
//         const subcategories = Array.from(subcategorySet);

//         if (subcategories.length === 0) {
//             content.innerHTML = "<p style='padding:10px;'>No subcategories found.</p>";
//         } else {
//             subcategories.forEach(sub => {
//                 const item = document.createElement("div");
//                 item.className = "subcategory-item";
//                 item.textContent = sub;
//                 item.addEventListener("click", () => {
//                     // Filter only wholesale products in this subcategory
//                     const filtered = productsInCategory.filter(p => p.sub_category === sub);
//                     currentProducts = filtered;

//                     hideProductDetails();
//                     renderProducts(currentProducts, true);
//                     drawer.classList.add("hidden");
//                 });
//                 content.appendChild(item);
//             });
//         }

//         title.textContent = categoryName;
//         drawer.classList.remove("hidden");
//     }

//     if (subDrawerCloseBtn) {
//         subDrawerCloseBtn.addEventListener("click", () => {
//             subDrawer.classList.add("hidden");
//         });
//     }

//     // drawer

//     const categoryDrawer = document.getElementById("categoryDrawer");
//     const overlay = document.getElementById("overlay");
//     drawerCloseBtn.addEventListener("click", () => {
//         categoryDrawer.classList.remove("active");
//         overlay.classList.add("hidden");
//     });


//     drawerBack.addEventListener("click", () => {
//         showMainCategories();
//         drawerBack.classList.add("hidden");
//         drawerTitle.textContent = "Categories";
//     });

//     function showMainCategories() {
//         drawerContent.innerHTML = "";

//         const grid = document.createElement("div");
//         grid.style.display = "grid";
//         grid.style.gridTemplateColumns = "1fr 1fr";
//         grid.style.gap = "10px";

//         Object.keys(categoryMap).forEach(cat => {
//             // Skip categories with no wholesale products
//             if (!categoryMap[cat].some(p => p.wholesale_availabe?.toLowerCase() === "yes")) return;

//             const div = document.createElement("div");
//             div.className = "mobile-category-tile";
//             div.style.display = "flex";
//             div.style.flexDirection = "column";
//             div.style.alignItems = "center";
//             div.style.justifyContent = "center";
//             div.style.padding = "10px";
//             div.style.cursor = "pointer";

//             const icon = document.createElement("img");
//             icon.src = categoryIcons[cat] || categoryIcons.default;
//             icon.alt = cat;
//             icon.style.width = "32px";
//             icon.style.height = "32px";
//             icon.style.marginBottom = "5px";

//             const label = document.createElement("div");
//             label.textContent = cat;
//             label.style.fontSize = "14px";
//             label.style.textAlign = "center";

//             div.appendChild(icon);
//             div.appendChild(label);

//             div.addEventListener("click", () => {
//                 showSubcategories(cat);
//             });

//             grid.appendChild(div);
//         });

//         drawerContent.appendChild(grid);
//     }

//     function showSubcategories(mainCategory) {
//         const subCats = new Set();
//         const items = (categoryMap[mainCategory] || []).filter(
//             p => p.wholesale_availabe?.toLowerCase() === "yes"
//         );

//         items.forEach(item => {
//             if (item.sub_category) subCats.add(item.sub_category);
//         });

//         drawerContent.innerHTML = "";
//         Array.from(subCats).forEach(sub => {
//             const div = document.createElement("div");
//             div.textContent = sub;
//             div.addEventListener("click", () => {
//                 const filtered = items.filter(p => p.sub_category === sub);
//                 currentProducts = filtered;

//                 hideProductDetails();
//                 renderProducts(currentProducts, true);
//                 categoryDrawer.classList.remove("active");
//             });

//             drawerContent.appendChild(div);
//         });

//         drawerBack.classList.remove("hidden");
//         drawerTitle.textContent = mainCategory;
//     }

//     function openUserDrawer() {
//         const user = JSON.parse(localStorage.getItem("user")) || {
//             name: "Guest",
//             email: "Email",
//             photoURL: "assets/icons/user.png",
//         };

//         // Profile image
//         const imgEl = document.getElementById("drawerProfileImg");
//         if (imgEl) {
//             imgEl.src = user.photoURL || "assets/icons/user.png";
//         }

//         // Name (span or input)
//         const nameEl = document.getElementById("drawerName");
//         if (nameEl) {
//             if (nameEl.tagName === "INPUT") {
//                 nameEl.value = user.name || "Guest";
//             } else {
//                 nameEl.innerText = user.name || "Guest";
//             }
//         }

//         // Alternative editable input (drawerNameInput)
//         const nameInputEl = document.getElementById("drawerNameInput");
//         if (nameInputEl) {
//             nameInputEl.value = user.name || "Guest";
//         }

//         // Email (span or input)
//         const emailEl = document.getElementById("drawerEmail");
//         if (emailEl) {
//             if (emailEl.tagName === "INPUT") {
//                 emailEl.value = user.email || "Email";
//             } else {
//                 emailEl.innerText = user.email || "Email";
//             }
//         }

//         // Show drawer + overlay
//         const drawer = document.getElementById("userDrawer");


//         if (drawer) drawer.classList.add("open");
//         if (userOverlay) userOverlay.classList.add("show");
//         if (drawerCloseBtn) {
//             drawerCloseBtn.addEventListener("click", () => {
//                 categoryDrawer.classList.remove("active");
//                 overlay.classList.add("hidden");
//             });
//         }

//     }

//     // ✅ Add this after renderProducts is defined
//     document.getElementById("loadMoreBtn").addEventListener("click", () => {
//         renderProducts(currentProducts); // show next batch
//     });

//     const observer = new IntersectionObserver((entries) => {
//         entries.forEach(entry => {
//             if (entry.isIntersecting) {
//                 // load next batch if there are more
//                 if (displayedCount < currentProducts.length) {
//                     renderProducts(currentProducts);
//                 }
//             }
//         });
//     }, { rootMargin: '200px' });

//     observer.observe(document.getElementById('loadMoreBtn'));

//     // Open drawer
//     function openCategoryDrawer() {
//         categoryDrawer.classList.add("active");   // show drawer
//         mainOverlay.classList.add("active");      // show overlay
//     }

//     // Close drawer
//     function closeCategoryDrawer() {
//         categoryDrawer.classList.remove("active");
//         mainOverlay.classList.remove("active");
//     }

//     // Event listeners
//     openCategoryDrawerBtn.addEventListener("click", () => {
//         categoryDrawer.classList.add("active");
//         mainOverlay.classList.add("active");
//     });

//     mainOverlay.addEventListener("click", () => {
//         categoryDrawer.classList.remove("active");
//         mainOverlay.classList.remove("active");
//     });

//     subDrawerCloseBtn?.addEventListener("click", () => subDrawer.classList.add("hidden"));


//     if (subDrawerCloseBtn) {
//         subDrawerCloseBtn.addEventListener("click", () => {

//             if (subDrawer) subDrawer.classList.add("hidden");
//         });
//     }


//     if (userOverlay && userDrawer) {
//         userOverlay.addEventListener("click", () => {
//             userDrawer.classList.remove("open");
//             userOverlay.classList.remove("show");
//         });
//     }


//     function toggleFavorite(id) {
//         favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
//         // Save favorites
//         localStorage.setItem("favorites", JSON.stringify(favs));
//         updateCounts();
//         displayedCount = 0;
//         renderProducts(currentProducts, false);
//     }


// });

// document.addEventListener("DOMContentLoaded", () => {
//     const overlay = document.getElementById("overlay");
//     const loginPopup = document.getElementById("loginPopup");
//     const userDrawer = document.getElementById("userDrawer");
//     const userDrawerClose = document.getElementById("userDrawerClose");

//     // called when icon clicked
//     window.toggleLoginPopup = function () {
//         if (window.auth && auth.currentUser) {
//             // ✅ User logged in → open drawer
//             userDrawer.classList.remove("hidden");
//             overlay.classList.remove("hidden");
//         } else {
//             // ❌ Not logged in → show login popup
//             loginPopup.classList.remove("hidden");
//             overlay.classList.remove("hidden");
//         }
//     };

//     window.closeLoginPopup = function () {
//         loginPopup.classList.add("hidden");
//         overlay.classList.add("hidden");
//     };

//     userDrawerClose?.addEventListener("click", () => {
//         userDrawer.classList.add("hidden");
//         overlay.classList.add("hidden");
//     });

//     // Overlay click closes whichever is open
//     overlay.addEventListener("click", () => {
//         loginPopup.classList.add("hidden");
//         userDrawer.classList.add("hidden");
//         // Category drawer uses its own close logic
//     });
// });



document.addEventListener("DOMContentLoaded", () => {

    // ======= DOM Elements =======
    const subDrawerCloseBtn = document.getElementById("subDrawerClose");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const openCategoryDrawerBtn = document.getElementById("openCategoryDrawer");
    const mainOverlay = document.getElementById("overlay");      // for category drawer
    const userOverlay = document.getElementById("drawerOverlay"); // for user drawer
    const subDrawer = document.getElementById("subCategoryDrawer");
    const userDrawer = document.getElementById("userDrawer");
    const drawerCloseBtn = document.getElementById("drawerClose");
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
    const drawerContent = document.getElementById("drawerContent");
    const drawerBack = document.getElementById("drawerBack");
    const drawerTitle = document.getElementById("drawerTitle");
    const themeToggleIcon = document.getElementById("themeToggleIcon");
    const themeIconImg = document.getElementById("themeIconImg");

    // ======= State Variables =======
    let allProducts = [];
    let currentProducts = [];
    let categoryMap = {};
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    let displayedCount = 0;
    const itemsPerPage = 500;

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

    // ======= Spinner =======
    function showSpinner() { spinner.style.display = "block"; }
    function hideSpinner() { spinner.style.display = "none"; }

    // ======= CSV Loader =======
    const publishedSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhfzv9IWf8X8lEO3sFkhMBRgCjBu_0xHgX4xVQhYWUl-NRfYVxLwPZo5pnMusjOj_e6fyZ2R1HgC_Q/pub?output=csv";

    async function loadAllSheets() {
        try {
            showSpinner();
            const res = await fetch(publishedSheetURL);
            const csvText = await res.text();

            const lines = csvText.split("\n").filter(line => line.trim() !== "");
            const headers = lines[0].split(",").map(h => h.trim());

            const allData = lines.slice(1).map(line => {
                const values = line.split(",").map(v => v.trim());
                const obj = {};
                headers.forEach((key, i) => obj[key] = values[i] || "");
                return obj;
            });

            // Only wholesale products
            allProducts = allData.filter(p => p.wholesale_availabe?.toLowerCase() === "yes");
            currentProducts = [...allProducts];
            categoryMap = buildCategoryMap(allProducts);

            renderDesktopCategoryGrid();
            displayedCount = 0;
            renderProducts(currentProducts, false);
            showMainCategories();

        } catch (err) {
            console.error("Failed to load CSV:", err);
        } finally {
            hideSpinner();
        }
    }

    loadAllSheets();

    // ======= Product Rendering =======
    function filterProducts(products) {
        return products.filter(p => {
            const catOK = selectedCategory ? p.category?.toLowerCase() === selectedCategory.toLowerCase() : true;
            const subOK = selectedSub ? p.sub_category?.toLowerCase() === selectedSub.toLowerCase() : true;
            return catOK && subOK;
        });
    }

    function renderProducts(products, append = false) {
        if (!append) productGrid.innerHTML = "";
        const nextProducts = products.slice(displayedCount, displayedCount + itemsPerPage);

        nextProducts.forEach(product => {
            if (product.wholesale_availabe?.toLowerCase() === "yes") {
                const card = document.createElement("div");
                card.className = "product-card";

                card.innerHTML = `
                    <img src="${product.image || product.image_url}" alt="${product.name}" class="product-img" />
                    <h3 class="product-name">${product.name}</h3>
                    <div class="price-box">
                        <span class="wholesale-price">৳${product.wholesale_price || "N/A"}</span>
                        <span class="moq">MOQ: ${product.wholesale_moq || "-"}</span>
                    </div>
                `;

                card.addEventListener("click", () => {
                    window.location.href = `wholesale_product.html?id=${encodeURIComponent(product.id)}`;
                });

                productGrid.appendChild(card);
            }
        });

        displayedCount += nextProducts.length;
        loadMoreBtn.style.display = displayedCount >= products.length ? "none" : "block";
    }

    loadMoreBtn.addEventListener("click", () => renderProducts(currentProducts, true));

    // ======= Search =======
    let debounceTimer;
    searchInputs.forEach(input => {
        input.addEventListener("input", e => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                const filtered = allProducts.filter(p => p.name?.toLowerCase().includes(query));
                currentProducts = filtered;
                displayedCount = 0;
                renderProducts(currentProducts, false);
            }, 300);
        });
    });

    // ======= Favorites & Cart =======
    function toggleFavorite(id) {
        favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
        localStorage.setItem("favorites", JSON.stringify(favs));
        updateCounts();
        displayedCount = 0;
        renderProducts(currentProducts, false);
    }

    function addToCart(id) {
        const product = allProducts.find(p => p.id == id);
        if (!product) return alert("Product not found!");

        const existingItem = cart.find(item => item.id == id);
        const currentPrice = Number(product.current_price) || 0;
        const discountedPrice = Number(product.discount_price) || currentPrice;

        if (existingItem) existingItem.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: currentPrice, finalPrice: discountedPrice, image: product.image, quantity: 1 });

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCounts();
        alert("Added to cart!");
    }

    function updateCounts() {
        const cartCountEl = document.getElementById("cartCount");
        const favCountEl = document.getElementById("favCount");

        const totalCartQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

        if (totalCartQty > 0) { cartCountEl.textContent = totalCartQty; cartCountEl.classList.remove("hide"); }
        else cartCountEl.classList.add("hide");

        if (favs.length > 0) { favCountEl.textContent = favs.length; favCountEl.classList.remove("hide"); }
        else favCountEl.classList.add("hide");
    }

    // ======= Categories =======
    function buildCategoryMap(products) {
        const map = {};
        products.forEach(p => {
            if (p.category) {
                if (!map[p.category]) map[p.category] = [];
                map[p.category].push(p);
            }
        });
        return map;
    }

    function renderDesktopCategoryGrid() {
        const grid = document.getElementById("categoryGrid");
        if (!grid) return;
        grid.innerHTML = "";
        Object.keys(categoryMap).forEach(cat => {
            if (!categoryMap[cat].some(p => p.wholesale_availabe?.toLowerCase() === "yes")) return;

            const tile = document.createElement("div");
            tile.className = "category-tile";
            tile.innerHTML = `
                <img src="${categoryIcons[cat] || categoryIcons.default}" alt="${cat}" style="width:40px;height:40px;margin-bottom:5px;" />
                <div>${cat}</div>
            `;
            tile.addEventListener("click", () => showDesktopSubcategories(cat));
            grid.appendChild(tile);
        });
    }

    function showDesktopSubcategories(categoryName) {
        const drawer = document.getElementById("subCategoryDrawer");
        const title = document.getElementById("subDrawerTitle");
        const content = document.getElementById("subDrawerContent");
        if (!drawer || !title || !content) return;

        const productsInCategory = (categoryMap[categoryName] || []).filter(p => p.wholesale_availabe?.toLowerCase() === "yes");
        const subcategorySet = new Set();
        productsInCategory.forEach(p => { if (p.sub_category) subcategorySet.add(p.sub_category); });

        content.innerHTML = "";
        if (subcategorySet.size === 0) content.innerHTML = "<p style='padding:10px;'>No subcategories found.</p>";
        else subcategorySet.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subcategory-item";
            item.textContent = sub;
            item.addEventListener("click", () => {
                currentProducts = productsInCategory.filter(p => p.sub_category === sub);
                renderProducts(currentProducts, true);
                drawer.classList.add("hidden");
            });
            content.appendChild(item);
        });

        title.textContent = categoryName;
        drawer.classList.remove("hidden");
    }

    // ======= Mobile Drawer =======
    function showMainCategories() {
        drawerContent.innerHTML = "";
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1fr";
        grid.style.gap = "10px";

        Object.keys(categoryMap).forEach(cat => {
            if (!categoryMap[cat].some(p => p.wholesale_availabe?.toLowerCase() === "yes")) return;

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
            div.addEventListener("click", () => showSubcategories(cat));
            grid.appendChild(div);
        });

        drawerContent.appendChild(grid);
    }

    function showSubcategories(mainCategory) {
        const subCats = new Set();
        const items = (categoryMap[mainCategory] || []).filter(p => p.wholesale_availabe?.toLowerCase() === "yes");
        items.forEach(item => { if (item.sub_category) subCats.add(item.sub_category); });

        drawerContent.innerHTML = "";
        Array.from(subCats).forEach(sub => {
            const div = document.createElement("div");
            div.textContent = sub;
            div.addEventListener("click", () => {
                currentProducts = items.filter(p => p.sub_category === sub);
                renderProducts(currentProducts, true);
                document.getElementById("categoryDrawer").classList.remove("active");
            });
            drawerContent.appendChild(div);
        });

        drawerBack.classList.remove("hidden");
        drawerTitle.textContent = mainCategory;
    }

    showMainCategories();

    // ======= Theme Toggle =======
    const htmlEl = document.documentElement;

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        htmlEl.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        themeIconImg.src = theme === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
        themeIconImg.alt = theme === "dark" ? "Light Mode" : "Dark Mode";
    }

    themeToggleIcon.addEventListener("click", () => {
        const currentTheme = htmlEl.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        htmlEl.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
    });

    loadSavedTheme();

});
