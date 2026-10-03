const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const interactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String }, // For easy display
  movieId: { type: String, required: true }, // TMDB ID
  liked: { type: Boolean, default: false },
  watchlist: { type: Boolean, default: false },
  watched: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  reviewLikes: { type: [String], default: [] },
  replies: [replySchema]
}, { timestamps: true });

// Ensure a user can only have one interaction record per movie
interactionSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Interaction', interactionSchema);
