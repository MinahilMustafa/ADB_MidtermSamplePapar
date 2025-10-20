import express from "express";
import {
  getProductById,
  searchProducts,
  getProductWithReviews,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/search", searchProducts);
router.get("/:id/reviews", getProductWithReviews);
router.get("/:id", getProductById);

export default router;
