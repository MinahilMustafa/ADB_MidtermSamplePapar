import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Customer" depending on your user model
      required: true,
    },
    items: [orderItemSchema],
    totalCost: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Correct export
const Order = mongoose.model("Order", orderSchema);
export default Order;
