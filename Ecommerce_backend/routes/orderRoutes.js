// routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  getTopProducts,
} from "../controllers/orderController.js";

const router = express.Router();

// ✅ Put more specific routes first
router.post("/", createOrder);
router.get("/user/:id", getUserOrders); // move this above "/:id"
router.get("/analytics/top-products", getTopProducts);
router.get("/:id", getOrderById);

export default router;