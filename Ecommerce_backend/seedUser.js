// seedUser.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import User from "./models/User.js"; // Make sure this path is correct

dotenv.config();

// Function to load and parse CSV data
async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push({
          _id: data._id,
          name: data.name,
          email: data.email,
          password: data.password, // already hashed in CSV
          location: data.location,
          purchaseHistory: data.purchaseHistory
            ? JSON.parse(data.purchaseHistory)
            : [],
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          __v: Number(data.__v || 0),
        });
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const users = await loadCSV("./dummy_users.csv");
    console.log(`👤 Loaded ${users.length} users from CSV`);

    // ✅ Insert users without deleting previous ones
    await User.insertMany(users);
    console.log(`✅ Added ${users.length} new users to existing collection`);

    mongoose.connection.close();
    console.log("🚪 MongoDB Connection Closed");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedUsers();
