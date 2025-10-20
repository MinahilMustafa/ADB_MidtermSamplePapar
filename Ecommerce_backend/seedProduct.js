// seedProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import Product from "./models/Product.js";

dotenv.config();

// Function to load and parse CSV data
async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push({
          name: data.name,
          description: data.description,
          category: data.category,
          brand: data.brand,
          price: Number(data.price),
          rating: Number(data.rating),
          stock: Number(data.stock),
          purchaseCount: Number(data.purchaseCount),
        });
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const products = await loadCSV("./new_products_seed.csv");
    console.log(`📦 Loaded ${products.length} products from CSV`);

    // ✅ Insert new products without deleting previous ones
    await Product.insertMany(products);
    console.log(`✅ Added ${products.length} new products to existing collection`);

    mongoose.connection.close();
    console.log("🚪 MongoDB Connection Closed");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedProducts();
