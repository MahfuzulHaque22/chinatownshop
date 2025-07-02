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

const mainCategoryList = document.getElementById("mainCategoryList");
const subcategoryView = document.getElementById("subcategoryView");
const subcategoryTitle = document.getElementById("subcategoryTitle");
const subcategoryList = document.getElementById("subcategoryList");
const backToMain = document.getElementById("backToMain");

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

// Drawer toggle
menuToggle.addEventListener("click", () => {
  mobileDrawer.classList.add("show");
  overlay.classList.add("show");
});
closeDrawerBtn.addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
document.querySelectorAll(".mobile-drawer a").forEach(link => {
  link.addEventListener("click", closeDrawer);
});
function closeDrawer() {
  mobileDrawer.classList.remove("show");
  overlay.classList.remove("show");
}

// Floating nav logic
window.addEventListener("scroll", () => {
  const isScrolled = window.scrollY > 50;
  header.classList.toggle("sticky", isScrolled);
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
closeCategoryDrawer?.addEventListener("click", () => {
  categoryDrawer.classList.remove("show");
  overlay.classList.remove("show");
  subcategoryView.style.display = "none";
});

// Handle category click → Show subcategories
mainCategoryList.querySelectorAll("li").forEach(item => {
  item.addEventListener("click", () => {
    const category = item.dataset.category;
    showSubcategories(category);
  });
});


const categoryData = {
  "Bags": ["Handbags", "Backpacks", "Wallets"],
  "Jewelry": ["Necklaces", "Bracelets", "Earrings"],
  "Shoes": ["Sneakers", "Sandals", "Heels"],
  // Add more categories here...
};

categoryItems.forEach(item => {
  item.addEventListener("mouseenter", () => {
    const cat = item.dataset.category;
    const subcategories = categoryData[cat] || [];
    subcategoryList.innerHTML = subcategories.map(sub => `<li>${sub}</li>`).join('');
  });

  // Optional: add click for mobile
  item.addEventListener("click", () => {
    const cat = item.dataset.category;
    const subcategories = categoryData[cat] || [];
    subcategoryList.innerHTML = subcategories.map(sub => `<li>${sub}</li>`).join('');
  });
});

function showSubcategories(category) {
  subcategoryTitle.textContent = category;
  subcategoryList.innerHTML = "";

  // Example subcategories (you can customize based on real category)
  const dummySubs = {
    Bags: ["Backpacks", "Tote Bags", "Shoulder Bags"],
    Shoes: ["Sneakers", "Sandals", "Formal"],
    Jewelry: ["Earrings", "Necklaces", "Bracelets"],
    Beauty: ["Makeup", "Skincare", "Fragrances"],
    Baby: ["Toys", "Clothing", "Feeding"],
    Eyewear: ["Sunglasses", "Blue Light", "Prescription"],
    School: ["Bags", "Supplies", "Lunch Boxes"],
    Seasonal: ["Winter", "Summer", "Festive"],
    Home: ["Decor", "Lamps", "Wall Art"],
    Kitchen: ["Cookware", "Storage", "Utensils"]
  };

  const subItems = dummySubs[category] || ["Sub 1", "Sub 2"];
  subItems.forEach(sub => {
    const li = document.createElement("li");
    li.textContent = sub;
    subcategoryList.appendChild(li);
  });

  subcategoryView.style.display = "block";
}

// Back to main category
backToMain.addEventListener("click", () => {
  subcategoryView.style.display = "none";
});


document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("sliderTrack");
  const dots = document.querySelectorAll("#sliderDots .dot");

  const slideCount = dots.length;
  let current = 0;

  function updateSlider(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  // Auto-slide every 4 seconds
  setInterval(() => {
    current = (current + 1) % slideCount;
    updateSlider(current);
  }, 4000);

  // Manual dot click
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      current = parseInt(dot.dataset.index);
      updateSlider(current);
    });
  });

  updateSlider(current); // Initialize on load
});
