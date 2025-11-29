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

// // LOAD PRODUCTS
// async function loadProductsFromSheet() {
//   try {
//     const response = await fetch(googleSheetsAPI);
//     const data = await response.json();
//     const rows = data.values;
//     if (!rows || rows.length < 2) return;

//     const headers = rows[0];
//     headerMap = {};
//     headers.forEach((h, i) => (headerMap[h.trim()] = i));

//     if (headerMap["in_stock"] != null) {
//       const oneBased = headerMap["in_stock"] + 1;
//       inStockColLetter = columnIndexToLetter(oneBased);
//     }

//     productsData = rows.slice(1).map((row, rowIndex) => {
//       const item = {};
//       headers.forEach((header, i) => {
//         item[header] = (row[i] || "").toString().trim();
//       });
//       item.current_price = parseFloat(item.current_price) || 0;
//       item.discount_price = parseFloat(item.discount_price) || 0;
//       item.discount_percentage = parseFloat(item.discount_percentage) || 0;
//       item.purchase_price = parseFloat(item.purchase_price) || 0;
//       item.in_stock = item.in_stock || "0";
//       item.image = item.image || "";
//       item._row = rowIndex + 2;
//       return item;
//     }).filter((item) => item.name !== "");

//     renderProductGrid();
//   } catch (err) {
//     console.error("Error loading products:", err);
//   }
// }

// LOAD PRODUCTS FROM ALL SHEETS
async function loadProductsFromSheet() {
  try {
    // 1️⃣ Get metadata to know all sheet names
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const metaRes = await fetch(metaUrl);
    const metaData = await metaRes.json();
    const sheetNames = metaData.sheets.map(s => s.properties.title);

    let allProducts = [];

    // 2️⃣ Loop through each sheet and load its rows
    for (let sheet of sheetNames) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.values || data.values.length < 2) continue;

      const headers = data.values[0].map(h => h.trim());
      let localHeaderMap = {};
      headers.forEach((h, i) => (localHeaderMap[h] = i));

      // find in_stock column if exists
      let localInStockColLetter = "W";
      if (localHeaderMap["in_stock"] != null) {
        const oneBased = localHeaderMap["in_stock"] + 1;
        localInStockColLetter = columnIndexToLetter(oneBased);
      }

      const products = data.values.slice(1).map((row, rowIndex) => {
        const item = {};
        headers.forEach((header, i) => {
          item[header] = (row[i] || "").toString().trim();
        });
        item.current_price = parseFloat(item.current_price) || 0;
        item.discount_price = parseFloat(item.discount_price) || 0;
        item.discount_percentage = parseFloat(item.discount_percentage) || 0;
        item.purchase_price = parseFloat(item.purchase_price) || 0;
        item.in_stock = item.in_stock || "0";
        item.image = item.image || "";
        item._row = rowIndex + 2;
        item._sheet = sheet; // ✅ track which sheet it came from
        return item;
      }).filter((item) => item.name !== "");

      allProducts.push(...products);
    }

    // 3️⃣ Store merged products and render
    productsData = allProducts;
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

  let total = 0, profit = 0, totalItems = 0;
  let totalDiscount = 0;

  tbody.innerHTML = cart.map((item, idx) => {
    let basePrice = item.current_price;
    let discountValue = 0;

    // Check for discount
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

    // Final price and discount
    const finalPrice = Math.max(basePrice - discountValue, 0);
    const itemTotal = finalPrice * item.qty;
    const itemProfit = (finalPrice - item.purchase_price) * item.qty;
    const itemDiscountTotal = discountValue * item.qty;

    total += itemTotal;
    profit += itemProfit;
    totalItems += item.qty;
    totalDiscount += itemDiscountTotal;


    return `<tr>
    <td>${item.code}</td>
  <td><span class="product-name" style="color:blue; cursor:pointer;" onclick="showProductModal(${idx})">${item.name}</span></td>
  <td>${finalPrice.toFixed(2)}</td>
  <td><input type="number" min="1" value="${item.qty}" style="width:50px" onchange="updateQty(${idx}, this.value)"></td>
  <td><input type="text" value="${item.customDiscount || item.discount_percentage + '%'}" style="width:70px" onchange="updateDiscount(${idx}, this.value)"></td>
  <td>${itemTotal.toFixed(2)}</td>
  <td><button onclick="removeFromCart('${(item.code || item.name).replace(/'/g, "\\'")}')"><lord-icon
    src="https://cdn.lordicon.com/jzinekkv.json"
    trigger="hover"
    colors="primary:#ffffff,secondary:#ffffff"
    style="width:25px;height:25px">
  </lord-icon></button></td>
</tr>`;

  }).join("");

  // Update summary
  document.getElementById("totalAmount").textContent = (total + totalDiscount).toFixed(2);
  document.getElementById("discountApplied").textContent = totalDiscount > 0 ? totalDiscount.toFixed(2) : "0.00";
  document.getElementById("totalProducts").textContent = totalItems;
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

  // ✅ Check if customer already exists
  let existingCustomer = customerCache.find(c =>
    (c.name?.toLowerCase() === customerName.toLowerCase()) &&
    (c.phone === customerPhone)
  );

  // ✅ If not found and not walk-in, add to Firestore
  if (!existingCustomer && customerName !== "Walk-in Customer") {
    try {
      const newCustomer = { name: customerName, phone: customerPhone };
      const docRef = await db.collection("customers").add(newCustomer);
      console.log("New customer added with ID:", docRef.id);
      // Add to cache immediately
      customerCache.push({ id: docRef.id, ...newCustomer });
    } catch (err) {
      console.error("Failed to add new customer:", err);
    }
  }

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
    const itemProfit = (finalPriceEach - item.purchase_price) * item.qty;

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

  // 🔽 Deduct stock in products collection
  for (let item of sale.items) {
    const prodSnap = await db.collection("products").where("code", "==", item.code).get();
    prodSnap.forEach(async (doc) => {
      const newStock = (doc.data().in_stock || 0) - item.qty;
      await db.collection("products").doc(doc.id).update({
        in_stock: newStock,
        needsUpdate: newStock <= 0 // mark if out of stock
      });
    });
  }

  // Reset cart
  cart = [];
  renderCart();
  renderProductGrid();
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
}

// async function saveSaleToFirebase(sale) {
//   if (!window.db) {
//     throw new Error("Firebase db not initialized!");
//   }

//   try {
//     // 🕒 Build a readable sale ID
//     const now = new Date();
//     const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20251102
//     const timePart = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
//     const safeName = (sale.customerName || "Guest").replace(/\s+/g, "_");
//     const saleId = `SALE_${safeName}_${datePart}_${timePart}`;

//     // 🧾 Add the sale with that ID
//     await window.db.collection("sales").doc(saleId).set(sale);

//     console.log("✅ Sale saved with ID:", saleId);
//   } catch (error) {
//     console.error("❌ Failed to save sale:", error);
//   }
// }



async function saveSaleToFirebase(sale) {
  if (!window.db) throw new Error("Firebase db not initialized!");

  try {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // e.g. 2025-11-02
    const safeName = (sale.customerName || "Walkin").replace(/\s+/g, "_");

    // 🔢 Optional: generate a small random suffix or counter
    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();

    const saleId = `${datePart}_${safeName}_${shortId}`;

    await window.db.collection("sales").doc(saleId).set(sale);

    console.log("✅ Sale saved with ID:", saleId);
  } catch (error) {
    console.error("❌ Failed to save sale:", error);
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



// --- Sync in_stock from Firebase into productsData (call after loading sheet)
async function syncStockFromFirebase() {
  if (!window.db || !productsData || productsData.length === 0) return;

  // Option: do sequential queries (safe). If you have many products you can batch/parallelize.
  for (let prod of productsData) {
    try {
      const q = await db.collection("products")
        .where("code", "==", (prod.code || "").toString().trim())
        .limit(1)
        .get();
      if (!q.empty) {
        const doc = q.docs[0];
        // store firebase id and use firebase stock as source of truth
        prod._firebaseId = doc.id;
        prod.in_stock = String(doc.data().in_stock || 0);
      } else {
        prod._firebaseId = null;
      }
    } catch (err) {
      console.error("syncStockFromFirebase error for", prod.code, err);
    }
  }
}



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


function liveSearch(query) {
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (!query.trim()) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const q = query.toLowerCase();
  const matches = productsData.filter(p =>
    (p.code || "").toLowerCase().includes(q) ||
    (p.name || "").toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    suggestionsBox.innerHTML = "<div class='suggestion-item'>No results</div>";
    return;
  }

  suggestionsBox.innerHTML = matches.map(product => `
    <div class="suggestion-item" onclick="selectProduct('${product.code}')">
      <img src="${product.image || 'https://via.placeholder.com/40'}" alt="${product.name}">
      <div class="suggestion-details">
        <span><strong>${product.name}</strong></span>
        <span>Code: ${product.code} | Price: ${product.current_price.toFixed(2)}</span>
      </div>
    </div>
  `).join("");
}

function selectProduct(code) {
  const product = productsData.find(p => p.code === code);
  if (product) {
    addProductToCart(product);
    document.getElementById("productSearch").value = "";
    document.getElementById("searchSuggestions").innerHTML = "";
  }
}

let customerCache = [];

async function loadCustomers() {
  if (!window.db) return;
  try {
    const snap = await window.db.collection("customers").get();
    customerCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error loading customers:", err);
  }
}

// Call when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadCustomers();
});

function searchCustomer(query, type) {
  query = query.toLowerCase();
  let results = [];

  if (type === "name") {
    results = customerCache.filter(c =>
      c.name && c.name.toLowerCase().includes(query)
    );
  } else if (type === "phone") {
    results = customerCache.filter(c =>
      c.phone && c.phone.toLowerCase().includes(query)
    );
  }

  showSuggestions(results, type);
}

function showSuggestions(results, type) {
  const container = type === "name" ? document.getElementById("nameSuggestions") : document.getElementById("phoneSuggestions");
  container.innerHTML = "";

  results.slice(0, 5).forEach(cust => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.textContent = type === "name" ? `${cust.name} (${cust.phone || ''})` : `${cust.phone} (${cust.name || ''})`;

    div.onclick = () => {
      document.getElementById("customerName").value = cust.name || "";
      document.getElementById("customerPhone").value = cust.phone || "";
      container.innerHTML = ""; // clear suggestions
    };

    container.appendChild(div);
  });
}

function showProductModal(idx) {
  const item = cart[idx];
  if (!item) return;

  let basePrice = item.current_price;
  let discountValue = 0;

  if (item.customDiscount) {
    if (item.customDiscount.includes("%")) {
      discountValue = (basePrice * (parseFloat(item.customDiscount) || 0)) / 100;
    } else {
      discountValue = parseFloat(item.customDiscount) || 0;
    }
  } else if (item.discount_percentage > 0) {
    discountValue = (basePrice * item.discount_percentage) / 100;
  }

  const finalPrice = Math.max(basePrice - discountValue, 0);
  const profit = finalPrice - item.purchase_price;

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <img src="${item.image || 'https://via.placeholder.com/150'}" alt="${item.name}">
    <h3>${item.name}</h3>
    <p>Purchase Price: ${item.purchase_price.toFixed(2)}</p>
    <p>Sell Price: ${finalPrice.toFixed(2)}</p>
    <p>Profit: ${profit.toFixed(2)}</p>
  `;

  document.getElementById("productModal").style.display = "block";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

// Close modal if clicked outside
window.onclick = function (event) {
  const modal = document.getElementById("productModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}
