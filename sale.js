// ===== Utilities =====
window.TZB = "Asia/Dhaka"; // your default timezone
window.fmtBDT = n => Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });

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
window.allSales = window.allSales || []; // loaded once, filtered on client
window.filteredSales = window.filteredSales || [];

window.els = {
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
  <button class="view-btn" data-id="${sale.id}">View</button>
  <button class="edit-btn" data-id="${sale.id}">Edit</button>
  <button class="delete-btn" data-id="${sale.id}">Delete</button>
</td>


</tr>`;

  }).join("");

  els.salesTbody.innerHTML = rows;
}

// ===== CSV Export =====
function exportCurrentToCsv() {
  const header = [
    "Time", "Customer", "Phone", "Items", "Discount", "Payment", "Total", "Profit"
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
    document.getElementById("editModal");
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
    document.getElementById("editModal");
  }
});


function renderEditItems(items = []) {
  const body = document.getElementById("editItemsBody");
  body.innerHTML = "";
  items.forEach(it => {
    const row = document.createElement("tr");
    row.dataset.profit = it.profit || 0; // 🔥 store real profit from Firestore
    row.innerHTML = `
      <td><input type="text" value="${it.name || ""}" class="edit-item-name"></td>
      <td><input type="number" value="${it.qty || 1}" class="edit-item-qty"></td>
      <td><input type="number" value="${it.priceEach || it.price || 0}" class="edit-item-price"></td>
      <td><input type="text" value="${it.discount || "0"}" class="edit-item-discount"></td>
      <td><button class="remove-item-btn">❌</button></td>
    `;
    body.appendChild(row);
  });
  recalcTotals();
}



// Remove item
document.addEventListener("click", e => {
  if (e.target.classList.contains("remove-item-btn")) {
    e.target.closest("tr").remove();
    recalcTotals();
  }
});


function recalcTotals() {
  let total = 0;
  let totalProfit = 0;

  const rows = document.querySelectorAll("#editItemsBody tr");
  rows.forEach(row => {
    const qty = Number(row.querySelector(".edit-item-qty").value || 0);
    const price = Number(row.querySelector(".edit-item-price").value || 0);
    const disc = row.querySelector(".edit-item-discount").value || "0";
    const profitPerUnit = Number(row.dataset.profit || 0); // ✅ from Firestore

    let subtotal = qty * price;

    // Handle discount (either flat or %)
    if (disc.includes("%")) {
      const perc = parseFloat(disc);
      if (!isNaN(perc)) subtotal -= subtotal * (perc / 100);
    } else {
      const flat = parseFloat(disc);
      if (!isNaN(flat)) subtotal -= flat;
    }

    total += subtotal;
    totalProfit += profitPerUnit * qty; // ✅ correct calculation
  });

  document.getElementById("calcTotalAmount").textContent = fmtBDT(total);
  document.getElementById("calcTotalProfit").textContent = fmtBDT(totalProfit);
}



// Recalculate on input change
document.addEventListener("input", e => {
  if (e.target.closest("#editItemsBody")) recalcTotals();
});




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
    document.getElementById("editModal").style.display = "flex";
  }
});


function recalcTotals() {
  let total = 0;
  let totalProfit = 0;

  const rows = document.querySelectorAll("#editItemsBody tr");
  rows.forEach(row => {
    const qty = Number(row.querySelector(".edit-item-qty").value || 0);
    const price = Number(row.querySelector(".edit-item-price").value || 0);
    const disc = row.querySelector(".edit-item-discount").value || "0";
    const profitPerUnit = Number(row.dataset.profit || 0); // store from Firebase later

    let subtotal = qty * price;

    // Handle discount (either flat or %)
    if (disc.includes("%")) {
      const perc = parseFloat(disc);
      if (!isNaN(perc)) subtotal -= subtotal * (perc / 100);
    } else {
      const flat = parseFloat(disc);
      if (!isNaN(flat)) subtotal -= flat;
    }

    total += subtotal;
    totalProfit += profitPerUnit * qty;
  });

  document.getElementById("calcTotalAmount").textContent = fmtBDT(total);
  document.getElementById("calcTotalProfit").textContent = fmtBDT(totalProfit);
}


document.addEventListener("DOMContentLoaded", () => {
  const addItemBtn = document.getElementById("addItemBtn");
  if (addItemBtn) {
    addItemBtn.addEventListener("click", () => {
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
  }
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


// ===== VIEW BUTTON - Center Popup =====
document.addEventListener("click", e => {
  if (e.target.classList.contains("view-btn")) {
    const saleId = e.target.dataset.id;
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return;

    const toast = document.getElementById("toastPopup");
    const overlay = document.getElementById("toastOverlay");

    const itemsHtml = sale.items.map(it => `
      <tr>
        <td>${it.code || "-"}</td>
        <td>${it.name || "-"}</td>
        <td>${it.qty || 0}</td>
        <td>${fmtBDT(it.priceEach || 0)}</td>
        <td>${it.discount || "0"}</td>
        <td>${fmtBDT(it.total || (it.qty * it.priceEach))}</td>
        <td>${fmtBDT(it.profit || 0)}</td>
      </tr>
    `).join("");

    toast.innerHTML = `
      <button class="close-toast">×</button>
      <h4>Sale Details</h4>
      <p><b>Customer:</b> ${sale.customerName}</p>
      <p><b>Phone:</b> ${sale.customerPhone}</p>
      <p><b>Payment:</b> ${sale.paymentMethod}</p>
      <p><b>Date:</b> ${formatTime(sale.timestamp)}</p>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Each</th>
            <th>Discount</th>
            <th>Total</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><b>Total Amount:</b> ${fmtBDT(sale.totalAmount)} BDT</p>
      <p><b>Total Profit:</b> ${fmtBDT(sale.totalProfit)} BDT</p>
    `;

    toast.style.display = "block";
    overlay.style.display = "block";
  }

  // Close popup
  if (e.target.classList.contains("close-toast") || e.target.id === "toastOverlay") {
    document.getElementById("toastPopup").style.display = "none";
    document.getElementById("toastOverlay").style.display = "none";
  }
});




document.addEventListener("DOMContentLoaded", () => {
  const addItemBtn = document.getElementById("addItemBtn");
  if (!addItemBtn) return; // prevent null error

  addItemBtn.addEventListener("click", () => {
    const tbody = document.getElementById("editItemsBody");
    const row = document.createElement("tr");
    row.dataset.profit = 0;
    row.innerHTML = `
      <td><input type="text" class="edit-item-name"></td>
      <td><input type="number" value="1" class="edit-item-qty"></td>
      <td><input type="number" value="0" class="edit-item-price"></td>
      <td><input type="text" value="0" class="edit-item-discount"></td>
      <td><button class="remove-item-btn">❌</button></td>
    `;
    tbody.appendChild(row);
    recalcTotals();
  });
});


document.addEventListener("click", e => {
  if (e.target.classList.contains("remove-item-btn")) {
    e.target.closest("tr").remove();
    recalcTotals();
  }
});

document.addEventListener("input", e => {
  if (e.target.closest("#editItemsBody")) recalcTotals();
});




// ===== DELETE BUTTON =====
document.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-btn")) {
    const saleId = e.target.dataset.id;
    if (!saleId) return;

    const confirmDelete = confirm("Are you sure you want to delete this sale?");
    if (!confirmDelete) return;

    try {
      await window.db.collection("sales").doc(saleId).delete();
      alert("Sale deleted successfully!");

      // Remove from local array + refresh table
      allSales = allSales.filter(s => s.id !== saleId);
      filteredSales = filteredSales.filter(s => s.id !== saleId);
      renderSalesTable();
      updateSummaryCards(new Date());
    } catch (err) {
      console.error("Error deleting sale:", err);
      alert("Failed to delete sale. Check console.");
    }
  }
});
