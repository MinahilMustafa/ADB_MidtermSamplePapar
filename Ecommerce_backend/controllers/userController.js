import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * @desc Get all users (admin only)
 * @route GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v').lean();
    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * @desc Get a single user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * @desc Create a new user
 * @route POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, location } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ name, email, location });
    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * @desc Update user details
 * @route PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { name, location } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, location },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * @desc Delete user
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * @desc Get all orders of a user
 * @route GET /api/users/:id/orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const orders = await Order.find({ userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('items.productId', 'name price category')
      .lean();

    if (!orders.length)
      return res.status(404).json({ message: 'No orders found for this user' });

    return res.status(200).json({ page, total: orders.length, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
};
