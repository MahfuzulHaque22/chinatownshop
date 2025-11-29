// ================= Sidebar Toggle =================
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('collapsed');
  sidebar.classList.toggle('expanded');
}



// ================= Theme Toggle =================
function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  document.getElementById("theme-light-btn").style.display = isLight ? "inline-block" : "none";
  document.getElementById("theme-dark-btn").style.display = isLight ? "none" : "inline-block";
}

// Initialize theme buttons on load
function initTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme") || "light";
  document.getElementById("theme-light-btn").style.display = currentTheme === "dark" ? "inline-block" : "none";
  document.getElementById("theme-dark-btn").style.display = currentTheme === "light" ? "inline-block" : "none";
}

// ================= Dropdown Toggle =================
function initDropdowns() {
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      e.preventDefault();
      // close other dropdowns
      document.querySelectorAll('.dropdown').forEach(d => {
        if (d !== toggle.parentElement) d.classList.remove('open');
      });
      toggle.parentElement.classList.toggle('open');
    });
  });
}

// ================= Settings Menu =================
function initSettingsMenu() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');

  settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    settingsMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    settingsMenu.classList.remove('show');
  });

  // Settings menu click actions
  document.querySelectorAll('#settings-menu li a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const text = e.target.textContent.trim();
      if (text === "Profile") loadPage("profile");
      else if (text === "Preferences") loadPage("preferences");
      else if (text === "Logout") logoutAndRedirect();
    });
  });
}

// ================= Logout =================
function logoutAndRedirect() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

// ================= SPA Page Loader =================
async function loadPage(page, linkElement = null) {
  const content = document.getElementById('content');

  try {
    // Remove active class from all links
    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
    if (linkElement) linkElement.classList.add('active');

    if (page.toLowerCase() === "order") {
      loadAdminOrdersPage();
      return;
    }

    if (page.toLowerCase() === "preorder") {
      loadAdminPreOrdersPage();
      return;
    }



    const response = await fetch(`${page}.html`);
    if (!response.ok) throw new Error(`Failed to load ${page}.html`);
    const html = await response.text();
    content.innerHTML = html;

    // Fade animation
    content.classList.remove('page-fade');
    void content.offsetWidth;
    content.classList.add('page-fade');

    // Load page-specific scripts
    if (page === "home") {
      fetchTodaySummary();
    }

    if (page === "stock") {
      stockpage();
    }

    if (page === "customer") {
      initCustomerPage();
    }

    if (page === "supplier") {
      initSupplierPage()
    }


    if (page === "sale") {
      const script = document.createElement("script");
      script.src = "sale.js";
      document.body.appendChild(script);
    }


    if (page === "pos_wishlist") {
      loadAdminWishlistPage()
    }

    if (page === "booking") {
      initBookingPage()
    }

      if (page === "expences") {
       expeces()
    }

    if (page === "add") {
      loadGoogleSheetEditorPage()
    }

  } catch (error) {
    content.innerHTML = `<p style="color:red;">Error loading page: ${error.message}</p>`;
  }
}

// ================= Admin Orders Page =================
function loadAdminOrdersPage() {
  console.log("Loading Admin Orders Page...");
  const content = document.getElementById("content") || document.body;

  content.innerHTML = `
    <div class="container">
      <table id="ordersTable">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Number</th>
            <th>TxID</th>
            <th>Amount</th>
            <th>Products</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  if (!window.firebase || !firebase.firestore) {
    console.error("Firebase not found or wrong SDK version.");
    return;
  }

  const db = firebase.firestore();
  const ordersRef = db.collection("orders");
  const ordersTableBody = document.querySelector("#ordersTable tbody");

  const statusOptions = [
    "order_placed_payment_in_review",
    "payment_confirmed",
    "product_in_query",
    "product_in_delivery",
    "order_complete"
  ];

  // Live updates
  ordersRef.onSnapshot(snapshot => {
    console.log("Orders snapshot received", snapshot.size);
    ordersTableBody.innerHTML = "";

    snapshot.forEach(doc => {
      const order = doc.data();
      const row = document.createElement("tr");

      const products = (order.items || [])
        .map(item => `${item.name} (x${item.quantity || 1})`)
        .join(", ");

      const badgeClass = `badge badge-${order.status || "order_placed_payment_in_review"}`;
      const badgeText = (order.status || "").replace(/_/g, " ");

      row.innerHTML = `
        <td>${order.name || "Unknown"}</td>
        <td>${order.number || "N/A"}</td>
        <td>${order.txid || "N/A"}</td>
        <td>৳${order.amount || 0}</td>
        <td>${products || "No products"}</td>
        <td>
          <span class="${badgeClass}">${badgeText}</span><br>
          <select data-id="${doc.id}">
            ${statusOptions.map(
        s => `<option value="${s}" ${s === order.status ? "selected" : ""}>
                       ${s.replace(/_/g, " ")}
                     </option>`
      ).join("")}
          </select>
        </td>
      `;

      ordersTableBody.appendChild(row);
    });

    // Attach change listeners
    document.querySelectorAll("select[data-id]").forEach(select => {
      select.addEventListener("change", async e => {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        const orderRef = ordersRef.doc(orderId);

        select.disabled = true;
        try {
          // Update the main order doc
          await orderRef.update({ status: newStatus });
          console.log("✅ Status updated:", newStatus);

          // Add timeline entry to subcollection
          await orderRef.collection("timeline").add({
            status: newStatus,
            time: firebase.firestore.FieldValue.serverTimestamp(),
            by: "admin"
          });
          console.log("📌 Timeline entry added");
        } catch (err) {
          console.error("Update failed", err);
          alert(`Failed to update status: ${err.message}`);
        } finally {
          select.disabled = false;
        }
      });
    });
  }, err => {
    console.error("Snapshot error", err);
  });
}


// ================= Admin PreOrder Page =================
function loadAdminPreOrdersPage() {
  console.log("Loading Admin Preorders Page...");
  const content = document.getElementById("content") || document.body;

  content.innerHTML = `
    <div class="container">
      <table id="preordersTable">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Number</th>
            <th>Email</th>
            <th>Product</th>
            <th>Address</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  if (!window.firebase || !firebase.firestore) {
    console.error("Firebase not found or wrong SDK version.");
    return;
  }

  const db = firebase.firestore();
  const preordersRef = db.collection("preorders");
  const preordersTableBody = document.querySelector("#preordersTable tbody");

  const statusOptions = [
    "Requested",
    "Accepted",
    "payment_complete",
    "in_query",
    "available_in_store",
    "complete"
  ];

  preordersRef.onSnapshot(snapshot => {
    console.log("Preorders snapshot received", snapshot.size);
    preordersTableBody.innerHTML = "";

    if (snapshot.empty) {
      preordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No preorders available</td></tr>`;
      return;
    }

    snapshot.forEach(doc => {
      const preorder = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${preorder.userName || "Unknown"}</td>
        <td>${preorder.userPhone || "N/A"}</td>
        <td>${preorder.userEmail || "N/A"}</td>
        <td>${preorder.productName || "Unknown"} (${preorder.productCode || ""})</td>
        <td>${preorder.userAddress || "N/A"}</td>
        <td>
          <span class="badge badge-${preorder.status || "accepted"}">${(preorder.status || "").replace(/_/g, " ")}</span><br>
          <select data-id="${doc.id}">
            ${statusOptions.map(
        s => `<option value="${s}" ${s === preorder.status ? "selected" : ""}>${s.replace(/_/g, " ")}</option>`
      ).join('')}
          </select>
        </td>
      `;

      preordersTableBody.appendChild(row);
    });

    // Attach change listeners
    document.querySelectorAll("select[data-id]").forEach(select => {
      select.addEventListener("change", async e => {
        const preorderId = e.target.dataset.id;
        const newStatus = e.target.value;
        const preorderRef = preordersRef.doc(preorderId);

        select.disabled = true;
        try {
          await preorderRef.update({ status: newStatus });
          console.log("✅ Status updated:", newStatus);

          await preorderRef.collection("timeline").add({
            status: newStatus,
            time: firebase.firestore.FieldValue.serverTimestamp(),
            by: "admin"
          });
          console.log("📌 Timeline entry added");
        } catch (err) {
          console.error("Update failed", err);
          alert(`Failed to update preorder: ${err.message}`);
        } finally {
          select.disabled = false;
        }
      });
    });
  }, err => {
    console.error("Snapshot error", err);
  });
}



// ================= Home Page Summary =================
// Replace your existing fetchTodaySummary with this safe version
/* pos.js -- fixed chart sizing (Chart.js) */

/*
  NOTE: Chart.js must be loaded BEFORE this script:
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="pos.js"></script>
*/

let yearlyChartInstance = null;

async function fetchTodaySummary() {
  try {
    const elTodaySales = document.getElementById("todaySales");
    const elTodayProfit = document.getElementById("todayProfit");
    const elMonthSales = document.getElementById("monthSales");
    const elMonthProfit = document.getElementById("monthProfit");
    const elLastMonthSales = document.getElementById("lastMonthSales");
    const elLastMonthProfit = document.getElementById("lastMonthProfit");

    if (!window.firebase) {
      console.error("Firebase not loaded");
      return;
    }

    const snapshot = await firebase.firestore().collection("sales").get();

    let todaySales = 0, todayProfit = 0;
    let monthSales = 0, monthProfit = 0;
    let lastMonthSales = 0, lastMonthProfit = 0;

    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = monthStart;

    // monthly aggregation for current year
    let monthlyData = Array.from({ length: 12 }, () => ({ sales: 0, profit: 0 }));

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data || !data.timestamp) return;

      let saleDate = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      if (isNaN(saleDate)) return;

      let saleAmount = Number(data.totalAmount || 0);
      let saleProfit = Number(data.totalProfit || 0);

      // today
      if (saleDate >= today && saleDate < tomorrow) {
        todaySales += saleAmount;
        todayProfit += saleProfit;
      }
      // this month
      if (saleDate >= monthStart && saleDate < nextMonthStart) {
        monthSales += saleAmount;
        monthProfit += saleProfit;
      }
      // last month
      if (saleDate >= lastMonthStart && saleDate < thisMonthStart) {
        lastMonthSales += saleAmount;
        lastMonthProfit += saleProfit;
      }

      // yearly chart (current year)
      if (saleDate.getFullYear() === now.getFullYear()) {
        monthlyData[saleDate.getMonth()].sales += saleAmount;
        monthlyData[saleDate.getMonth()].profit += saleProfit;
      }
    });

    // update UI
    if (elTodaySales) elTodaySales.textContent = todaySales.toLocaleString();
    if (elTodayProfit) elTodayProfit.textContent = todayProfit.toLocaleString();
    if (elMonthSales) elMonthSales.textContent = monthSales.toLocaleString();
    if (elMonthProfit) elMonthProfit.textContent = monthProfit.toLocaleString();
    if (elLastMonthSales) elLastMonthSales.textContent = lastMonthSales.toLocaleString();
    if (elLastMonthProfit) elLastMonthProfit.textContent = lastMonthProfit.toLocaleString();

    // draw chart
    drawYearlyChart(monthlyData);

  } catch (err) {
    console.error("Error fetching summary:", err);
  }
}

function drawYearlyChart(monthlyData) {
  const canvas = document.getElementById("yearlyChart");
  if (!canvas) return; // nothing to draw into

  const ctx = canvas.getContext("2d");

  // destroy previous instance to avoid leaks
  if (yearlyChartInstance) {
    try { yearlyChartInstance.destroy(); } catch (e) { /* ignore */ }
    yearlyChartInstance = null;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const salesData = monthlyData.map(m => m.sales);
  const profitData = monthlyData.map(m => m.profit);

  yearlyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Sales",
          data: salesData,
          backgroundColor: "rgba(66, 133, 244, 0.85)",
          borderColor: "rgba(66, 133, 244, 1)",
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
        {
          label: "Profit",
          data: profitData,
          type: "line", // combo: line on top of bars
          fill: false,
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderColor: "rgba(15, 157, 88, 1)",
          backgroundColor: "rgba(15, 157, 88, 0.9)",
          yAxisID: "y",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // safe because parent has fixed height
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 12, padding: 12 }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              let val = context.raw;
              if (typeof val === "number") return context.dataset.label + ": " + val.toLocaleString();
              return context.dataset.label + ": " + val;
            }
          }
        }
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, minRotation: 0 }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) { return value.toLocaleString(); }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart"
      }
    }
  });
}

// run once on load
fetchTodaySummary();



// ================= Sidebar Links =================
function initSidebarLinks() {
  document.querySelectorAll('.nav a[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      loadPage(page, link);
    });
  });
}

// ================= Initialize Everything on DOMContentLoaded =================
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDropdowns();
  initSettingsMenu();
  initSidebarLinks();

  // Load Home by default
  const homeLink = document.querySelector('.nav a[data-page="home"]');
  if (homeLink) loadPage("home", homeLink);
});



// customer 
function initCustomerPage() {
  // =================== ADMIN CHECK ===================
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      alert("Not authorized");
      await firebase.auth().signOut();
      window.location.href = "index.html";
    }
  });

  // =================== FORM & LIST TOGGLES ===================
  const showFormBtn = document.getElementById("showFormBtn");
  const hideFormBtn = document.getElementById("hideFormBtn");
  const customerFormContainer = document.getElementById("customerFormContainer");
  const customerListContainer = document.getElementById("customerListContainer");

  showFormBtn.addEventListener("click", () => {
    customerFormContainer.style.display = "block";
    customerListContainer.style.display = "none";
  });
  hideFormBtn.addEventListener("click", () => {
    customerFormContainer.style.display = "none";
    customerListContainer.style.display = "block";
    resetForm();
  });

  // =================== CUSTOMER LIST ===================
  const customerListBody = document.getElementById("customerListBody");
  async function loadCustomerList() {
    customerListBody.innerHTML = "";
    const combined = [];

    try {
      // POS Customers
      const customersSnap = await db.collection("customers").get();
      customersSnap.forEach(doc => {
        combined.push({ ...doc.data(), id: doc.id, type: "POS Customer" });
      });

      // Online Users
      const usersSnap = await db.collection("users").get();
      usersSnap.forEach(doc => {
        combined.push({ ...doc.data(), id: doc.id, type: "Online User" });
      });

      console.log("✅ Loaded customers+users:", combined);


      // Build table rows
      combined.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
    <td>${c.name || ""}</td>
    <td>${c.phone || ""}</td>
    <td>${c.email || ""}</td>
    <td>${c.type}</td>
    <td>
        <button class="edit-btn" 
                data-id="${c.id}" 
                data-type="${c.type}">
            Edit
        </button>
        <button class="delete-btn" 
                data-id="${c.id}" 
                data-type="${c.type}" 
                style="margin-left:8px; color:red;">
            Delete
        </button>
    </td>
  `;
        customerListBody.appendChild(tr);
      });


      // Attach click listeners after rendering
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", async e => {
          const id = e.target.dataset.id;
          const type = e.target.dataset.type;

          console.log("✏️ Edit button clicked:", id, type);

          const docRef = db.collection(type === "POS Customer" ? "customers" : "users").doc(id);
          const docSnap = await docRef.get();

          if (!docSnap.exists) {
            alert("Customer not found!");
            return;
          }

          editingCustomer = { id, type };
          const data = docSnap.data();

          editName.value = data.name || "";
          editPhone.value = data.phone || "";
          editEmail.value = data.email || "";
          editAddress.value = data.address || "";
          editNotes.value = data.notes || "";

          editModal.style.display = "flex";
          editName.focus();
        });
      });

    } catch (err) {
      console.error("❌ Error loading customers:", err);
    }
  }

  // Delete button logic
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      const type = e.target.dataset.type;

      const confirmDelete = confirm("Are you sure you want to delete this customer?");
      if (!confirmDelete) return;

      try {
        if (type === "POS Customer") {
          await db.collection("customers").doc(id).delete();
        } else {
          await db.collection("users").doc(id).delete();
        }
        alert(`${type} deleted successfully!`);
        loadCustomerList(); // refresh the list
      } catch (err) {
        console.error(err);
        alert("Error deleting: " + err.message);
      }
    }
  });



  // =================== FORM ELEMENTS ===================
  const phoneInput = document.getElementById("phone");
  const phoneSuggestions = document.getElementById("phoneSuggestions");
  const emailGroup = document.getElementById("emailGroup");
  const emailInput = document.getElementById("email");
  const emailSuggestions = document.getElementById("emailSuggestions");
  const otherFields = document.getElementById("otherFields");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");
  const nameInput = document.getElementById("name");
  const addressInput = document.getElementById("address");
  const birthdayInput = document.getElementById("birthday");
  const genderInput = document.getElementById("gender");
  const notesInput = document.getElementById("notes");
  let currentCustomerDoc = null;

  // =================== UTILITY: FETCH SUGGESTIONS ===================
  async function getSuggestions(field, value) {
    if (!value) return [];
    const suggestions = [];
    const custSnap = await db.collection('customers')
      .where(field, '>=', value)
      .where(field, '<=', value + '\uf8ff')
      .limit(5).get();
    custSnap.forEach(d => suggestions.push({ id: d.id, data: d.data(), type: 'POS Customer' }));
    const userSnap = await db.collection('users')
      .where(field, '>=', value)
      .where(field, '<=', value + '\uf8ff')
      .limit(5).get();
    userSnap.forEach(d => suggestions.push({ id: d.id, data: d.data(), type: 'Online User' }));
    return suggestions;
  }

  // =================== SHOW FORM FIELDS & BUTTON ===================
  function showFormFieldsAndButton(isNew = true) {
    emailGroup.style.display = 'block';
    otherFields.style.display = 'block';
    saveBtn.style.display = 'block';

    if (isNew) {
      statusMsg.textContent = "Adding new customer";
      statusMsg.style.color = "blue";
    } else {
      statusMsg.textContent = "Editing existing customer";
      statusMsg.style.color = "green";
    }
  }

  // =================== DROPDOWN ===================
  function showDropdown(inputElem, dropdownElem, suggestions) {
    dropdownElem.innerHTML = '';
    if (suggestions.length === 0) {
      dropdownElem.style.display = 'none';
      return;
    }
    suggestions.forEach(s => {
      const div = document.createElement('div');
      div.innerHTML = `${s.data[fieldForInput(inputElem)]} 
            <span class="suggestion-label">(${s.type})</span>`;
      div.addEventListener('click', () => {
        inputElem.value = s.data[fieldForInput(inputElem)];
        dropdownElem.style.display = 'none';
        handleSelection(s);
      });
      dropdownElem.appendChild(div);
    });
    dropdownElem.style.display = 'block';
  }
  function fieldForInput(inputElem) {
    return inputElem === phoneInput ? 'phone' : 'email';
  }
  function handleSelection(suggestion) {
    currentCustomerDoc = suggestion;
    fillFormWithCustomer(suggestion.data);
    showFormFieldsAndButton(false);
  }
  function fillFormWithCustomer(data) {
    emailGroup.style.display = 'block';
    otherFields.style.display = 'block';
    saveBtn.style.display = 'block';
    nameInput.value = data.name || '';
    phoneInput.value = data.phone || '';
    emailInput.value = data.email || '';
    addressInput.value = data.address || '';
    birthdayInput.value = data.birthday || '';
    genderInput.value = data.gender || '';
    notesInput.value = data.notes || '';
    statusMsg.textContent = `Loaded ${currentCustomerDoc.type}`;
  }

  // =================== RESET FORM ===================
  function resetForm() {
    currentCustomerDoc = null;
    phoneInput.value = '';
    emailInput.value = '';
    nameInput.value = '';
    addressInput.value = '';
    birthdayInput.value = '';
    genderInput.value = '';
    notesInput.value = '';

    emailGroup.style.display = 'none';
    otherFields.style.display = 'none';
    phoneSuggestions.style.display = 'none';
    emailSuggestions.style.display = 'none';

    statusMsg.textContent = '';
    // ⚠️ DO NOT HIDE saveBtn HERE anymore
  }

  // =================== INPUT EVENTS ===================
  let phoneTimeout = null;
  phoneInput.addEventListener('input', () => {
    clearTimeout(phoneTimeout);
    phoneTimeout = setTimeout(async () => {
      const val = phoneInput.value.trim();
      if (val.length < 3) return;

      const suggestions = await getSuggestions('phone', val);
      showDropdown(phoneInput, phoneSuggestions, suggestions);

      if (suggestions.length > 0) {
        handleSelection(suggestions[0]);
      } else {
        currentCustomerDoc = null;
        showFormFieldsAndButton(true);
      }
    }, 300);
  });

  let emailTimeout = null;
  emailInput.addEventListener('input', () => {
    clearTimeout(emailTimeout);
    emailTimeout = setTimeout(async () => {
      const val = emailInput.value.trim();
      if (val.length < 3) return;

      const suggestions = await getSuggestions('email', val);
      showDropdown(emailInput, emailSuggestions, suggestions);

      if (suggestions.length > 0) {
        handleSelection(suggestions[0]);
      } else {
        currentCustomerDoc = null;
        showFormFieldsAndButton(true);
      }
    }, 300);
  });

  // =================== FORM SUBMIT ===================
  document.getElementById("customerForm").addEventListener('submit', async e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const address = addressInput.value.trim();
    const birthday = birthdayInput.value;
    const gender = genderInput.value;
    const notes = notesInput.value.trim();

    if (!name || !phone) {
      statusMsg.textContent = 'Name & phone required';
      statusMsg.style.color = 'red';
      return;
    }
    try {
      if (currentCustomerDoc && currentCustomerDoc.type === 'POS Customer') {
        await db.collection('customers').doc(currentCustomerDoc.id).update({
          name, phone, email, address, birthday, gender, notes,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = 'Customer updated!';
        statusMsg.style.color = 'green';
      } else {
        await db.collection('customers').add({
          name, phone, email, address, birthday, gender, notes,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = 'New customer added!';
        statusMsg.style.color = 'green';
      }
      resetForm();
      loadCustomerList(); // refresh
    } catch (err) {
      console.error(err);
      statusMsg.textContent = 'Error: ' + err.message;
      statusMsg.style.color = 'red';
    }
  });

  // =================== INIT ===================
  loadCustomerList();




  // =================== EDIT MODAL LOGIC ===================
  const editModal = document.getElementById("editModal");
  const closeModal = document.getElementById("closeModal");

  const editName = document.getElementById("editName");
  const editPhone = document.getElementById("editPhone");
  const editEmail = document.getElementById("editEmail");
  const editAddress = document.getElementById("editAddress");
  const editBirthday = document.getElementById("editBirthday");
  const editGender = document.getElementById("editGender");
  const editNotes = document.getElementById("editNotes");

  let editingCustomer = null;

  // Open modal on Edit button click
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;
      const type = e.target.dataset.type;

      // Fetch customer data
      let docSnap;
      if (type === "POS Customer") {
        docSnap = await db.collection("customers").doc(id).get();
      } else {
        docSnap = await db.collection("users").doc(id).get();
      }
      if (!docSnap.exists) return;

      editingCustomer = { id, type };

      const data = docSnap.data();
      editName.value = data.name || "";
      editPhone.value = data.phone || "";
      editEmail.value = data.email || "";
      editAddress.value = data.address || "";
      editBirthday.value = data.birthday || "";
      editGender.value = data.gender || "";
      editNotes.value = data.notes || "";

      editModal.style.display = "flex";
    }
  });

  // Close modal
  closeModal.addEventListener("click", () => {
    editModal.style.display = "none";
    editingCustomer = null;
  });

  // Save changes
  document.getElementById("editCustomerForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const updateData = {
        name: editName.value.trim(),
        phone: editPhone.value.trim(),
        email: editEmail.value.trim(),
        address: editAddress.value.trim(),
        birthday: editBirthday.value,
        gender: editGender.value,
        notes: editNotes.value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingCustomer.type === "POS Customer") {
        await db.collection("customers").doc(editingCustomer.id).update(updateData);
      } else {
        await db.collection("users").doc(editingCustomer.id).update(updateData);
      }

      alert("Customer updated!");
      editModal.style.display = "none";
      loadCustomerList(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Error updating: " + err.message);
    }
  });

}






function stockpage() {
  // --- Google Sheets helpers ---
  async function getAllSheetNames() {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const res = await fetch(metaUrl);
    const data = await res.json();
    return data.sheets.map(s => s.properties.title);
  }

  function parseSheetData(values) {
    if (!values || values.length === 0) return [];
    const [header, ...rows] = values;
    return rows.map(row => {
      const obj = {};
      header.forEach((key, i) => { obj[key.toLowerCase()] = row[i] || ""; });
      return obj;
    });
  }

  async function fetchAllSheetProducts() {
    const sheetNames = await getAllSheetNames();
    let allProducts = [];

    for (let sheetName of sheetNames) {
      const sheetAPI = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
      const res = await fetch(sheetAPI);
      const data = await res.json();

      const parsed = parseSheetData(data.values);
      allProducts = allProducts.concat(parsed);
    }

    return allProducts;
  }


  // --- Firestore sync ---
  async function uploadNewProducts() {
    const sheetProducts = await fetchAllSheetProducts();

    for (let p of sheetProducts) {
      if (!p.name || !p.code) continue;

      const existing = await db.collection("products").where("code", "==", p.code).get();
      if (existing.empty) {
        await db.collection("products").doc(doc.id).update({
          name: p.name,
          image: p.image || p.image_url || "",
          currentPrice: Number(p.current_price) || 0,
          purchasePrice: Number(p.purchase_price) || 0
        });

      }
    }

    loadProductsTable();
  }

  document.getElementById("loadProductsBtn").addEventListener("click", async () => {
    const sheetProducts = await fetchAllSheetProducts();

    for (let p of sheetProducts) {
      if (!p.name || !p.code) continue;

      const existing = await db.collection("products").where("code", "==", p.code).get();
      if (existing.empty) {
        await db.collection("products").add({
          name: p.name,
          code: p.code,
          image: p.image || p.image_url || "",  // support different headers
          currentPrice: Number(p.current_price) || 0,
          purchasePrice: Number(p.purchase_price) || 0,
          in_stock: 0
        });

      } else {
        existing.forEach(async doc => {
          await db.collection("products").doc(doc.id).update({
            name: p.name,
            image: p.image || "",
            currentPrice: Number(p.current_price) || 0,
            purchasePrice: Number(p.purchase_price) || 0
          });
        });
      }
    }

    loadProductsTable();
  });

  setInterval(uploadNewProducts, 60 * 60 * 1000);

  // --- Render table with raw CSS ---
  async function loadProductsTable() {
    const snap = await db.collection("products").orderBy("code").get();
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "";

    snap.forEach(doc => {
      const p = doc.data();
      const tr = document.createElement("tr");
      tr.className = "product-row";
      tr.innerHTML = `
      <td><img src="${p.image || "assets/images/logo.png"}" class="product-img" /></td>
      <td>${p.name}</td>
      <td>${p.code}</td>
      <td>৳${p.currentPrice}</td>
      <td>৳${p.purchasePrice}</td>
      <td>${p.in_stock}</td>
      <td>
        <button class="update-btn" onclick="updateStock('${doc.id}', ${p.in_stock})">Update</button>
      </td>
    `;
      tbody.appendChild(tr);
    });
  }


  // --- Global function for onclick ---
  window.updateStock = async function (id, currentStock) {
    const newStock = prompt("Enter new stock value:", currentStock);
    if (newStock !== null) {
      await db.collection("products").doc(id).update({ in_stock: parseInt(newStock) });
      loadProductsTable();
    }
  };

  // Initial load
  loadProductsTable();
}


// // Initialize Firestore
// const db = firebase.firestore();

// // ===================== Admin Auth Check =====================
// firebase.auth().onAuthStateChanged(async (user) => {
//   if (!user) {
//     alert("Please sign in first");
//     window.location.href = "index.html";
//     return;
//   }

//   console.log("✅ Logged in as:", user.uid);

//   // Verify admin
//   const userDoc = await db.collection("users").doc(user.uid).get();
//   if (!userDoc.exists || userDoc.data().role !== "admin") {
//     alert("Not authorized - admin only");
//     await firebase.auth().signOut();
//     window.location.href = "index.html";
//     return;
//   }

//   console.log("👑 Admin verified, loading wishlist page...");
//   loadAdminWishlistPage();
// });

// ===================== Load Admin Wishlist Page =====================
function loadAdminWishlistPage() {
  const content = document.getElementById("content");
  if (!content) return console.error("❌ Content container not found");

  content.innerHTML = `
    <div class="container">
      <h2>Make a Wish</h2>
      <div id="wishlistContainer" class="wishlist-container"></div>
    </div>
  `;

  loadWishlist();
}

// ===================== Load Wishlist Function =====================
function loadWishlist() {
  const wishlistContainer = document.getElementById("wishlistContainer");
  if (!wishlistContainer) return console.error("❌ Wishlist container not found");

  db.collection("wishes")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      wishlistContainer.innerHTML = "";

      if (snapshot.empty) {
        wishlistContainer.innerHTML = `
          <p style="text-align:center;">No wishlist items found</p>
        `;
        return;
      }

      snapshot.forEach((doc) => {
        const wish = doc.data();

        const imagesHTML = (wish.images || [])
          .map(
            (img) =>
              `<img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin:4px;">`
          )
          .join("");

        const wishDiv = document.createElement("div");
        wishDiv.className = "wishlist-card";
        wishDiv.innerHTML = `
          <div class="user-info">
            <div><strong>${wish.name || "No name"}</strong></div>
            <div>${wish.email || ""}</div>
            <div>${wish.phone || ""}</div>
          </div>

          <div class="product-section">
            <div class="product-images">
              ${imagesHTML || `<div style="font-size:12px;color:#777;">No image</div>`}
            </div>
            <div class="product-details">
              <p><strong>Product:</strong> ${wish.productName || ""}</p>
              <p><strong>Color:</strong> ${wish.color || ""}</p>
              <p><strong>Size:</strong> ${wish.size || ""}</p>
              <p><strong>Quantity:</strong> ${wish.quantity || "1"}</p>
              <p><strong>Description:</strong> ${wish.description || ""}</p>
            </div>
          </div>
        `;

        wishlistContainer.appendChild(wishDiv);
      });
    })
    .catch((err) => console.error("Error loading wishlist:", err));
}


// ===================== Load Google Sheet Editor Page (All Sheets) =====================
function loadGoogleSheetEditorPage() {
  const sheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw";
  const apiKey = "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs";
  let allProducts = [];

  /* ============ LOAD SHEETS ============ */
  async function loadAllSheets() {
    const container = document.getElementById("sheetContainer");
    const tabs = document.getElementById("tabs");
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`);
      const metaData = await metaRes.json();
      container.innerHTML = "";
      for (const sheet of metaData.sheets) {
        const name = sheet.properties.title;
        const btn = document.createElement("button");
        btn.className = "tab-btn";
        btn.textContent = name;
        btn.onclick = () => activateTab(name);
        tabs.appendChild(btn);

        const div = document.createElement("div");
        div.id = `sheet_${name}`;
        div.className = "sheet-content";
        div.textContent = `Loading ${name}...`;
        container.appendChild(div);

        await loadSheetData(name);
      }
      if (metaData.sheets.length) activateTab(metaData.sheets[0].properties.title);
    } catch (err) {
      container.textContent = "Error loading sheets.";
    }
  }

  /* ============ LOAD SHEET DATA ============ */
  async function loadSheetData(name) {
    const section = document.getElementById(`sheet_${name}`);
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(name)}?key=${apiKey}`
      );
      const data = await res.json();
      if (!data.values) { section.textContent = "No data."; return; }

      const rows = data.values.slice(1);
      section.innerHTML = "";
      rows.forEach(row => {
        allProducts.push({ sheet: name, row });
        section.appendChild(makeProductCard(row));
      });
    } catch {
      section.textContent = "Error loading data.";
    }
  }

  function activateTab(name) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.textContent === name));
    document.querySelectorAll(".sheet-content").forEach(s => s.style.display = s.id === `sheet_${name}` ? "block" : "none");
  }

  /* ============ CARD CREATION ============ */
  function makeProductCard(row) {
    const div = document.createElement("div");
    div.className = "product-card";

    const img = document.createElement("img");
    const fallbackImg = "https://via.placeholder.com/100x100?text=No+Image";
    let triedFallback = false;
    const mainImg = row[11] || row[49];

    img.src = mainImg || fallbackImg;
    img.className = "product-img";

    img.onerror = () => {
      if (!triedFallback) {
        triedFallback = true;
        img.src = fallbackImg;
      }
    };

    const info = document.createElement("div");
    info.className = "product-info";
    info.innerHTML = `
        <h3>${row[2] || "Unnamed"}</h3>
        <div class="product-info-row"><b>Code:</b> ${row[1] || "-"}</div>
        <div class="product-info-row"><b>Current:</b> ${row[3] || "-"}</div>
        <div class="product-info-row"><b>Purchase:</b> ${row[6] || "-"}</div>
        <div class="product-info-row"><b>Category:</b> ${row[8] || "-"}</div>
        <div class="product-info-row"><b>Subcategory:</b> ${row[9] || "-"}</div>
      `;

    const main = document.createElement("div");
    main.className = "product-main";
    main.append(img, info);

    const details = document.createElement("div");
    details.className = "product-details";

    const slideImgs = [row[12], row[13], row[14], row[15], row[16], row[17]].filter(Boolean);
    const slides = slideImgs.map(u => `<img src="${u}" alt="">`).join("") || "<p>No slides</p>";

    const combos = [];
    for (let i = 26; i <= 47; i += 4) {
      if (row[i]) combos.push({ img: row[i], name: row[i + 1], price: row[i + 2], size: row[i + 3] });
    }
    const comboHTML = combos.length ? combos.map(c => `
        <div class="combo-card">
          <img src="${c.img}" alt="">
          <p>${c.name || ""}</p>
          <p>${c.price || ""}</p>
          <p>${c.size || ""}</p>
        </div>
      `).join("") : "<p>No related items</p>";

    details.innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><b>Brand:</b> ${row[7] || "-"}</div>
          <div class="detail-item"><b>Origin:</b> ${row[18] || "-"}</div>
          <div class="detail-item"><b>Discount:</b> ${row[4] || "-"}%</div>
          <div class="detail-item"><b>Discount Price:</b> ${row[5] || "-"}</div>
          <div class="detail-item"><b>Wholesale Price:</b> ${row[20] || "-"}</div>
          <div class="detail-item"><b>MOQ:</b> ${row[21] || "-"}</div>
          <div class="detail-item"><b>Availability:</b> ${row[22] || "-"}</div>
          <div class="detail-item"><b>In Stock:</b> ${row[23] || "-"}</div>
        </div>
        <div class="detail-section"><h4>Description</h4><p>${row[10] || "No description"}</p></div>
        <div class="detail-section"><h4>Slides</h4><div class="slides">${slides}</div></div>
        <div class="combo-section"><h4>Related Items</h4><div class="combo-items">${comboHTML}</div></div>
      `;

    div.append(main, details);
    div.addEventListener("click", () => div.classList.toggle("expanded"));
    return div;
  }

  /* ============ SEARCH + SORT + RESET ============ */
  document.getElementById("searchBox").addEventListener("input", applyFilters);
  document.getElementById("sortSelect").addEventListener("change", applyFilters);
  document.getElementById("resetBtn").onclick = () => {
    document.getElementById("searchBox").value = "";
    document.getElementById("sortSelect").value = "";
    applyFilters();
  };

  function applyFilters() {
    const q = document.getElementById("searchBox").value.toLowerCase();
    const sort = document.getElementById("sortSelect").value;
    const container = document.getElementById("sheetContainer");
    const tabs = document.getElementById("tabs");

    let list = [...allProducts];
    if (q) list = list.filter(p => (p.row[2] || "").toLowerCase().includes(q) || (p.row[1] || "").toLowerCase().includes(q));

    tabs.style.display = q ? "none" : "flex";
    container.innerHTML = "";
    if (!list.length) { container.textContent = "No results."; return; }

    if (sort === "name") list.sort((a, b) => (a.row[2] || "").localeCompare(b.row[2] || ""));
    if (sort === "code") list.sort((a, b) => (a.row[1] || "").localeCompare(b.row[1] || ""));
    if (sort === "price") list.sort((a, b) => (parseFloat(a.row[3]) || 0) - (parseFloat(b.row[3]) || 0));

    list.forEach(p => container.appendChild(makeProductCard(p.row)));
  }

  loadAllSheets();
}

// =============== MAIN FUNCTION ===============
function initSupplierPage() {
  const showFormBtn = document.getElementById("showFormBtn");
  const hideFormBtn = document.getElementById("hideFormBtn");
  const supplierFormContainer = document.getElementById("supplierFormContainer");
  const supplierListContainer = document.getElementById("supplierListContainer");
  const supplierListBody = document.getElementById("supplierListBody");
  const supplierForm = document.getElementById("supplierForm");
  const statusMsg = document.getElementById("statusMsg");

  let editingSupplier = null;

  showFormBtn.addEventListener("click", () => {
    supplierFormContainer.style.display = "block";
    supplierListContainer.style.display = "none";
  });

  hideFormBtn.addEventListener("click", () => {
    supplierFormContainer.style.display = "none";
    supplierListContainer.style.display = "block";
    resetForm();
  });

  async function loadSupplierList() {
    supplierListBody.innerHTML = "";
    const snap = await db.collection("suppliers").orderBy("createdAt", "desc").get();
    snap.forEach(doc => {
      const s = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${s.shopName || ""}</td>
            <td>${s.phone || ""}</td>
            <td>${s.location || ""}</td>
            <td>${s.category || ""}</td>
            <td>
              <button class="edit-btn" data-id="${doc.id}">Edit</button>
              <button class="delete-btn" data-id="${doc.id}">Delete</button>
            </td>`;
      supplierListBody.appendChild(tr);
    });
  }

  // Reset form
  function resetForm() {
    supplierForm.reset();
    editingSupplier = null;
    statusMsg.textContent = "";
  }

  // Submit form
  supplierForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const shopName = document.getElementById("shopName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const location = document.getElementById("location").value.trim();
    const category = document.getElementById("category").value.trim();

    if (!shopName || !phone) {
      statusMsg.textContent = "Shop name and phone are required.";
      statusMsg.style.color = "red";
      return;
    }

    try {
      if (editingSupplier) {
        await db.collection("suppliers").doc(editingSupplier).update({
          shopName, phone, location, category,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = "Supplier updated successfully!";
      } else {
        await db.collection("suppliers").add({
          shopName, phone, location, category,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = "New supplier added successfully!";
      }
      statusMsg.style.color = "green";
      resetForm();
      loadSupplierList();
    } catch (err) {
      console.error(err);
      statusMsg.textContent = "Error: " + err.message;
      statusMsg.style.color = "red";
    }
  });

  // Edit & Delete buttons
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;
      const docSnap = await db.collection("suppliers").doc(id).get();
      if (!docSnap.exists) return;
      const data = docSnap.data();
      document.getElementById("shopName").value = data.shopName;
      document.getElementById("phone").value = data.phone;
      document.getElementById("location").value = data.location;
      document.getElementById("category").value = data.category;
      supplierFormContainer.style.display = "block";
      supplierListContainer.style.display = "none";
      editingSupplier = id;
      statusMsg.textContent = "Editing supplier...";
      statusMsg.style.color = "blue";
    }

    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (!confirm("Are you sure you want to delete this supplier?")) return;
      await db.collection("suppliers").doc(id).delete();
      loadSupplierList();
      alert("Supplier deleted successfully!");
    }
  });

  // Initialize
  loadSupplierList();
}

// window.onload = initSupplierPage;



// =============== MAIN FUNCTION ===============
function initBookingPage() {
  const showFormBtn = document.getElementById("showFormBtn");
  const hideFormBtn = document.getElementById("hideFormBtn");
  const bookingFormContainer = document.getElementById("bookingFormContainer");
  const bookingListContainer = document.getElementById("bookingListContainer");
  const bookingListBody = document.getElementById("bookingListBody");
  const bookingForm = document.getElementById("bookingForm");
  const statusMsg = document.getElementById("statusMsg");

  let editingBooking = null;

  showFormBtn.addEventListener("click", () => {
    bookingFormContainer.style.display = "block";
    bookingListContainer.style.display = "none";
  });

  hideFormBtn.addEventListener("click", () => {
    bookingFormContainer.style.display = "none";
    bookingListContainer.style.display = "block";
    resetForm();
  });

  async function loadBookingList() {
    bookingListBody.innerHTML = "";
    const snap = await db.collection("bookings").orderBy("createdAt", "desc").get();
    snap.forEach(doc => {
      const b = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
                        <td>${b.userName || ""}</td>
                        <td>${b.phoneNumber || ""}</td>
                        <td>${b.productName || ""}</td>
                        <td>${b.productCode || ""}</td>
                        <td>${b.quantity || ""}</td>
                        <td>${b.advance || ""}</td>
                        <td>${b.imageUrl ? `<img src="${b.imageUrl}" alt="Booking Image" class="booking-img">` : ""}</td>
                        <td>
                            <button class="edit-btn" data-id="${doc.id}">Edit</button>
                            <button class="delete-btn" data-id="${doc.id}">Delete</button>
                        </td>`;
      bookingListBody.appendChild(tr);
    });
  }

  function resetForm() {
    bookingForm.reset();
    editingBooking = null;
    statusMsg.textContent = "";
  }

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userName = document.getElementById("userName").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const productCode = document.getElementById("productCode").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const advance = Number(document.getElementById("advance").value);
    const imageUrl = document.getElementById("imageUrl").value.trim();

    if (!userName || !phoneNumber || !productName || !quantity || !advance) {
      statusMsg.textContent = "Please fill all required fields.";
      statusMsg.style.color = "red";
      return;
    }

    try {
      if (editingBooking) {
        await db.collection("bookings").doc(editingBooking).update({
          userName, phoneNumber, productName, productCode, quantity, advance, imageUrl,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = "Booking updated successfully!";
      } else {
        await db.collection("bookings").add({
          userName, phoneNumber, productName, productCode, quantity, advance, imageUrl,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        statusMsg.textContent = "New booking added successfully!";
      }
      statusMsg.style.color = "green";
      resetForm();
      loadBookingList();
      bookingFormContainer.style.display = "none";
      bookingListContainer.style.display = "block";
    } catch (err) {
      console.error(err);
      statusMsg.textContent = "Error: " + err.message;
      statusMsg.style.color = "red";
    }
  });

  document.addEventListener("click", async e => {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;
      const docSnap = await db.collection("bookings").doc(id).get();
      if (!docSnap.exists) return;
      const data = docSnap.data();
      document.getElementById("userName").value = data.userName || "";
      document.getElementById("phoneNumber").value = data.phoneNumber || "";
      document.getElementById("productName").value = data.productName || "";
      document.getElementById("productCode").value = data.productCode || "";
      document.getElementById("quantity").value = data.quantity || "";
      document.getElementById("advance").value = data.advance || "";
      document.getElementById("imageUrl").value = data.imageUrl || "";
      bookingFormContainer.style.display = "block";
      bookingListContainer.style.display = "none";
      editingBooking = id;
      statusMsg.textContent = "Editing booking...";
      statusMsg.style.color = "blue";
    }

    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (!confirm("Are you sure you want to delete this booking?")) return;
      await db.collection("bookings").doc(id).delete();
      loadBookingList();
      alert("Booking deleted successfully!");
    }
  });

  // Initialize
  loadBookingList();
}

// window.onload = initBookingPage;

// Expences

function expeces() {
    // ---------- ELEMENTS ----------
    const monthsContainer = document.getElementById("months");
    const expenseList = document.getElementById("expenseList");
    const summaryToday = document.getElementById("summaryToday");
    const summaryMonth = document.getElementById("summaryMonth");
    const summaryLast = document.getElementById("summaryLast");
    const filterSelect = document.getElementById("filterSelect");
    const expenseForm = document.getElementById("expenseForm");
    const modal = document.getElementById("expenseModal");
    const openModalBtn = document.getElementById("openModal");
    const closeModalBtn = document.getElementById("closeModal");

    let currentMonth = new Date().getMonth();
    let allExpenses = [];

    // ---------- UI HANDLERS ----------
    openModalBtn.onclick = () => modal.style.display = "flex";
    closeModalBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

    // ---------- MONTH BUTTONS ----------
    const monthNames = ["All","January","February","March","April","May","June","July","August","September","October","November","December"];
    monthNames.forEach((name, i) => {
      const btn = document.createElement("button");
      btn.textContent = name;
      btn.className = "month-btn";
      if (i-1 === currentMonth || (i===0 && currentMonth===-1)) btn.classList.add("active");
      btn.onclick = () => {
        document.querySelectorAll(".month-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        if(i===0) renderExpenses(allExpenses);
        else renderExpenses(allExpenses.filter(e=>new Date(e.date).getMonth()===i-1));
      };
      monthsContainer.appendChild(btn);
    });

    // ---------- ADD EXPENSE ----------
    expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cause = expenseForm.cause.value.trim();
      const amount = parseFloat(expenseForm.amount.value);
      const date = new Date().toISOString();
      if(!cause || !amount) return alert("Please fill all fields!");
      db.collection("expenses").add({cause, amount, date}).then(() => {
        alert("Expense added!");
        modal.style.display = "none";
        expenseForm.reset();
        loadExpenses();
      });
    });

    // ---------- LOAD EXPENSES ----------
    async function loadExpenses() {
      const snap = await db.collection("expenses").orderBy("date","desc").get();
      allExpenses = snap.docs.map(d => d.data());
      renderExpenses(allExpenses.filter(e=>new Date(e.date).getMonth()===currentMonth));
      updateSummary();
    }

    // ---------- SUMMARY ----------
    function updateSummary() {
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().getMonth();
      const lastMonth = thisMonth-1<0 ? 11 : thisMonth-1;

      const todayTotal = allExpenses.filter(e=>e.date.startsWith(today)).reduce((sum,e)=>sum+e.amount,0);
      const monthTotal = allExpenses.filter(e=>new Date(e.date).getMonth()===thisMonth).reduce((sum,e)=>sum+e.amount,0);
      const lastMonthTotal = allExpenses.filter(e=>new Date(e.date).getMonth()===lastMonth).reduce((sum,e)=>sum+e.amount,0);

      summaryToday.textContent = todayTotal.toFixed(2);
      summaryMonth.textContent = monthTotal.toFixed(2);
      summaryLast.textContent = lastMonthTotal.toFixed(2);
    }

    // ---------- RENDER EXPENSES ----------
    function renderExpenses(list){
      expenseList.innerHTML = "";
      if(list.length===0){expenseList.innerHTML="<p class='empty'>No expenses found</p>"; return;}
      list.forEach(e=>{
        const div = document.createElement("div");
        div.className="expense-item";
        div.innerHTML=`<span>${new Date(e.date).toLocaleDateString()}</span><span>${e.cause}</span><strong>$${e.amount.toFixed(2)}</strong>`;
        expenseList.appendChild(div);
      });
    }

    // ---------- FILTER ----------
    filterSelect.addEventListener("change", ()=>{
      const value = filterSelect.value;
      const today = new Date();
      let filtered=[];
      if(value==="today") filtered = allExpenses.filter(e=>e.date.startsWith(today.toISOString().split("T")[0]));
      else if(value==="yesterday"){ const y=new Date(today); y.setDate(y.getDate()-1); filtered=allExpenses.filter(e=>e.date.startsWith(y.toISOString().split("T")[0])); }
      else if(value.startsWith("last")){ const days=parseInt(value.replace("last","")); const cutoff=new Date(); cutoff.setDate(today.getDate()-days); filtered=allExpenses.filter(e=>new Date(e.date)>=cutoff); }
      else filtered = allExpenses.filter(e=>new Date(e.date).getMonth()===currentMonth);
      renderExpenses(filtered);
    });

    loadExpenses();
}


