const mongoose = require('mongoose');
const crypto = require('crypto');

const movieSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  tmdbId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: [String], required: true },
  director: { type: String, required: true },
  description: { type: String },
  poster: { type: String, required: true },
  addedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
