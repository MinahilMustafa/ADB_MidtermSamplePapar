// controllers/orderController.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * @desc Create a new order
 * @route POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items?.length) {
      return res.status(400).json({ error: "User ID and items are required" });
    }

    // Calculate total cost
    let totalCost = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      totalCost += product.price * item.quantity;
    }

    const newOrder = await Order.create({ userId, items, totalCost });

    // Format response
    const formattedOrder = {
      id: newOrder._id.toString(),
      userId: newOrder.userId,
      items: newOrder.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      totalCost: newOrder.totalCost,
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt,
    };

    res.status(201).json({
      message: "Order created successfully",
      order: formattedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/**
 * @desc Get a specific order by ID
 * @route GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email")
      .populate("items.productId", "name price category brand")
      .lean();

    if (!order) return res.status(404).json({ error: "Order not found" });

    const formattedOrder = {
      id: order._id.toString(),
      user: order.userId,
      items: order.items.map(i => ({
        product: i.productId,
        quantity: i.quantity,
      })),
      totalCost: order.totalCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.status(200).json(formattedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

/**
 * @desc Get all orders for a specific user
 * @route GET /api/users/:id/orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("items.productId", "name price category brand")
      .lean();

    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
      items: order.items.map(i => ({
        product: i.productId,
        quantity: i.quantity,
      })),
      totalCost: order.totalCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return res.status(200).json({
      page,
      limit,
      totalResults: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @desc Aggregation: Top 5 most frequently purchased products in the last month (by category)
 * @route GET /api/orders/top-products
 */
export const getTopProducts = async (req, res) => {
  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const results = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: { category: "$product.category", product: "$product.name" },
          totalPurchases: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalPurchases: -1 } },
      {
        $group: {
          _id: "$_id.category",
          topProducts: {
            $push: {
              product: "$_id.product",
              totalPurchases: "$totalPurchases",
            },
          },
        },
      },
      {
        $project: {
          category: "$_id",
          topProducts: { $slice: ["$topProducts", 5] },
          _id: 0,
        },
      },
    ]);

    // Format response nicely
    const formattedResults = results.map(r => ({
      category: r.category,
      topProducts: r.topProducts.map(p => ({
        name: p.product,
        totalPurchases: p.totalPurchases,
      })),
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
};
