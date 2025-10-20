const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  rating: Number,
  reviewText: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
