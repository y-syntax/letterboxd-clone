const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Lazy save / upsert a movie from TMDB
router.post('/upsert', async (req, res) => {
  try {
    const { tmdbId, title, year, genre, director, description, poster } = req.body;

    if (!tmdbId) {
      return res.status(400).json({ error: "tmdbId is required" });
    }

    // Check if it already exists in our MongoDB
    let movie = await Movie.findOne({ tmdbId: tmdbId.toString() });
    
    if (!movie) {
      // It doesn't exist yet! Let's save it to MongoDB
      movie = new Movie({
        tmdbId: tmdbId.toString(),
        title: title || 'Unknown Title',
        year: year || 2026,
        genre: genre && genre.length ? genre : ['Drama'],
        director: director || 'Unknown',
        description: description || '',
        poster: poster || '',
        addedBy: 'user_interaction'
      });
      await movie.save();
    }

    // Return the MongoDB document (including its local _id)
    res.status(200).json({ message: "Movie ready", movie });
  } catch (error) {
    console.error("Error upserting movie:", error);
    res.status(500).json({ error: "Server error saving movie" });
  }
});

module.exports = router;
