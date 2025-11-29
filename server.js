const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔑 Load credentials.json (from Google Cloud Console)
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = "1nr6fXL6wbUHlXZaiAQYEFBWLMAauevT8zOtMfXbHMYw"; 
const sheetName = "Sheet1";

// 📌 Get all products
app.get("/products", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.json([]);
    }

    const headers = rows[0];
    const products = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || "";
      });
      return obj;
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 📌 Update stock
app.post("/updateStock", async (req, res) => {
  try {
    const { code, newStock } = req.body;

    // First fetch all rows to find row number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    const headers = rows[0];
    const codeIndex = headers.indexOf("code");
    const stockIndex = headers.indexOf("in_stock");

    if (codeIndex === -1 || stockIndex === -1) {
      return res.status(400).json({ error: "Missing columns in sheet" });
    }

    const rowNumber = rows.findIndex((row, idx) => idx > 0 && row[codeIndex] === code);
    if (rowNumber === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cell = `${String.fromCharCode(65 + stockIndex)}${rowNumber + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${cell}`,
      valueInputOption: "RAW",
      requestBody: { values: [[newStock.toString()]] },
    });

    res.json({ status: "success", code, newStock });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`POS Server running on port ${PORT}`));
