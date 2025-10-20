// seedOrders.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import Order from "./models/Order.js"; // ✅ Make sure this path is correct

dotenv.config();

// Function to load and parse CSV data
async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        try {
          results.push({
            _id: data._id,
            userId: data.userId,
            items: data.items ? JSON.parse(data.items) : [],
            totalCost: Number(data.totalCost),
            status: data.status,
            paymentMethod: data.paymentMethod,
            shippingAddress: data.shippingAddress
              ? JSON.parse(data.shippingAddress)
              : {},
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            __v: Number(data.__v || 0),
          });
        } catch (err) {
          console.error("⚠️ Error parsing row:", err.message);
        }
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// Main seeding function
async function seedOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const orders = await loadCSV("./dummy_orders.csv");
    console.log(`📦 Loaded ${orders.length} orders from CSV`);

    // ✅ Insert new orders without deleting existing ones
    await Order.insertMany(orders);
    console.log(`✅ Added ${orders.length} new orders to existing collection`);

    mongoose.connection.close();
    console.log("🚪 MongoDB Connection Closed");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

// Run seeder
seedOrders();
