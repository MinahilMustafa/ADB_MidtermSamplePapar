import express from 'express';
import { getUserOrders } from '../controllers/userController.js';
const router = express.Router();
router.get('/:id/orders', getUserOrders);
export default router;
