// Reference to preorders collection
const preordersRef = firebase.firestore().collection("preorders");
const preordersTableBody = document.querySelector("#preordersTable tbody");

const statusOptions = [
  "accepted",
  "payment_complete",
  "in_query",
  "available_in_store",
  "complete"
];

// Listen for real-time updates
preordersRef.onSnapshot(snapshot => {
  console.log("📦 Preorders snapshot received:", snapshot.size);
  preordersTableBody.innerHTML = "";

  if (snapshot.empty) {
    preordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No preorders available</td></tr>`;
    return;
  }

  snapshot.forEach(doc => {
    const preorder = doc.data();
    const row = document.createElement("tr");

    const badgeClass = `badge badge-${preorder.status || "accepted"}`;
    const badgeText = (preorder.status || "").replace(/_/g, " ");

    row.innerHTML = `
      <td>${preorder.userName || "Unknown"}</td>
      <td>${preorder.userPhone || "N/A"}</td>
      <td>${preorder.userEmail || "N/A"}</td>
      <td>${preorder.productName || "Unknown"} (${preorder.productCode || ""})</td>
      <td>${preorder.userAddress || "N/A"}</td>
      <td>
        <span class="${badgeClass}">${badgeText}</span><br>
        <select data-id="${doc.id}">
          ${statusOptions.map(s => `<option value="${s}" ${s === preorder.status ? "selected" : ""}>${s.replace(/_/g, " ")}</option>`).join('')}
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
      const preorderDoc = preordersRef.doc(preorderId);

      select.disabled = true;
      try {
        await preorderDoc.update({ status: newStatus });
        console.log("✅ Status updated:", newStatus);

        // Add timeline entry
        await preorderDoc.collection("timeline").add({
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
