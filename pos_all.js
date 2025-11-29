//pos.js 
// Sidebar toggle
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed');
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  html.setAttribute("data-theme", newTheme);

  // Show/hide theme buttons
  document.getElementById("theme-light-btn").style.display = newTheme === "dark" ? "inline-block" : "none";
  document.getElementById("theme-dark-btn").style.display = newTheme === "light" ? "inline-block" : "none";
}


//find
function findProduct() {
  const s = document.getElementById('productSearch').value.toLowerCase();
  const p = productsData.find(p => p.code.toLowerCase() === s || p.name.toLowerCase().includes(s));
  if (p) addProductToCart(p); else alert('Product not found');
}



// Initialize button visibility on page load
window.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme") || "light";
  document.getElementById("theme-light-btn").style.display = currentTheme === "dark" ? "inline-block" : "none";
  document.getElementById("theme-dark-btn").style.display = currentTheme === "light" ? "inline-block" : "none";
});

// Dropdown toggle on click
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', e => {
    e.preventDefault();
    toggle.parentElement.classList.toggle('open');
  });
});

// Settings menu toggle
document.getElementById('settings-btn').addEventListener('click', e => {
  e.stopPropagation();
  const menu = document.getElementById('settings-menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});
document.addEventListener('click', () => {
  document.getElementById('settings-menu').style.display = 'none';
});

// // Function to load page
// async function loadPage(page, linkElement) {
//   const content = document.getElementById('content');
//   try {
//     // Mark active link
//     document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
//     if (linkElement) linkElement.classList.add('active');

//     content.classList.remove('page-fade');
//     void content.offsetWidth; // reflow
//     const response = await fetch(`${page}.html`);
//     if (!response.ok) throw new Error(`Failed to load ${page}.html`);
//     const html = await response.text();
//     content.innerHTML = html;
//     content.classList.add('page-fade');
//   } catch (error) {
//     content.innerHTML = `<p style="color:red;">Error loading page: ${error.message}</p>`;
//   }
// }


// async function loadPage(page, linkElement) {
//   const content = document.getElementById('content');
//   try {
//     document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
//     if (linkElement) linkElement.classList.add('active');

//     const response = await fetch(`${page}.html`);
//     if (!response.ok) throw new Error(`Failed to load ${page}.html`);
//     const html = await response.text();
//     content.innerHTML = html;

//     // Re-run fade effect
//     content.classList.remove('page-fade');
//     void content.offsetWidth;
//     content.classList.add('page-fade');

//     // ✅ If we loaded "sale", attach its JS after DOM injected
//     if (page === "sale") {
//       const script = document.createElement("script");
//       script.src = "sale.js";
//       document.body.appendChild(script);
//     }

//   } catch (error) {
//     content.innerHTML = `<p style="color:red;">Error loading page: ${error.message}</p>`;
//   }
// }

// async function loadPage(page, linkElement) {
//   const content = document.getElementById('content');
//   try {
//     document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
//     if (linkElement) linkElement.classList.add('active');

//     const response = await fetch(`${page}.html`);
//     if (!response.ok) throw new Error(`Failed to load ${page}.html`);
//     const html = await response.text();
//     content.innerHTML = html;

//     // Re-run fade effect
//     content.classList.remove('page-fade');
//     void content.offsetWidth;
//     content.classList.add('page-fade');

//     // ✅ Attach script after DOM injected
//     if (page === "home") {
//       const script = document.createElement("script");
//       script.src = "home.js";
//       document.body.appendChild(script);
//     }
//     if (page === "sale") {
//       const script = document.createElement("script");
//       script.src = "sale.js";
//       document.body.appendChild(script);
//     }

//   } catch (error) {
//     content.innerHTML = `<p style="color:red;">Error loading page: ${error.message}</p>`;
//   }
// }




// Click event for sidebar links
document.querySelectorAll('.nav a[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.getAttribute('data-page');
    loadPage(page, link);
  });
});

// On page load
window.addEventListener("DOMContentLoaded", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  document.getElementById("theme-light-btn").style.display = currentTheme === "light" ? "none" : "inline-block";
  document.getElementById("theme-dark-btn").style.display = currentTheme === "dark" ? "none" : "inline-block";

  // Load Home page by default
  const homeLink = document.querySelector('.nav a[data-page="home"]');
  if (homeLink) {
    loadPage("home", homeLink);
  }
});


//pos_function.js
let productsData = [];
let cart = [];

const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
const sheetName = "Sheet1";
const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";

const appsScriptEndpoint = "https://script.google.com/macros/s/AKfycbywL5OAII4O0RGMyGe5AgZsqrByQazZUnkuulEIzKMFMBDsN40eUvvaZ1I0OCLu0J8u/exec";

const googleSheetsAPI =
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;

let headerMap = {};
let inStockColLetter = "W"; // fallback if header not found

function columnIndexToLetter(index) {
  let letter = "";
  while (index > 0) {
    let mod = (index - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    index = Math.floor((index - mod) / 26);
  }
  return letter;
}

// LOAD PRODUCTS
async function loadProductsFromSheet() {
  try {
    const response = await fetch(googleSheetsAPI);
    const data = await response.json();
    const rows = data.values;
    if (!rows || rows.length < 2) return;

    const headers = rows[0];
    headerMap = {};
    headers.forEach((h, i) => (headerMap[h.trim()] = i));

    if (headerMap["in_stock"] != null) {
      const oneBased = headerMap["in_stock"] + 1;
      inStockColLetter = columnIndexToLetter(oneBased);
    }

    productsData = rows.slice(1).map((row, rowIndex) => {
      const item = {};
      headers.forEach((header, i) => {
        item[header] = (row[i] || "").toString().trim();
      });
      item.current_price = parseFloat(item.current_price) || 0;
      item.discount_price = parseFloat(item.discount_price) || 0;
      item.discount_percentage = parseFloat(item.discount_percentage) || 0;
      item.pueches_price = parseFloat(item.pueches_price) || 0;
      item.in_stock = item.in_stock || "0";
      item.image = item.image || "";
      item._row = rowIndex + 2;
      return item;
    }).filter((item) => item.name !== "");

    renderProductGrid();
  } catch (err) {
    console.error("Error loading products:", err);
  }
}



// RENDER PRODUCT GRID
function renderProductGrid() {
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) return;

  productGrid.innerHTML = productsData.map((product) => {
    const stock = parseInt(product.in_stock) || 0;
    return `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" width="100%">
        <h4>${product.name}</h4>
        <p>${product.current_price.toFixed(2)}</p>
        <p>Stock: ${stock}</p>
        <button onclick="addProductByCode('${(product.code || "").replace(/'/g, "\\'")}')">Add</button>
      </div>`;
  }).join("");
}

// ADD BY CODE
function addProductByCode(code) {
  code = (code || "").toString().trim();
  if (!code) return;

  const product = productsData.find((p) => (p.code || "").trim() === code);
  if (product) addProductToCart(product);
}

// SEARCH
function findProduct() {
  const raw = (document.getElementById("productSearch").value || "").trim();
  if (!raw) {
    alert("Please enter product code or name.");
    return;
  }

  const queryLower = raw.toLowerCase();
  const product = productsData.find((p) =>
    (p.code || "").toLowerCase() === queryLower ||
    (p.name || "").toLowerCase() === queryLower
  );

  if (product) {
    addProductToCart(product);
    document.getElementById("productSearch").value = "";
  } else {
    alert("Product not found in inventory");
  }
}

// ADD TO CART
function addProductToCart(product) {
  if (!product) return;

  const stock = parseInt(product.in_stock) || 0;
  const key = (product.code || product.name).trim();
  const existing = cart.find((item) => (item.code || item.name).trim() === key);

  if (existing) {
    if (existing.qty + 1 > stock) {
      alert(`Cannot add more. Only ${stock} in stock.`);
      return;
    }
    existing.qty += 1;
  } else {
    if (stock < 1) {
      alert(`Product out of stock!`);
      return;
    }
    cart.push({ ...product, qty: 1, customDiscount: "" });
  }
  renderCart();
}

// RENDER CART
function renderCart() {
  const tbody = document.getElementById("cartTableBody");
  if (!tbody) return;

  let total = 0, profit = 0;
  tbody.innerHTML = cart.map((item, idx) => {
    // Apply discount
    // Apply discount on current_price
    let basePrice = item.current_price;
    let discountValue = 0;

    if (item.customDiscount) {
      if (item.customDiscount.toString().includes("%")) {
        const perc = parseFloat(item.customDiscount) || 0;
        discountValue = (basePrice * perc) / 100;
      } else {
        discountValue = parseFloat(item.customDiscount) || 0;
      }
    } else if (item.discount_percentage > 0) {
      discountValue = (basePrice * item.discount_percentage) / 100;
    }

    const finalPrice = Math.max(basePrice - discountValue, 0);

    const itemTotal = finalPrice * item.qty;
    const itemProfit = (finalPrice - item.pueches_price) * item.qty;

    total += itemTotal;
    profit += itemProfit;

    return `<tr>
  <td>${item.code}</td>
  <td>${item.name}</td>
  <td>${finalPrice.toFixed(2)}</td>
  <td><input type="number" min="1" value="${item.qty}" style="width:50px" onchange="updateQty(${idx}, this.value)"></td>
  <td><input type="text" value="${item.customDiscount || item.discount_percentage + '%'}" style="width:70px" onchange="updateDiscount(${idx}, this.value)"></td>
  <td>${itemTotal.toFixed(2)}</td>
  <td><button onclick="removeFromCart('${(item.code || item.name).replace(/'/g, "\\'")}')">❌</button></td>
</tr>`;

  }).join("");

  document.getElementById("totalAmount").textContent = total.toFixed(2);
  document.getElementById("finalPrice").textContent = total.toFixed(2);
}

// Update qty/discount handlers
function updateQty(index, value) {
  value = parseInt(value) || 1;
  cart[index].qty = value;
  renderCart();
}

function updateDiscount(index, value) {
  cart[index].customDiscount = value.trim();
  renderCart();
}

// REMOVE
function removeFromCart(key) {
  cart = cart.filter((item) => (item.code || item.name) !== key);
  renderCart();
}

// CONFIRM PAYMENT + PRINT RECEIPT
async function confirmPayment() {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  const customerName = document.getElementById("customerName").value.trim() || "Walk-in Customer";
  const customerPhone = document.getElementById("customerPhone").value.trim() || "-";
  const paymentMethod = document.getElementById("paymentMethod")?.value || "Cash";

  // Calculate totals
  let totalAmount = 0, totalProfit = 0;
  const items = cart.map((item) => {
    let price = item.current_price;
    let discountValue = 0;

    if (item.customDiscount) {
      if (item.customDiscount.includes("%")) {
        discountValue = (price * (parseFloat(item.customDiscount) || 0)) / 100;
      } else {
        discountValue = parseFloat(item.customDiscount) || 0;
      }
    } else if (item.discount_percentage > 0) {
      discountValue = (price * item.discount_percentage) / 100;
    }

    const finalPriceEach = Math.max(price - discountValue, 0);
    const itemTotal = finalPriceEach * item.qty;
    const itemProfit = (finalPriceEach - item.pueches_price) * item.qty;

    totalAmount += itemTotal;
    totalProfit += itemProfit;

    return {
      code: item.code,
      name: item.name,
      qty: item.qty,
      priceEach: finalPriceEach,
      discount: item.customDiscount || (item.discount_percentage > 0 ? item.discount_percentage + "%" : "0"),
      total: itemTotal,
      profit: itemProfit
    };
  });

  const sale = {
    customerName,
    customerPhone,
    paymentMethod,
    items,
    totalAmount,
    totalProfit,
    timestamp: new Date().toISOString()
  };

  generateReceipt();
  window.print();

  // 🔴 Removed Google Sheets stock update

  // Save sale in Firebase only
  await saveSaleToFirebase(sale);

  // Reset cart
  cart = [];
  renderCart();
  renderProductGrid();
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
}


async function saveSaleToFirebase(sale) {
  if (!window.db) {
    throw new Error("Firebase db not initialized!");
  }

  try {
    const docRef = await window.db.collection("sales").add(sale);
    console.log("Sale saved with ID:", docRef.id);
  } catch (error) {
    console.error("Failed to save sale:", error);
  }
}









function printReceipt() {
  window.print();
}


// INITIAL
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromSheet();
});



// Example structure of product in cart:
// { code, name, price, qty, discount, in_stock, profit }

function updateQuantity(code, newQty) {
  let item = cart.find(p => p.code === code);
  if (!item) return;

  if (newQty > item.in_stock) {
    alert(`Only ${item.in_stock} units of "${item.name}" are available in stock.`);
    item.qty = item.in_stock; // cap at stock
  } else if (newQty < 1) {
    item.qty = 1; // minimum 1
  } else {
    item.qty = newQty;
  }

  renderCart();
}

// function confirmPayment() {
//   // Validate stock
//   for (let item of cart) {
//     if (item.qty > item.in_stock) {
//       alert(`Stock error: "${item.name}" has only ${item.in_stock} left, but you requested ${item.qty}.`);
//       return;
//     }
//   }

//   generateReceipt();
//   printReceipt();

//   // Update stock
//   cart.forEach(item => {
//     let newStock = item.in_stock - item.qty;
//     updateStockInSheet(item.code, newStock);
//   });

//   cart = [];
//   renderCart();
// }



function generateReceipt() {
  let receiptHTML = `
    <h3 style="text-align:center;">China Town Shop</h3>
    <p style="text-align:center;">B-Block Bus Stand Bogura</p>
    <p style="text-align:center;">Phone: +88013 3318 0868</p>
    <hr>
    <p><strong>Customer:</strong> ${document.getElementById("customerName").value || "Walk-in Customer"}<br>
    <strong>Phone:</strong> ${document.getElementById("customerPhone").value || "-"}</p>
    <table style="width:100%; border-collapse: collapse; font-size:12px;">
      <tr><th>Code</th><th>Name</th><th>Price</th><th>Qty</th><th>Total</th></tr>
  `;

  cart.forEach((item) => {
    let price = item.current_price;
    let discountValue = 0;

    if (item.customDiscount) {
      if (item.customDiscount.includes("%")) {
        discountValue = (price * (parseFloat(item.customDiscount) || 0)) / 100;
      } else {
        discountValue = parseFloat(item.customDiscount) || 0;
      }
    } else if (item.discount_percentage > 0) {
      discountValue = (price * item.discount_percentage) / 100;
    }

    const finalPriceEach = Math.max(price - discountValue, 0);
    const itemTotal = finalPriceEach * item.qty;

    receiptHTML += `<tr>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>${finalPriceEach.toFixed(2)}</td>
      <td>${item.qty}</td>
      <td>${itemTotal.toFixed(2)}</td>
    </tr>`;
  });

  receiptHTML += `</table><hr>
    <p><strong>Total:</strong> ${document.getElementById("totalAmount").textContent}</p>
    <p><strong>Final Price:</strong> ${document.getElementById("finalPrice").textContent}</p>
    <p style="text-align:center; font-size:12px;"> No Refunds Allowed</p>
  `;

  document.getElementById("receipt").innerHTML = receiptHTML;
}


// async function saveSaleToFirebase(sale) {
//   if (!window.db) {
//     throw new Error("Firebase db not initialized!");
//   }

//   try {
//     const docRef = await window.db.collection("sales").add({
//       items: sale.items || [],
//       total: sale.total || 0,
//       paymentMethod: sale.paymentMethod || "unknown",
//       timestamp: new Date(),
//       customer: sale.customer || null
//     });

//     console.log("Sale saved with ID:", docRef.id);
//   } catch (error) {
//     console.error("Failed to save sale:", error);
//   }
// }


function toggleProfit() {
  const profitCells = document.querySelectorAll(".profit-col, .profit-cell");
  const btn = document.getElementById("toggleProfitBtn");

  let isHidden = profitCells[0].style.display === "none" || profitCells[0].style.display === "";

  profitCells.forEach(cell => {
    cell.style.display = isHidden ? "table-cell" : "none";
  });

  btn.textContent = isHidden ? "Hide Profit" : "Show Profit";
}


//sale.js

// ===== Utilities =====
const TZB = "Asia/Dhaka"; // your default timezone
const fmtBDT = n => Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });

function toDate(val) {
    // Accepts ISO string, Date, or Firestore Timestamp
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
    // Firestore Timestamp object (v8)
    if (val.seconds != null && val.nanoseconds != null) {
        return new Date(val.seconds * 1000);
    }
    return null;
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
function startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfMonth(date) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0); // last day of month
    d.setHours(23, 59, 59, 999);
    return d;
}
function previousMonthRange(date) {
    const d = new Date(date);
    d.setDate(1); // first of this month
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - 1); // first of last month
    const start = new Date(d);
    const end = endOfMonth(start);
    return { start, end };
}
function within(d, start, end) {
    const t = d.getTime();
    return t >= start.getTime() && t <= end.getTime();
}
function hasAnyDiscount(items = []) {
    return items.some(it => {
        const disc = (it.discount || "").toString().trim();
        if (!disc) return false;
        if (disc === "0" || disc === "0%") return false;
        // treat numeric > 0 or a % string as discount applied
        const asNum = parseFloat(disc);
        return (disc.includes("%") && asNum > 0) || (!isNaN(asNum) && asNum > 0);
    });
}
function formatTime(d) {
    return d.toLocaleString("en-GB", { timeZone: TZB, year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function dateOnly(d) {
    return d.toLocaleDateString("en-CA", { timeZone: TZB }); // YYYY-MM-DD
}

// ===== State =====
let allSales = []; // loaded once, filtered on client
let filteredSales = [];

const els = {
    salesToday: document.getElementById("salesToday"),
    salesThisMonth: document.getElementById("salesThisMonth"),
    profitToday: document.getElementById("profitToday"),
    profitThisMonth: document.getElementById("profitThisMonth"),
    salesLastMonth: document.getElementById("salesLastMonth"),
    profitLastMonth: document.getElementById("profitLastMonth"),
    rangeSelect: document.getElementById("rangeSelect"),
    singleDate: document.getElementById("singleDate"),
    applyDateBtn: document.getElementById("applyDateBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    salesTbody: document.getElementById("salesTbody"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    toggleThemeBtn: document.getElementById("toggleThemeBtn")
};


async function loadAllSales() {
    const snap = await window.db.collection("sales").get();
    console.log("Docs fetched:", snap.docs.length);
    snap.docs.forEach(d => console.log(d.data()));
    allSales = snap.docs.map(d => {
        const data = d.data() || {};
        const ts = toDate(data.timestamp) || new Date(0);
        return {
            id: d.id,
            timestamp: ts,
            customerName: data.customerName || data.customer || "Walk-in Customer",
            customerPhone: data.customerPhone || "-",
            paymentMethod: data.paymentMethod || data.payment || "Unknown",
            items: Array.isArray(data.items) ? data.items : [],
            totalAmount: Number(data.totalAmount ?? data.total ?? 0),
            totalProfit: Number(data.totalProfit ?? data.profit ?? 0),
            raw: data
        };
    }).sort((a, b) => b.timestamp - a.timestamp);
}


// ===== Load & Compute =====
// async function loadPage(page, linkElement) {
//   const content = document.getElementById('content');
//   try {
//     document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
//     if (linkElement) linkElement.classList.add('active');

//     const response = await fetch(`${page}.html`);
//     if (!response.ok) throw new Error(`Failed to load ${page}.html`);
//     const html = await response.text();
//     content.innerHTML = html;

//     // Re-run fade effect
//     content.classList.remove('page-fade');
//     void content.offsetWidth;
//     content.classList.add('page-fade');

//     // ✅ If we loaded "sale", attach its JS after DOM injected
//     if (page === "sale") {
//       const script = document.createElement("script");
//       script.src = "sale.js";
//       document.body.appendChild(script);
//     }
//   } catch (error) {
//     content.innerHTML = `<p style="color:red;">Error loading page: ${error.message}</p>`;
//   }
// }



// 🔹 Test Firestore access
async function testFirestore() {
    try {
        const snapshot = await window.db.collection("sales").get();
        console.log("Documents in sales collection:", snapshot.size);

        snapshot.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (err) {
        console.error("Error reading Firestore:", err);
    }
}

testFirestore();


// Compute top cards: today, this month, last month
function updateSummaryCards(now = new Date()) {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const { start: lastMonthStart, end: lastMonthEnd } = previousMonthRange(now);

    let salesToday = 0, profitToday = 0;
    let salesMonth = 0, profitMonth = 0;
    let salesLastMonth = 0, profitLastMonth = 0;

    for (const s of allSales) {
        const d = s.timestamp;
        if (within(d, todayStart, todayEnd)) {
            salesToday += s.totalAmount;
            profitToday += s.totalProfit;
        }
        if (within(d, monthStart, monthEnd)) {
            salesMonth += s.totalAmount;
            profitMonth += s.totalProfit;
        }
        if (within(d, lastMonthStart, lastMonthEnd)) {
            salesLastMonth += s.totalAmount;
            profitLastMonth += s.totalProfit;
        }
    }

    els.salesToday.textContent = fmtBDT(salesToday);
    els.profitToday.textContent = fmtBDT(profitToday);
    els.salesThisMonth.textContent = fmtBDT(salesMonth);
    els.profitThisMonth.textContent = fmtBDT(profitMonth);
    els.salesLastMonth.textContent = fmtBDT(salesLastMonth);
    els.profitLastMonth.textContent = fmtBDT(profitLastMonth);
}

// Filter helpers
function getRangeDates(kind, base = new Date()) {
    const end = endOfDay(base);
    const start = (() => {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        switch (kind) {
            case "today": return d;
            case "yesterday":
                d.setDate(d.getDate() - 1);
                return d;
            case "last7":
                d.setDate(d.getDate() - 6);
                return d;
            case "last15":
                d.setDate(d.getDate() - 14);
                return d;
            case "last30":
                d.setDate(d.getDate() - 29);
                return d;
            default: return d;
        }
    })();

    // For yesterday, end should be endOfDay(yesterday)
    if (kind === "yesterday") {
        const yEnd = endOfDay(new Date(start));
        return { start, end: yEnd };
    }
    return { start, end };
}

function filterSalesByRange(kind, base = new Date()) {
    const { start, end } = getRangeDates(kind, base);
    filteredSales = allSales.filter(s => within(s.timestamp, start, end));
    renderSalesTable();
}

function filterSalesBySpecificDay(dayStr) {
    // dayStr: YYYY-MM-DD (local)
    const parts = dayStr.split("-");
    if (parts.length !== 3) return;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const start = startOfDay(d);
    const end = endOfDay(d);
    filteredSales = allSales.filter(s => within(s.timestamp, start, end));
    renderSalesTable();
}

// ===== Rendering =====
function renderSalesTable() {
    if (!els.salesTbody) return;
    if (!filteredSales.length) {
        els.salesTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; opacity:.8;">No sales found for the selected range.</td></tr>`;
        return;
    }

    const rows = filteredSales.map(sale => {
        const time = formatTime(sale.timestamp);
        const itemsHtml = sale.items.map(it => {
            const name = (it.name || "").toString();
            const qty = Number(it.qty || 0);
            const each = Number(it.priceEach || it.price || 0);
            return `<span class="item-pill" title="Each: ${fmtBDT(each)}">${name} × ${qty}</span>`;
        }).join(" ");

        const anyDisc = hasAnyDiscount(sale.items) ? "Yes" : "No";

        return `<tr>
  <td>${time}</td>
  <td>${sale.customerName}</td>
  <td>${sale.customerPhone}</td>
  <td>${itemsHtml}</td>
  <td>${anyDisc}</td>
  <td>${sale.paymentMethod}</td>
  <td>${fmtBDT(sale.totalAmount)}</td>
  <td>${fmtBDT(sale.totalProfit)}</td>
  <td>
    <button class="edit-btn" data-id="${sale.id}">Edit</button>
  </td>
</tr>`;

    }).join("");

    els.salesTbody.innerHTML = rows;
}

// ===== CSV Export =====
function exportCurrentToCsv() {
    const header = [
        "Time", "Customer", "Phone", "Items", "Discount?", "Payment", "Total", "Profit"
    ];
    const lines = [header.join(",")];

    for (const s of filteredSales) {
        const time = formatTime(s.timestamp).replace(/,/g, ""); // avoid CSV split issues
        const items = s.items.map(it => `${(it.name || "").replace(/,/g, "")}(x${it.qty || 0})`).join(" | ");
        const anyDisc = hasAnyDiscount(s.items) ? "Yes" : "No";
        const row = [
            time,
            (s.customerName || "").replace(/,/g, ""),
            (s.customerPhone || "").replace(/,/g, ""),
            items.replace(/\n/g, " "),
            anyDisc,
            (s.paymentMethod || "").replace(/,/g, ""),
            s.totalAmount,
            s.totalProfit
        ].join(",");
        lines.push(row);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_${dateOnly(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== Theme toggle (optional) =====
function initThemeToggle() {
    const btn = els.toggleThemeBtn;
    if (!btn) return;
    btn.addEventListener("click", () => {
        const html = document.documentElement;
        html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
}

// ===== Wire up =====
async function init() {
    initThemeToggle();

    // Default filters
    els.rangeSelect.addEventListener("change", () => {
        filterSalesByRange(els.rangeSelect.value);
    });

    els.applyDateBtn.addEventListener("click", () => {
        const day = els.singleDate.value;
        if (day) filterSalesBySpecificDay(day);
    });

    els.refreshBtn.addEventListener("click", async () => {
        await loadAllSales();
        updateSummaryCards(new Date());
        // re-apply current filter
        const kind = els.rangeSelect.value || "today";
        if (els.singleDate.value) {
            filterSalesBySpecificDay(els.singleDate.value);
        } else {
            filterSalesByRange(kind);
        }
    });

    els.exportCsvBtn.addEventListener("click", exportCurrentToCsv);

    // First load
    await loadAllSales();
    updateSummaryCards(new Date());

    // Default view = Today
    filterSalesByRange("today");
}

// Allow running manually after HTML is injected
if (document.getElementById("rangeSelect")) {
    init();
}


// After table render
// Open modal when Edit clicked
document.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    const saleId = e.target.dataset.id;
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return;

    // Fill customer fields
    document.getElementById("editCustomerName").value = sale.customerName;
    document.getElementById("editCustomerPhone").value = sale.customerPhone;
    document.getElementById("editPaymentMethod").value = sale.paymentMethod;

    // Fill items table
    renderEditItems(sale.items);

    // Store current editing ID
    document.getElementById("editModal").dataset.id = saleId;

    // Show modal
    document.getElementById("editModal").style.display = "block";
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveEditBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      // save logic
    });
  }

  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("editModal").style.display = "none";
    });
  }
});


document.getElementById("cancelEditBtn").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});



document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const saleId = document.getElementById("editModal").dataset.id;
  if (!saleId) return;

  // Collect edited data
  const updatedSale = {
    customerName: document.getElementById("editCustomerName").value,
    customerPhone: document.getElementById("editCustomerPhone").value,
    paymentMethod: document.getElementById("editPaymentMethod").value,
    items: Array.from(document.querySelectorAll("#editItemsBody tr")).map(row => ({
      name: row.querySelector(".edit-item-name").value,
      qty: Number(row.querySelector(".edit-item-qty").value),
      priceEach: Number(row.querySelector(".edit-item-price").value),
      discount: row.querySelector(".edit-item-discount").value
    })),
    totalAmount: Number(document.getElementById("calcTotalAmount").textContent.replace(/,/g, "")),
    totalProfit: Number(document.getElementById("calcTotalProfit").textContent.replace(/,/g, ""))
  };

  try {
    await window.db.collection("sales").doc(saleId).update(updatedSale);
    alert("Sale updated!");
    document.getElementById("editModal").style.display = "none";
    await loadAllSales();
    filterSalesByRange("today"); // refresh view
  } catch (err) {
    console.error("Save failed:", err);
    alert("Save failed. Check console.");
  }
});


// put this once, after DOM ready
document.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    const saleId = e.target.dataset.id;
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return;

    // Prefill modal
    document.getElementById("editCustomerName").value = sale.customerName;
    document.getElementById("editCustomerPhone").value = sale.customerPhone;
    document.getElementById("editPaymentMethod").value = sale.paymentMethod;
    document.getElementById("editTotalAmount").value = sale.totalAmount;
    document.getElementById("editTotalProfit").value = sale.totalProfit;

    document.getElementById("editModal").dataset.id = saleId;
    document.getElementById("editModal").style.display = "block";
  }
});


function renderEditItems(items = []) {
  const body = document.getElementById("editItemsBody");
  body.innerHTML = "";
  items.forEach((it, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" value="${it.name || ""}" class="edit-item-name"></td>
      <td><input type="number" value="${it.qty || 1}" class="edit-item-qty"></td>
      <td><input type="number" value="${it.priceEach || it.price || 0}" class="edit-item-price"></td>
      <td><input type="text" value="${it.discount || ""}" class="edit-item-discount"></td>
      <td><button class="remove-item-btn">❌</button></td>
    `;
    body.appendChild(row);
  });
  recalcTotals();
}

// On edit button click
document.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    const saleId = e.target.dataset.id;
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return;

    document.getElementById("editCustomerName").value = sale.customerName;
    document.getElementById("editCustomerPhone").value = sale.customerPhone;
    document.getElementById("editPaymentMethod").value = sale.paymentMethod;

    renderEditItems(sale.items);

    document.getElementById("editModal").dataset.id = saleId;
    document.getElementById("editModal").style.display = "block";
  }
});


function recalcTotals() {
  let total = 0, profit = 0;
  const rows = document.querySelectorAll("#editItemsBody tr");
  rows.forEach(row => {
    const qty = Number(row.querySelector(".edit-item-qty").value || 0);
    const price = Number(row.querySelector(".edit-item-price").value || 0);
    const disc = row.querySelector(".edit-item-discount").value || "";
    let subtotal = qty * price;

    // apply discount if any
    if (disc.includes("%")) {
      const perc = parseFloat(disc);
      if (!isNaN(perc)) subtotal -= subtotal * (perc / 100);
    } else {
      const flat = parseFloat(disc);
      if (!isNaN(flat)) subtotal -= flat;
    }

    total += subtotal;
    // simple profit model = 20% of sale (adjust as per your DB structure)
    profit += subtotal * 0.2;
  });

  document.getElementById("calcTotalAmount").textContent = fmtBDT(total);
  document.getElementById("calcTotalProfit").textContent = fmtBDT(profit);
}

document.getElementById("addItemBtn").addEventListener("click", () => {
  renderEditItems([
    ...Array.from(document.querySelectorAll("#editItemsBody tr")).map(row => ({
      name: row.querySelector(".edit-item-name").value,
      qty: Number(row.querySelector(".edit-item-qty").value),
      priceEach: Number(row.querySelector(".edit-item-price").value),
      discount: row.querySelector(".edit-item-discount").value
    })),
    { name: "", qty: 1, priceEach: 0, discount: "" }
  ]);
});

document.addEventListener("input", e => {
  if (e.target.closest("#editItemsBody")) recalcTotals();
});
document.addEventListener("click", e => {
  if (e.target.classList.contains("remove-item-btn")) {
    e.target.closest("tr").remove();
    recalcTotals();
  }
});

