import Product from "../models/Product.js";
import Review from "../models/Review.js";

/**
 * GET /products/:id
 * Fetch single product by ID
 */
export async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const formattedProduct = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: product.price,
      rating: product.rating,
      stock: product.stock,
      purchaseCount: product.purchaseCount || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return res.json(formattedProduct);
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /products/:id/reviews
 * Fetch single product with all reviews
 */
export async function getProductWithReviews(req, res) {
  try {
    const productId = req.params.id;

    // Find product with reviews using aggregation
    const result = await Product.aggregate([
      { $match: { _id: Product.castToObjectId(productId) } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          category: 1,
          brand: 1,
          price: 1,
          rating: 1,
          stock: 1,
          purchaseCount: 1,
          reviews: {
            user: 1,
            rating: 1,
            reviewText: 1,
            createdAt: 1,
          },
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result[0];
    return res.json({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: product.price,
      rating: product.rating,
      stock: product.stock,
      purchaseCount: product.purchaseCount,
      reviews: product.reviews || [],
    });
  } catch (err) {
    console.error("Error fetching product with reviews:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /products/search?query=...&budget=...&category=...&page=1&limit=20
 * Hybrid search: textScore + price relevance + popularity
 * Returns only the top product
 */
export async function searchProducts(req, res) {
  try {
    const q = req.query.query || "";
    const budget = req.query.budget ? Number(req.query.budget) : null;
    const category = req.query.category;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const match = [];
    if (q) match.push({ $text: { $search: q } });
    if (category) match.push({ category });

    const pipeline = [
      { $match: match.length ? { $and: match } : {} },
      ...(q
        ? [{ $addFields: { similarityScore: { $meta: "textScore" } } }]
        : [{ $addFields: { similarityScore: 0 } }]),
      {
        $addFields: {
          priceScore: budget
            ? {
                $let: {
                  vars: { diff: { $abs: { $subtract: ["$price", budget] } } },
                  in: { $divide: [1, { $add: [1, "$$diff"] }] },
                },
              }
            : 0,
          popularityScore: { $log10: { $add: ["$purchaseCount", 1] } },
        },
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              { $multiply: ["$similarityScore", 0.6] },
              { $multiply: ["$priceScore", 0.25] },
              { $multiply: ["$popularityScore", 0.15] },
            ],
          },
        },
      },
      { $sort: { finalScore: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: 1 },
      {
        $project: {
          id: "$_id",
          name: 1,
          description: 1,
          price: 1,
          brand: 1,
          category: 1,
          rating: 1,
          stock: 1,
          finalScore: 1,
        },
      },
    ];

    const results = await Product.aggregate(pipeline).exec();

    return res.json({
      page,
      limit: 1,
      totalResults: results.length,
      product: results[0]
        ? {
            id: results[0].id.toString(),
            name: results[0].name,
            description: results[0].description,
            category: results[0].category,
            brand: results[0].brand,
            price: results[0].price,
            rating: results[0].rating,
            stock: results[0].stock,
            finalScore: results[0].finalScore,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
