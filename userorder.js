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

// Auto slider products

const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
const sheetName = "Sheet1"; // Change to your actual sheet tab name
const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";

const googleSheetsAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;

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
let firstScrollDone = false;
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

// --- Category logic from API ---
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

function getCategoryImage(categoryKey) {
  const images = {
    "electronics": "assets/images/electronic.jpg",
    "bag": "assets/images/bag.jpg",
    "jewlery": "assets/images/jewleary.jpg",
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

fetch(googleSheetsAPI)
  .then(res => res.json())
  .then(data => {
    if (!data.values) throw new Error("No data found in sheet");

    const products = parseSheetData(data.values);
    products.forEach(p => {
      const rawCategory = (p.category || "Uncategorized").trim();
      const key = rawCategory.toLowerCase();
      const displayName = capitalize(rawCategory);
      const rawSub = (p.sub_category || "General").trim();
      const subDisplay = capitalize(rawSub);

      if (!categoryMap[key]) {
        categoryMap[key] = { displayName, subcategories: new Set() };
      }
      categoryMap[key].subcategories.add(subDisplay);
    });

    populateMainCategories();
    populateCategoryTiles();
  })
  .catch(err => {
    console.error("Fetch categories error:", err);
  });

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
