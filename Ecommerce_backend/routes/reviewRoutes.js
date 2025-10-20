import express from 'express';
import { getProductReviews } from '../controllers/reviewController.js';
const router = express.Router();
router.get('/product/:id', getProductReviews);
export default router;
