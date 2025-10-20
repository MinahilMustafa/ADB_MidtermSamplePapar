// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, text: true },
    description: { type: String, text: true },
    category: { type: String, required: true, index: true },
    brand: { type: String },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound text + price index for hybrid search optimization
productSchema.index({ name: "text", description: "text", category: 1, price: 1 });

export default mongoose.model("Product", productSchema);
