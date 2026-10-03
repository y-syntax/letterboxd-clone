const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Interaction = require('../models/Interaction');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Access denied' });
  
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified.user || verified; // Contains { id, username }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// GET user's interaction for a specific movie
router.get('/:movieId', verifyToken, async (req, res) => {
  try {
    const interaction = await Interaction.findOne({ userId: req.user.id, movieId: req.params.movieId });
    res.status(200).json(interaction || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST to update or create an interaction
router.post('/', verifyToken, async (req, res) => {
  try {
    const { movieId, liked, watchlist, watched, rating, review } = req.body;
    
    if (!movieId) return res.status(400).json({ error: 'movieId is required' });

    let interaction = await Interaction.findOne({ userId: req.user.id, movieId });
    const user = await User.findById(req.user.id);
    const username = user ? user.username : 'Anonymous';
    
    if (interaction) {
      // Update fields if provided
      if (liked !== undefined) interaction.liked = liked;
      if (watchlist !== undefined) interaction.watchlist = watchlist;
      if (watched !== undefined) interaction.watched = watched;
      if (rating !== undefined) interaction.rating = rating;
      if (review !== undefined) interaction.review = review;
      interaction.username = username;
    } else {
      interaction = new Interaction({
        userId: req.user.id,
        username,
        movieId,
        liked,
        watchlist,
        watched,
        rating,
        review
      });
    }
    
    await interaction.save();
    res.status(200).json({ message: 'Interaction saved', interaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// GET all reviews for a specific movie (Public)
router.get('/movie/:movieId/reviews', async (req, res) => {
  try {
    const interactions = await Interaction.find({ 
      movieId: req.params.movieId, 
      review: { $exists: true, $ne: "" } 
    }).sort({ createdAt: -1 });
    res.status(200).json(interactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST reply to a review
router.post('/:interactionId/reply', verifyToken, async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.interactionId);
    if (!interaction) return res.status(404).json({ error: 'Review not found' });
    
    const user = await User.findById(req.user.id);
    
    interaction.replies.push({
      userId: req.user.id,
      username: user ? user.username : 'Anonymous',
      text: req.body.text
    });
    
    await interaction.save();
    res.status(200).json({ message: 'Reply added', interaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST like a review
router.post('/:interactionId/like', verifyToken, async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.interactionId);
    if (!interaction) return res.status(404).json({ error: 'Review not found' });
    
    const userId = req.user.id;
    const hasLiked = interaction.reviewLikes.includes(userId);
    
    if (hasLiked) {
      interaction.reviewLikes = interaction.reviewLikes.filter(id => id !== userId);
    } else {
      interaction.reviewLikes.push(userId);
    }
    
    await interaction.save();
    res.status(200).json({ message: 'Like toggled', interaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
