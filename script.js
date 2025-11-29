const htmlEl = document.documentElement;
const themeToggleIcon = document.getElementById("themeToggleIcon");
const menuToggle = document.getElementById("menuToggle");
const mobileDrawer = document.getElementById("mobileDrawer");
const overlay = document.getElementById("overlay");
const closeDrawerBtn = document.getElementById("closeDrawer");
const header = document.getElementById("mainHeader");
const floatingCategory = document.getElementById("floatingCategory");
const floatingUser = document.getElementById("floatingUser");
const themeIconImg = document.getElementById("themeIconImg");
const categoryDrawer = document.getElementById("categoryDrawer");
const categoryBtnInside = document.getElementById("categoryBtnInside");
const closeCategoryDrawer = document.getElementById("closeCategoryDrawer");
const categoryItems = document.querySelectorAll("#mainCategoryList li");
const backToMain = document.getElementById("backToMain");
const userInside = document.getElementById("userBtnInside"); // Assumed defined
let firstScrollDone = false;
const track = document.getElementById("slider-track");

// Load theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  htmlEl.setAttribute("data-theme", savedTheme);
  themeIconImg.src = savedTheme === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
}

// Toggle theme
themeToggleIcon.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  htmlEl.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  themeIconImg.src = next === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
});

// Menu drawer toggle
menuToggle.addEventListener("click", () => {
  mobileDrawer.classList.add("show");
  overlay.classList.add("show");
});
closeDrawerBtn.addEventListener("click", closeMenuDrawer);
overlay.addEventListener("click", () => {
  closeMenuDrawer();
  closeCategoryDrawerFn();
});
document.querySelectorAll(".mobile-drawer a").forEach(link => {
  link.addEventListener("click", closeMenuDrawer);
});
function closeMenuDrawer() {
  mobileDrawer.classList.remove("show");
  overlay.classList.remove("show");
}

// Floating nav logic


window.addEventListener("scroll", () => {
  if (!firstScrollDone && window.scrollY > 0) {
    firstScrollDone = true;
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    setTimeout(() => {
      header.classList.add("sticky");
    }, 600);
  }

  const isScrolled = window.scrollY > 50;
  if (firstScrollDone) header.classList.toggle("sticky", isScrolled);
  floatingCategory?.classList.toggle("show", isScrolled);
  floatingUser?.classList.toggle("show", isScrolled);

  if (categoryBtnInside && userInside) {
    categoryBtnInside.style.display = isScrolled ? "none" : "inline-block";
    userInside.style.display = isScrolled ? "none" : "inline-block";
  }
});

// Open category drawer
floatingCategory?.addEventListener("click", () => {
  categoryDrawer.classList.add("show");
  overlay.classList.add("show");
});
categoryBtnInside?.addEventListener("click", () => {
  categoryDrawer.classList.add("show");
  overlay.classList.add("show");
});
closeCategoryDrawer?.addEventListener("click", closeCategoryDrawerFn);

function closeCategoryDrawerFn() {
  categoryDrawer?.classList.remove("show");
  overlay?.classList.remove("show");
  categoryContent?.classList.remove("two-column");
  activeCategory = null;
  highlightActive(null);
}

// Slide rotator
const slides = document.querySelectorAll(".fade-slide");
let currentIndex = 0;
const totalSlides = slides.length;
const leftShopBtn = document.querySelector(".shop-now-left");
const rightShopBtn = document.querySelector(".shop-now-right");

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  if (index === 0) {
    leftShopBtn.classList.add("active");
    rightShopBtn.classList.remove("active");
  } else if (index === 1) {
    leftShopBtn.classList.remove("active");
    rightShopBtn.classList.add("active");
  }
}
function rotateSlides() {
  currentIndex = (currentIndex + 1) % totalSlides;
  showSlide(currentIndex);
}
showSlide(currentIndex);
setInterval(rotateSlides, 8000);

// Controls for buttons
const categoryBtn = document.getElementById("categoryBtnInside");
const userBtn = document.getElementById("userBtnInside");
const controls = document.querySelector(".controls");

window.addEventListener("scroll", () => {
  if (window.scrollY === 0) {
    categoryBtn.style.display = "flex";
    userBtn.style.display = "flex";
    controls.classList.remove("scrolled");
  } else {
    categoryBtn.style.display = "none";
    userBtn.style.display = "none";
    controls.classList.add("scrolled");
  }
});


async function getAllSheetNames() {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  const res = await fetch(metaUrl);
  const data = await res.json();

  if (!data.sheets) throw new Error("No sheets found in spreadsheet");

  return data.sheets.map(s => s.properties.title);
}


// Auto slider products

const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
// const sheetName = "Sheet1"; // Change to your actual sheet tab name
const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";

const googleSheetsAPI =  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=true&key=${apiKey}`;

// Helper function to convert sheet rows (arrays) to objects using header row
function parseSheetData(sheetValues) {
  const [header, ...rows] = sheetValues;
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || "";
    });
    return obj;
  });
}

// Fetch products data from Google Sheets
// fetch(googleSheetsAPI)
//   .then(res => res.json())
//   .then(data => {
//     if (!data.values) throw new Error("No data found in sheet");

//     const products = parseSheetData(data.values);

//     // Now you have 'products' as array of objects like your previous SheetBest data
//     // Proceed with your current code logic, e.g. create product cards:

//     products.forEach(p => {
//       const priceHTML = `
//         <div class="price-row">
//           ${p.discount_price
//           ? `<s>৳ ${p.current_price}</s><strong> ${p.discount_price} BDT</strong>`
//           : `<strong> ${p.current_price} ৳</strong><span></span>`}
//         </div>`;

//       const card = document.createElement("a");
//       card.className = "product-card";
//       card.href = `product.html?id=${p.id}`;
//       card.innerHTML = `
//         <span class="heart-icon"><i class="fas fa-heart"></i></span>
//         <img src="${p.image || p.heading_image || p.slide1}" alt="${p.name}" />
//         <div class="card-body"><h4>${p.name}</h4></div>
//         ${priceHTML}`;

//       card.addEventListener("mouseenter", () => isPaused = true);
//       card.addEventListener("mouseleave", () => isPaused = false);
//       card.addEventListener("touchstart", () => isPaused = true);
//       card.addEventListener("touchend", () => isPaused = false);
//       track.appendChild(card);
//     });

//     cardCount = products.length;

//     setTimeout(() => {
//       const firstCard = track.querySelector(".product-card");
//       if (!firstCard) return;

//       cardCount = track.querySelectorAll(".product-card").length;
//       startSlider();
//       track.innerHTML += track.innerHTML;
//     }, 100);
//   })
//   .catch(err => {
//     console.error("Fetch error:", err);
//   });





let cardCount = 0;
let isPaused = false;

// fetch(googleSheetsAPI)
//   .then(res => res.json())
//   .then(data => {
//     if (!data.values) throw new Error("No data found in sheet");
//     const products = parseSheetData(data.values);
//     products.forEach(p => {
//       const priceHTML = `
//         <div class="price-row">
//           ${p.discount_price
//           ? `<s>৳ ${p.current_price}</s><strong> ${p.discount_price} BDT</strong>`
//           : `<strong> ${p.current_price} ৳</strong><span></span>`}
//         </div>`;

//       const card = document.createElement("a");
//       card.className = "product-card";
//       card.href = `product.html?id=${p.id}`;
//       card.innerHTML = `
//         <span class="heart-icon"><i class="fas fa-heart"></i></span>
//         <img src="${p.image || p.heading_image || p.slide1}" alt="${p.name}" />
//         <div class="card-body"><h4>${p.name}</h4></div>
//         ${priceHTML}`;

//       card.addEventListener("mouseenter", () => isPaused = true);
//       card.addEventListener("mouseleave", () => isPaused = false);
//       card.addEventListener("touchstart", () => isPaused = true);
//       card.addEventListener("touchend", () => isPaused = false);
//       track.appendChild(card);
//     });

//     cardCount = products.length;

//     setTimeout(() => {
//       const firstCard = track.querySelector(".product-card");
//       if (!firstCard) return;

//       cardCount = track.querySelectorAll(".product-card").length;
//       startSlider();
//       track.innerHTML += track.innerHTML;
//     }, 100);
//   });

function startSlider() {
  const interval = 3000;

  setInterval(() => {
    if (isPaused || cardCount <= visibleCards()) return;

    currentIndex = (currentIndex + 1) % cardCount;
    const cardWidth = track.querySelector(".product-card").offsetWidth;

    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
  }, interval);
}

function visibleCards() {
  const width = window.innerWidth;
  if (width <= 480) return 1;
  if (width <= 768) return 2;
  return 5;
}



const mainCategoryList = document.getElementById("mainCategoryList");
const subcategoryList = document.getElementById("subcategoryList");
const categoryContent = document.querySelector(".category-content");
const subcategoryHeader = document.getElementById("subcategoryHeader");
const selectedCategoryName = document.getElementById("selectedCategoryName");
const closeCategoryDrawerBtn = document.getElementById("closeCategoryDrawer");
const categoryGridContainer = document.getElementById("categoryGridContainer");
const showMoreBtn = document.getElementById("showMoreBtn");
const masonryGrid = document.getElementById("masonryGrid");

let activeCategory = null;
let categoryMap = {}; // ✅ Key fix: define only ONCE


if (savedTheme) {
  htmlEl.setAttribute("data-theme", savedTheme);
  themeIconImg.src = savedTheme === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
}

// // Toggle theme
// themeToggleIcon.addEventListener("click", () => {
//   const current = htmlEl.getAttribute("data-theme");
//   const next = current === "light" ? "dark" : "light";
//   htmlEl.setAttribute("data-theme", next);
//   localStorage.setItem("theme", next);
//   themeIconImg.src = next === "dark" ? "assets/icons/sun.png" : "assets/icons/moon.png";
// });

// Menu drawer toggle
menuToggle.addEventListener("click", () => {
  mobileDrawer.classList.add("show");
  overlay.classList.add("show");
});
closeDrawerBtn.addEventListener("click", closeMenuDrawer);
overlay.addEventListener("click", () => {
  closeMenuDrawer();
  closeCategoryDrawerFn();
});
document.querySelectorAll(".mobile-drawer a").forEach(link => {
  link.addEventListener("click", closeMenuDrawer);
});
function closeMenuDrawer() {
  mobileDrawer.classList.remove("show");
  overlay.classList.remove("show");
}

// Floating nav logic
window.addEventListener("scroll", () => {
  if (!firstScrollDone && window.scrollY > 0) {
    firstScrollDone = true;
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    setTimeout(() => header.classList.add("sticky"), 600);
  }

  const isScrolled = window.scrollY > 50;
  if (firstScrollDone) header.classList.toggle("sticky", isScrolled);
  floatingCategory?.classList.toggle("show", isScrolled);
  floatingUser?.classList.toggle("show", isScrolled);

  if (categoryBtnInside && userInside) {
    categoryBtnInside.style.display = isScrolled ? "none" : "inline-block";
    userInside.style.display = isScrolled ? "none" : "inline-block";
  }

  if (window.scrollY === 0) {
    categoryBtnInside.style.display = "flex";
    userInside.style.display = "flex";
    controls?.classList.remove("scrolled");
  } else {
    categoryBtnInside.style.display = "none";
    userInside.style.display = "none";
    controls?.classList.add("scrolled");
  }
});

// Open category drawer
floatingCategory?.addEventListener("click", openCategoryDrawer);
categoryBtnInside?.addEventListener("click", openCategoryDrawer);
closeCategoryDrawer?.addEventListener("click", closeCategoryDrawerFn);
closeCategoryDrawerBtn?.addEventListener("click", closeCategoryDrawerFn);

function openCategoryDrawer() {
  categoryDrawer?.classList.add("show");
  overlay?.classList.add("show");
}

function closeCategoryDrawerFn() {
  categoryDrawer?.classList.remove("show");
  overlay?.classList.remove("show");
  categoryContent?.classList.remove("two-column");
  subcategoryList.innerHTML = "";
  selectedCategoryName.textContent = "";
  activeCategory = null;
  highlightActive(null);
}

async function loadAllSheets() {
  try {
    const sheetNames = await getAllSheetNames();
    let allProducts = [];

    for (const name of sheetNames) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(name)}?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.values) {
        console.warn(`⚠️ No data in sheet: ${name}`);
        continue;
      }

      const products = parseSheetData(data.values).map(p => ({
        ...p,
        sourceSheet: name
      }));

      allProducts = allProducts.concat(products);
    }

    // Filter only status = online
    const onlineProducts = allProducts.filter(p =>
      (p.status || "").trim().toLowerCase() === "online"
    );

    console.log("✅ Online products:", onlineProducts.length);

    // Render only online products
    renderProducts(onlineProducts);   // main products
    renderSliderProducts(onlineProducts);  // feature slider


    // Build categories only from online items
    buildCategoryMap(onlineProducts);
    populateMainCategories();
    populateCategoryTiles();

  } catch (err) {
    console.error("❌ Failed to load sheets:", err);
  }
}



function renderSliderProducts(products) {
  track.innerHTML = "";
  cardCount = 0;

  products.forEach(p => {

    const priceHTML = `
      <div class="price-row">
        ${p.discount_price
        ? `<s>৳ ${p.current_price}</s><strong> ${p.discount_price} BDT</strong>`
        : `<strong> ${p.current_price} ৳</strong>`}
      </div>`;

    const card = document.createElement("a");
    card.className = "product-card";
    card.href = `product.html?id=${p.id || ""}`;
    card.innerHTML = `
      <span class="heart-icon">  <lord-icon
    src="https://cdn.lordicon.com/nvsfzbop.json"
    trigger="morph"
    state="morph-slider"
    colors="primary:#c71f16,secondary:#e83a30"
    style="width:20px;height:20px">
</lord-icon></span>
      <img src="${p.image || p.heading_image || p.slide1 || ""}" alt="${p.name}" />
      <div class="card-body"><h4>${p.name || ""}</h4></div>
      ${priceHTML}`;

    track.appendChild(card);
  });

  cardCount = products.length;

  // duplicate for infinite effect
  setTimeout(() => {
    if (cardCount > 0) {
      track.innerHTML += track.innerHTML;
      startSlider();
    }
  }, 100);
}


function buildCategoryMap(products) {
  categoryMap = {};

  products.forEach(p => {
    let rawCategory = (p.category || "").trim();

    // ❌ Skip empty/uncategorized categories
    if (!rawCategory || rawCategory.toLowerCase() === "uncategorized") return;

    const key = rawCategory.toLowerCase();
    const displayName = capitalize(rawCategory);

    const rawSub = (p.sub_category || "General").trim();
    const subDisplay = capitalize(rawSub);

    if (!categoryMap[key]) {
      categoryMap[key] = { displayName, subcategories: new Set() };
    }

    categoryMap[key].subcategories.add(subDisplay);
  });
}



function renderProducts(products) {
  const track = document.getElementById("slider-track");
  track.innerHTML = "";

  products.forEach(p => {
    const priceHTML = `
      <div class="price-row">
        ${p.discount_price
        ? `<s>৳ ${p.current_price}</s><strong> ${p.discount_price} BDT</strong>`
        : `<strong> ${p.current_price} ৳</strong>`}
      </div>`;

    const card = document.createElement("a");
    card.className = "product-card";
    card.href = `product.html?id=${p.id || ""}`;
    card.innerHTML = `
      <span class="heart-icon">  <lord-icon
    src="https://cdn.lordicon.com/nvsfzbop.json"
    trigger="morph"
    state="morph-slider"
    colors="primary:#c71f16,secondary:#e83a30"
    style="width:20px;height:20px">
</lord-icon></span>
      <img src="${p.image || p.heading_image || p.slide1 || ""}" alt="${p.name}" />
      <div class="card-body"><h4>${p.name || ""}</h4></div>
      ${priceHTML}`;

    track.appendChild(card);
  });
}



function parseSheetData(sheetValues) {
  const [header, ...rows] = sheetValues;
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || "";
    });
    return obj;
  });
}


// --- Category logic from API ---
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

function getCategoryImage(categoryKey) {
  const images = {
    "electronics": "assets/images/electronic.jpg",
    "bag": "assets/images/bag.jpg",
    "Jewellery": "assets/images/jewleary.jpg",
    "shoe": "assets/images/shoe.jpg",
    "beauty": "assets/images/beauty.jpg",
    "baby": "assets/images/baby.jpg",
    "eyeware": "assets/images/eyeware.jpg",
    "stationary": "assets/images/stationary.jpg",
    "seasonal": "assets/images/seasonal.jpg",
    "toys": "assets/images/toys.jpg",
    "decoration": "assets/images/decoration.jpg",
    "daily": "assets/images/daily.jpg",
    "kitchen": "assets/images/kitchen.jpg",
    "households": "assets/images/households.jpg"
  };
  return images[categoryKey] || "assets/images/default.jpg";
}

// fetch(googleSheetsAPI)
//   .then(res => res.json())
//   .then(data => {
//     if (!data.values) throw new Error("No data found in sheet");

//     const products = parseSheetData(data.values);
//     products.forEach(p => {
//       const rawCategory = (p.category || "Uncategorized").trim();
//       const key = rawCategory.toLowerCase();
//       const displayName = capitalize(rawCategory);
//       const rawSub = (p.sub_category || "General").trim();
//       const subDisplay = capitalize(rawSub);

//       if (!categoryMap[key]) {
//         categoryMap[key] = { displayName, subcategories: new Set() };
//       }
//       categoryMap[key].subcategories.add(subDisplay);
//     });

//     populateMainCategories();
//     populateCategoryTiles();
//   })
//   .catch(err => {
//     console.error("Fetch categories error:", err);
//   });

// --- Populate main drawer categories ---
function populateMainCategories() {
  if (!mainCategoryList) return;
  mainCategoryList.innerHTML = "";

  Object.keys(categoryMap).forEach(key => {
    const category = categoryMap[key].displayName;
    const li = document.createElement("li");
    li.textContent = category;
    li.dataset.categoryKey = key;
    li.className = "category-item";

    li.addEventListener("mouseenter", () => {
      if (window.innerWidth > 768) showSubcategories(key);
    });

    li.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        if (activeCategory === key) {
          closeCategoryDrawerFn();
          window.location.href = `products.html?category=${encodeURIComponent(key)}`;
        } else {
          showSubcategories(key);
        }
      } else {
        closeCategoryDrawerFn();
        window.location.href = `products.html?category=${encodeURIComponent(key)}`;
      }
    });

    mainCategoryList.appendChild(li);
  });
}

function showSubcategories(categoryKey) {
  if (!subcategoryList) return;
  subcategoryList.innerHTML = "";

  activeCategory = categoryKey;
  highlightActive(categoryKey);

  const subs = Array.from(categoryMap[categoryKey].subcategories).sort();
  subs.forEach(sub => {
    const li = document.createElement("li");
    li.textContent = sub;
    li.className = "subcategory-item";
    li.addEventListener("click", () => {
      closeCategoryDrawerFn();
      window.location.href = `products.html?category=${encodeURIComponent(categoryKey)}&sub_category=${encodeURIComponent(sub)}`;
    });
    subcategoryList.appendChild(li);
  });

  if (window.innerWidth <= 768) {
    selectedCategoryName.textContent = categoryMap[categoryKey].displayName;
    categoryContent.classList.add("two-column");
  }
}

function highlightActive(categoryKey) {
  document.querySelectorAll("#mainCategoryList li").forEach(li => {
    li.classList.toggle("active", li.dataset.categoryKey === categoryKey);
  });
}

if (backToMain) {
  backToMain.addEventListener("click", () => {
    activeCategory = null;
    subcategoryList.innerHTML = "";
    categoryContent.classList.remove("two-column");
    selectedCategoryName.textContent = "";
    highlightActive(null);
  });
}

if (selectedCategoryName) {
  selectedCategoryName.addEventListener("click", () => {
    if (activeCategory) {
      closeCategoryDrawerFn();
      window.location.href = `products.html?category=${encodeURIComponent(activeCategory)}`;
    }
  });
}

// --- Category Tiles (masonry grid) ---
function populateCategoryTiles() {
  if (!masonryGrid || !showMoreBtn) return;

  const categoryKeys = Object.keys(categoryMap);
  let isExpanded = false;

  function getInitialCount() {
    return window.innerWidth < 600 ? 6 : 8;
  }

  function renderTiles() {
    masonryGrid.innerHTML = "";

    const visible = isExpanded ? categoryKeys : categoryKeys.slice(0, getInitialCount());

    visible.forEach(key => {
      const displayName = categoryMap[key].displayName;
      const tile = document.createElement("div");
      tile.className = "category-tile";
      tile.style.backgroundImage = `url(${getCategoryImage(key)})`;

      tile.innerHTML = `
        <div class="tile-overlay">
          <div class="tile-title">${displayName}</div>
          <div class="tile-action">Show Products →</div>
        </div>
      `;

      tile.onclick = () => {
        window.location.href = `products.html?category=${encodeURIComponent(key)}`;
      };

      masonryGrid.appendChild(tile);
    });

    showMoreBtn.textContent = isExpanded ? "Show Less" : "Show More";
  }

  showMoreBtn.onclick = () => {
    isExpanded = !isExpanded;
    renderTiles();
  };

  renderTiles();
  window.addEventListener("resize", () => {
    if (!isExpanded) renderTiles();
  });
}



document.querySelector('[data-btn="userBtnInside"]');

loadAllSheets();
