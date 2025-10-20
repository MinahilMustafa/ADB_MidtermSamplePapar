// seedReviews.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";
import Review from "./models/Review.js"; // ✅ Make sure this path is correct

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
            productId: data.productId,
            rating: Number(data.rating),
            reviewText: data.reviewText,
            timestamp: new Date(data.timestamp),
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
async function seedReviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const reviews = await loadCSV("./reviews.csv");
    console.log(`📝 Loaded ${reviews.length} reviews from CSV`);

    // ✅ Insert new reviews without deleting existing ones
    await Review.insertMany(reviews);
    console.log(`✅ Added ${reviews.length} new reviews to the collection`);

    mongoose.connection.close();
    console.log("🚪 MongoDB Connection Closed");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

// Run seeder
seedReviews();
