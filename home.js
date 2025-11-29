// ===== Utilities =====
const fmtBDT = n => Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 });

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  if (typeof val === "string") return new Date(val);
  return null;
}

// ===== Date Helpers =====
function startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function endOfDay(date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; }
function startOfMonth(date) { const d = new Date(date); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
function endOfMonth(date) { const d = new Date(date); d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d; }
function previousMonthRange(date) { 
  const d = new Date(date); 
  d.setDate(1); 
  d.setMonth(d.getMonth() - 1); 
  const start = new Date(d); 
  const end = endOfMonth(start); 
  return { start, end }; 
}
function within(d, start, end) { const t = d.getTime(); return t >= start.getTime() && t <= end.getTime(); }

// ===== Dashboard Initialization =====
async function initDashboard() {
  const els = {
    salesToday: document.getElementById("salesToday"),
    profitToday: document.getElementById("profitToday"),
    profitToday2: document.getElementById("profitToday2"),
    profitThisMonth: document.getElementById("profitThisMonth"),
    salesLastMonth: document.getElementById("salesLastMonth"),
    profitLastMonth: document.getElementById("profitLastMonth")
  };

  if (!els.salesToday) return console.warn("Dashboard elements not found");

  try {
    const snap = await window.db.collection("sales").get();
    const allSales = snap.docs.map(d => {
      const data = d.data() || {};
      return {
        timestamp: toDate(data.timestamp) || new Date(),
        totalAmount: Number(data.totalAmount ?? data.total ?? 0),
        totalProfit: Number(data.totalProfit ?? data.profit ?? 0)
      };
    });

    const now = new Date();
    const todayStart = startOfDay(now), todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now), monthEnd = endOfMonth(now);
    const { start: lastMonthStart, end: lastMonthEnd } = previousMonthRange(now);

    let salesToday = 0, profitToday = 0, profitMonth = 0, salesLastMonth = 0, profitLastMonth = 0;

    for (const s of allSales) {
      const d = s.timestamp;
      if (within(d, todayStart, todayEnd)) { salesToday += s.totalAmount; profitToday += s.totalProfit; }
      if (within(d, monthStart, monthEnd)) { profitMonth += s.totalProfit; }
      if (within(d, lastMonthStart, lastMonthEnd)) { salesLastMonth += s.totalAmount; profitLastMonth += s.totalProfit; }
    }

    els.salesToday.textContent = fmtBDT(salesToday);
    els.profitToday.textContent = fmtBDT(profitToday);
    els.profitToday2.textContent = fmtBDT(profitToday);
    els.profitThisMonth.textContent = fmtBDT(profitMonth);
    els.salesLastMonth.textContent = fmtBDT(salesLastMonth);
    els.profitLastMonth.textContent = fmtBDT(profitLastMonth);

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);



