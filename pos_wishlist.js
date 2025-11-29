const db = firebase.firestore();
const wishlistTableBody = document.querySelector("#wishlistTable tbody");

// Wait for authentication
firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    alert("Please sign in first");
    window.location.href = "index.html";
    return;
  }

  console.log("✅ Logged in as:", user.uid);

  // Check if the user is an admin
  const userDoc = await db.collection("users").doc(user.uid).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    alert("Not authorized - admin only");
    await firebase.auth().signOut();
    window.location.href = "index.html";
    return;
  }

  console.log("👑 Admin verified, loading wishlist...");
  loadWishlist();
});

function loadWishlist() {
  const wishesRef = db.collection("wishes");

  wishesRef.orderBy("createdAt", "desc").onSnapshot(snapshot => {
    console.log("🧾 Wishlist snapshot received:", snapshot.size);
    wishlistTableBody.innerHTML = "";

    if (snapshot.empty) {
      wishlistTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No wishlist items found</td></tr>`;
      return;
    }

    snapshot.forEach(doc => {
      const wish = doc.data();
      const row = document.createElement("tr");

      // Convert timestamp to readable date
      const createdAt = wish.createdAt?.toDate
        ? wish.createdAt.toDate().toLocaleString()
        : "N/A";

      // Render images (array)
      const imagesHTML = Array.isArray(wish.images) && wish.images.length
        ? wish.images.map(img => `
          <img src="${img}" alt="image" style="width:40px;height:40px;border-radius:6px;margin:2px;object-fit:cover;">
        `).join("")
        : "—";

      row.innerHTML = `
        <td>${wish.name || "Unknown"}</td>
        <td>${wish.email || "N/A"}</td>
        <td>${wish.phone || "N/A"}</td>
        <td>${wish.productName || "Unknown"}</td>
        <td>${wish.color || "-"}</td>
        <td>${wish.size || "-"}</td>
        <td>${wish.quantity || "1"}</td>
        <td>${wish.description || "-"}</td>
        <td>${imagesHTML}</td>
        <td>${createdAt}</td>
      `;

      wishlistTableBody.appendChild(row);
    });
  }, err => {
    console.error("❌ Snapshot error:", err);
    wishlistTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;">Error loading wishlist: ${err.message}</td></tr>`;
  });
}
