const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

exports.updateSheetOnStockChange = functions.firestore
    .document("products/{productId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Only act if in_stock changed
      if (before.in_stock === after.in_stock) return null;

      const code = after.code;
      const newStock = after.in_stock;

      const url = "https://script.google.com/macros/s/AKfycbyr7ySQ3ux-X2f1UZg-gxGVFIlw_X38JbDHFH5Cx6_nj_xy0clQWEkSZQiCko2tlUSN/exec"; // replace with your Apps Script URL

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({code, newStock}),
        });

        const data = await response.json();
        console.log("Google Sheet response:", data);
      } catch (err) {
        console.error("Failed to update Google Sheet:", err);
      }

      return null;
    });
