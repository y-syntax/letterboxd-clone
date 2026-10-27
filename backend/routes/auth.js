const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, sendSignupOTP, sendPasswordResetOTP } = require('../utils/mailer');

// @route POST /api/auth/send-signup-otp
// @desc Send 6-digit OTP to verify email before registration
router.post('/send-signup-otp', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    const cleanUsername = username.trim();

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const existingUsername = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous signup OTPs for this email
    await OTP.deleteMany({ email: cleanEmail, type: 'signup' });

    // Save new OTP
    await OTP.create({
      email: cleanEmail,
      otp,
      type: 'signup',
      expiresAt
    });

    // Send email with OTP
    await sendSignupOTP(cleanEmail, otp, cleanUsername);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`
    });
  } catch (err) {
    console.error('send-signup-otp error:', err);
    res.status(500).json({ message: 'Failed to send verification email. Please check the email address and try again.' });
  }
});

// @route POST /api/auth/register
// @desc Verify OTP and complete registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Please provide email, username, and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Verify OTP
    if (!otp || !otp.trim()) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const otpRecord = await OTP.findOne({
      email: cleanEmail,
      type: 'signup',
      otp: otp.trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    existingUser = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      _id: require('crypto').randomUUID(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword
    });

    await user.save();

    // Clean up OTP
    await OTP.deleteMany({ email: cleanEmail, type: 'signup' });

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration', details: err.message });
  }
});

// @route POST /api/auth/forgot-password
// @desc Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address or username is required' });
    }

    const cleanInput = email.trim();
    const user = await User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { username: new RegExp(`^${cleanInput}$`, 'i') }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email or username' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous password_reset OTPs for this email
    await OTP.deleteMany({ email: user.email, type: 'password_reset' });

    await OTP.create({
      email: user.email,
      otp,
      type: 'password_reset',
      expiresAt
    });

    await sendPasswordResetOTP(user.email, otp, user.username);

    // Mask email for display in UI, e.g., a***n@gmail.com
    const [localPart, domain] = user.email.split('@');
    const maskedLocal = localPart.length > 2
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : localPart[0] + '*';
    const maskedEmail = `${maskedLocal}@${domain}`;

    res.status(200).json({
      success: true,
      email: user.email,
      maskedEmail,
      message: `Password reset code sent to ${maskedEmail}`
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
});

// @route POST /api/auth/reset-password
// @desc Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const otpRecord = await OTP.findOne({
      email: cleanEmail,
      type: 'password_reset',
      otp: otp.trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Clean up OTP
    await OTP.deleteMany({ email: cleanEmail, type: 'password_reset' });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// @route POST /api/auth/login
// @desc Authenticate user and get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists by email or username
    let user = await User.findOne({
      $or: [
        { email: new RegExp(`^${email}$`, 'i') },
        { username: new RegExp(`^${email}$`, 'i') }
      ]
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Access denied' });
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified.user || verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const Interaction = require('../models/Interaction');
const List = require('../models/List');

// @route GET /api/auth/me
// @desc Get current logged-in user profile with settings
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST or DELETE /api/auth/deactivate
// @desc Deactivate/delete user account and associated data
const handleDeactivate = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = user.username;

    // 1. Delete user interactions (ratings, reviews, watchlists, etc.)
    await Interaction.deleteMany({ userId });

    // 2. Delete user's created lists
    await List.deleteMany({ userId });

    // 3. Clean up followers / following / blockedUsers from other users
    await User.updateMany(
      {},
      {
        $pull: {
          following: { $in: [username, userId] },
          followers: { $in: [username, userId] },
          blockedUsers: { $in: [username, userId] }
        }
      }
    );

    // 4. Delete the user document
    await User.findByIdAndDelete(userId);

    // 5. Update followersCount and sync followers for all remaining users
    const remainingUsers = await User.find({});
    for (const u of remainingUsers) {
      const cleanFollowers = (u.followers || []).filter(id => id !== userId && id !== username);
      const cleanFollowing = (u.following || []).filter(id => id !== userId && id !== username);
      if (
        (u.followers && u.followers.length !== cleanFollowers.length) ||
        (u.following && u.following.length !== cleanFollowing.length) ||
        u.followersCount !== cleanFollowers.length
      ) {
        u.followers = cleanFollowers;
        u.followersCount = cleanFollowers.length;
        u.following = cleanFollowing;
        await u.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Account successfully deactivated and deleted.'
    });
  } catch (err) {
    console.error('Account deactivation error:', err);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
};

router.post('/deactivate', verifyToken, handleDeactivate);
router.delete('/deactivate', verifyToken, handleDeactivate);
router.delete('/account', verifyToken, handleDeactivate);

// @route PUT /api/auth/settings
// @desc Update user account settings and profile
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const {
      username,
      givenName,
      familyName,
      location,
      website,
      bio,
      pronoun,
      posters,
      replies,
      includeInMembers,
      adultContent,
      favoriteFilms
    } = req.body;

    let updatedUsername = user.username;

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      const existing = await User.findOne({ 
        username: new RegExp(`^${cleanUsername}$`, 'i'), 
        _id: { $ne: user.id } 
      });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = cleanUsername;
      updatedUsername = cleanUsername;

      // Update interactions and lists with new username
      await Interaction.updateMany({ userId: user.id }, { username: cleanUsername });
      await List.updateMany({ userId: user.id }, { username: cleanUsername });
    }

    if (givenName !== undefined) user.givenName = givenName.trim();
    if (familyName !== undefined) user.familyName = familyName.trim();
    if (location !== undefined) user.location = location.trim();
    if (website !== undefined) user.website = website.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (pronoun !== undefined) user.pronoun = pronoun;
    if (posters !== undefined) user.posters = posters;
    if (replies !== undefined) user.replies = replies;
    if (includeInMembers !== undefined) user.includeInMembers = Boolean(includeInMembers);
    if (adultContent !== undefined) user.adultContent = Boolean(adultContent);
    if (favoriteFilms !== undefined && Array.isArray(favoriteFilms)) {
      user.favoriteFilms = favoriteFilms.slice(0, 4);
    }

    await user.save();

    // Re-issue JWT if username changed
    let token;
    if (updatedUsername !== req.user.username) {
      token = jwt.sign(
        { user: { id: user.id, username: user.username } },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: 'Settings updated successfully',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

// @route GET /api/auth/user/:username/summary
// @desc Get full profile data & summary statistics for a user
router.get('/user/:username/summary', async (req, res) => {
  try {
    const cleanParam = req.params.username.trim();
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${cleanParam}$`, 'i') },
        { displayName: new RegExp(`^${cleanParam}$`, 'i') },
        ...(cleanParam.toLowerCase() === 'official' || cleanParam.toLowerCase() === 'officiallists'
          ? [{ username: new RegExp('^Official Lists$', 'i') }, { username: 'official' }]
          : [])
      ]
    }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userId = user.id;

    // 1. Total watched count
    const watchedCount = await Interaction.countDocuments({ userId, watched: true });

    // 2. Watched this year count
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const watchedThisYear = await Interaction.countDocuments({
      userId,
      watched: true,
      updatedAt: { $gte: startOfYear }
    });

    // 3. Watchlist count
    const watchlistCount = await Interaction.countDocuments({ userId, watchlist: true });

    // 4. Diary count
    const diaryCount = await Interaction.countDocuments({ userId, watched: true });

    // 5. Recent Likes (up to 4)
    const recentLikes = await Interaction.find({ userId, liked: true })
      .sort({ updatedAt: -1 })
      .limit(4);

    // 6. Recent Reviews
    const recentReviews = await Interaction.find({
      userId,
      review: { $exists: true, $ne: '' }
    }).sort({ updatedAt: -1 }).limit(5);

    // 7. Recent Watchlist (up to 4)
    const recentWatchlist = await Interaction.find({ userId, watchlist: true })
      .sort({ updatedAt: -1 })
      .limit(4);

    // 8. Ratings distribution
    const ratingsAgg = await Interaction.aggregate([
      { $match: { userId, rating: { $exists: true, $ne: null, $gt: 0 } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);
    const ratingsMap = {};
    ratingsAgg.forEach(r => { ratingsMap[r._id] = r.count; });
    const totalRatings = ratingsAgg.reduce((acc, curr) => acc + curr.count, 0);

    // 9. Activity timeline (recent 50 actions)
    const activityRaw = await Interaction.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50);

    const activityTimeline = activityRaw.map(item => {
      const actions = [];
      if (item.liked) actions.push('liked');
      if (item.rating) actions.push(`rated ${item.rating}★`);
      if (item.review) actions.push('reviewed');
      if (item.watched && !item.rating && !item.review && !item.liked) actions.push('watched');
      if (item.watchlist && !item.watched && !item.liked) actions.push('added to watchlist');
      return {
        _id: item._id,
        movieId: item.movieId,
        liked: item.liked,
        watched: item.watched,
        watchlist: item.watchlist,
        rating: item.rating,
        review: item.review,
        updatedAt: item.updatedAt || item.createdAt,
        actions: actions.length > 0 ? actions : ['interacted with']
      };
    });

    // 10. User lists & featured list
    const userLists = await List.find({
      $or: [
        { userId },
        { username: new RegExp(`^${user.username}$`, 'i') },
        ...(user.displayName ? [{ username: new RegExp(`^${user.displayName}$`, 'i') }] : [])
      ],
      visibility: { $ne: 'private' }
    }).sort({ createdAt: -1 });

    const listsCount = userLists.length;

    // Fetch existing valid followers and following to ensure 100% sync
    const existingFollowers = await User.find({ _id: { $in: user.followers || [] } }).select('_id');
    const existingFollowing = await User.find({ _id: { $in: user.following || [] } }).select('_id');
    const followersCount = existingFollowers.length;
    const followingCount = existingFollowing.length;

    // Auto-heal / sync in DB if counts or arrays were out of sync
    if (
      user.followersCount !== followersCount ||
      (user.followers && user.followers.length !== followersCount) ||
      (user.following && user.following.length !== followingCount)
    ) {
      user.followers = existingFollowers.map(f => f._id.toString());
      user.followersCount = followersCount;
      user.following = existingFollowing.map(f => f._id.toString());
      await user.save();
    }

    // Check viewer relationship
    let isFollowing = false;
    let isBlocked = false;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const viewerId = verified.user?.id || verified.id;
        if (viewerId) {
          const viewer = await User.findById(viewerId);
          if (viewer) {
            isFollowing = Boolean(viewer.following && viewer.following.includes(user.id));
            isBlocked = Boolean(viewer.blockedUsers && viewer.blockedUsers.includes(user.id));
          }
        }
      } catch (e) {}
    }

    res.status(200).json({
      user,
      isFollowing,
      isBlocked,
      stats: {
        watchedCount,
        watchedThisYear,
        watchlistCount,
        diaryCount,
        totalRatings,
        ratingsMap,
        followingCount,
        followersCount,
        listsCount
      },
      favoriteFilms: user.favoriteFilms || [],
      recentLikes,
      recentReviews,
      recentWatchlist,
      activityTimeline,
      userLists,
      featuredList: userLists[0] || null
    });
  } catch (err) {
    console.error('User summary error:', err);
    res.status(500).json({ error: 'Server error loading user summary' });
  }
});

// @route POST /api/auth/user/:username/follow
// @desc Follow a user
router.post('/user/:username/follow', verifyToken, async (req, res) => {
  try {
    const targetUsername = req.params.username.trim();
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({
      username: new RegExp(`^${targetUsername}$`, 'i')
    });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    // Check if current user has blocked target
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUser.id)) {
      return res.status(400).json({ error: 'You have blocked this member. Unblock them first to follow.' });
    }
    // Check if target user has blocked current user
    if (targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId)) {
      return res.status(403).json({ error: 'You cannot follow this member' });
    }

    if (!currentUser.following) currentUser.following = [];
    if (!currentUser.following.includes(targetUser.id)) {
      currentUser.following.push(targetUser.id);
      currentUser.followingCount = currentUser.following.length;
      await currentUser.save();
    }

    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followers.includes(currentUserId)) {
      targetUser.followers.push(currentUserId);
      targetUser.followersCount = targetUser.followers.length;
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      isFollowing: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Server error following user' });
  }
});

// @route POST /api/auth/user/:username/unfollow
// @desc Unfollow a user
router.post('/user/:username/unfollow', verifyToken, async (req, res) => {
  try {
    const targetUsername = req.params.username.trim();
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({
      username: new RegExp(`^${targetUsername}$`, 'i')
    });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    if (currentUser.following) {
      currentUser.following = currentUser.following.filter(id => id !== targetUser.id);
      currentUser.followingCount = currentUser.following.length;
      await currentUser.save();
    }

    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      targetUser.followersCount = targetUser.followers.length;
      await targetUser.save();
    }

    res.status(200).json({
      success: true,
      isFollowing: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Server error unfollowing user' });
  }
});

// @route POST /api/auth/user/:username/block
// @desc Block a user
router.post('/user/:username/block', verifyToken, async (req, res) => {
  try {
    const targetUsername = req.params.username.trim();
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({
      username: new RegExp(`^${targetUsername}$`, 'i')
    });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
    if (!currentUser.blockedUsers.includes(targetUser.id)) {
      currentUser.blockedUsers.push(targetUser.id);
    }

    // Unfollow both directions
    if (currentUser.following && currentUser.following.includes(targetUser.id)) {
      currentUser.following = currentUser.following.filter(id => id !== targetUser.id);
      currentUser.followingCount = currentUser.following.length;
    }
    if (currentUser.followers && currentUser.followers.includes(targetUser.id)) {
      currentUser.followers = currentUser.followers.filter(id => id !== targetUser.id);
      currentUser.followersCount = currentUser.followers.length;
    }
    await currentUser.save();

    if (targetUser.following && targetUser.following.includes(currentUserId)) {
      targetUser.following = targetUser.following.filter(id => id !== currentUserId);
      targetUser.followingCount = targetUser.following.length;
    }
    if (targetUser.followers && targetUser.followers.includes(currentUserId)) {
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      targetUser.followersCount = targetUser.followers.length;
    }
    await targetUser.save();

    res.status(200).json({
      success: true,
      isBlocked: true,
      message: `You have blocked ${targetUser.displayName || targetUser.username}`
    });
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ error: 'Server error blocking user' });
  }
});

// @route POST /api/auth/user/:username/unblock
// @desc Unblock a user
router.post('/user/:username/unblock', verifyToken, async (req, res) => {
  try {
    const targetUsername = req.params.username.trim();
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({
      username: new RegExp(`^${targetUsername}$`, 'i')
    });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    if (currentUser.blockedUsers) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id !== targetUser.id);
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      isBlocked: false,
      message: `You have unblocked ${targetUser.displayName || targetUser.username}`
    });
  } catch (err) {
    console.error('Unblock error:', err);
    res.status(500).json({ error: 'Server error unblocking user' });
  }
});

// @route GET /api/auth/user/:username/network
// @desc Get Following, Followers, and Blocked members for a user
router.get('/user/:username/network', async (req, res) => {
  try {
    const targetUsername = req.params.username.trim();
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${targetUsername}$`, 'i') },
        { displayName: new RegExp(`^${targetUsername}$`, 'i') }
      ]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let currentUserId = null;
    let currentUser = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = verified.user?.id || verified.id;
        if (currentUserId) {
          currentUser = await User.findById(currentUserId);
        }
      } catch (e) {}
    }

    const isOwner = Boolean(currentUser && currentUser.id === user.id);

    // Fetch Following Members
    const followingIds = user.following || [];
    const followingUsers = await User.find({ _id: { $in: followingIds } })
      .select('_id username displayName bio location followers following badge');

    // Fetch Followers Members
    const followersIds = user.followers || [];
    const followersUsers = await User.find({ _id: { $in: followersIds } })
      .select('_id username displayName bio location followers following badge');

    // Self-healing: if any deleted users were in followers or following, clean them up
    if (
      (user.followers && user.followers.length !== followersUsers.length) ||
      (user.following && user.following.length !== followingUsers.length) ||
      user.followersCount !== followersUsers.length
    ) {
      user.followers = followersUsers.map(f => f._id.toString());
      user.followersCount = followersUsers.length;
      user.following = followingUsers.map(f => f._id.toString());
      await user.save();
    }

    // Fetch Blocked Members (Only owner can see their blocked list)
    let blockedUsers = [];
    if (isOwner && user.blockedUsers && user.blockedUsers.length > 0) {
      blockedUsers = await User.find({ _id: { $in: user.blockedUsers } })
        .select('_id username displayName bio location followers following badge');
    }

    const formatMember = (m) => {
      const isFollowing = currentUser?.following?.includes(m.id) || false;
      const isBlocked = currentUser?.blockedUsers?.includes(m.id) || false;
      return {
        id: m.id,
        _id: m._id,
        username: m.username,
        displayName: m.displayName || m.username,
        bio: m.bio || '',
        location: m.location || '',
        badge: m.badge || '',
        followersCount: m.followers?.length || 0,
        followingCount: m.following?.length || 0,
        isFollowing,
        isBlocked
      };
    };

    res.status(200).json({
      targetUser: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username
      },
      isOwner,
      following: followingUsers.map(formatMember),
      followers: followersUsers.map(formatMember),
      blocked: blockedUsers.map(formatMember)
    });
  } catch (err) {
    console.error('Network endpoint error:', err);
    res.status(500).json({ error: 'Server error loading network' });
  }
});

// @route GET /api/auth/members
// @desc Get community members with stats (watched count, reviews count, likes received, followers count) & search
router.get('/members', async (req, res) => {
  try {
    const { sort = 'popular', q = '', page = 1, limit = 60 } = req.query;

    let currentUserId = null;
    let currentUser = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = verified.user?.id || verified.id;
        if (currentUserId) {
          currentUser = await User.findById(currentUserId);
        }
      } catch (e) {}
    }

    // Build filter
    const queryFilter = { includeInMembers: { $ne: false } };
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      queryFilter.$or = [
        { username: regex },
        { displayName: regex },
        { givenName: regex },
        { familyName: regex },
        { bio: regex }
      ];
    }

    const users = await User.find(queryFilter)
      .select('_id username displayName givenName familyName bio location website badge favoriteFilms followers following createdAt')
      .lean();

    // Aggregate interaction stats for all users
    const stats = await Interaction.aggregate([
      {
        $group: {
          _id: "$userId",
          watchedCount: { $sum: { $cond: [{ $eq: ["$watched", true] }, 1, 0] } },
          reviewsCount: { 
            $sum: { 
              $cond: [
                { $and: [{ $ne: ["$review", null] }, { $ne: ["$review", ""] }] }, 
                1, 
                0
              ] 
            } 
          },
          likesCount: {
            $sum: {
              $cond: [
                { $isArray: "$reviewLikes" },
                { $size: "$reviewLikes" },
                0
              ]
            }
          }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id] = {
        watchedCount: s.watchedCount || 0,
        reviewsCount: s.reviewsCount || 0,
        likesCount: s.likesCount || 0
      };
    });

    const members = users.map(u => {
      const uStats = statsMap[u._id] || { watchedCount: 0, reviewsCount: 0, likesCount: 0 };
      const followersCount = Array.isArray(u.followers) ? u.followers.length : (u.followersCount || 0);
      const followingCount = Array.isArray(u.following) ? u.following.length : (u.followingCount || 0);
      const popularityScore = (uStats.likesCount * 3) + (followersCount * 2) + (uStats.reviewsCount * 2) + (uStats.watchedCount * 1);
      const isFollowing = currentUser?.following?.includes(u._id) || false;
      const isSelf = currentUserId === u._id;

      return {
        id: u._id,
        _id: u._id,
        username: u.username,
        displayName: u.displayName || u.username,
        givenName: u.givenName || '',
        familyName: u.familyName || '',
        bio: u.bio || '',
        location: u.location || '',
        website: u.website || '',
        badge: u.badge || '',
        favoriteFilms: Array.isArray(u.favoriteFilms) ? u.favoriteFilms : [],
        createdAt: u.createdAt,
        watchedCount: uStats.watchedCount,
        reviewsCount: uStats.reviewsCount,
        likesCount: uStats.likesCount,
        followersCount,
        followingCount,
        popularityScore,
        isFollowing,
        isSelf
      };
    });

    // Sort members based on requested parameter
    if (sort === 'reviews') {
      members.sort((a, b) => b.reviewsCount - a.reviewsCount || b.popularityScore - a.popularityScore);
    } else if (sort === 'films') {
      members.sort((a, b) => b.watchedCount - a.watchedCount || b.popularityScore - a.popularityScore);
    } else if (sort === 'likes') {
      members.sort((a, b) => b.likesCount - a.likesCount || b.popularityScore - a.popularityScore);
    } else if (sort === 'followers') {
      members.sort((a, b) => b.followersCount - a.followersCount || b.popularityScore - a.popularityScore);
    } else if (sort === 'recent') {
      members.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      // Default: 'popular'
      members.sort((a, b) => b.popularityScore - a.popularityScore || b.reviewsCount - a.reviewsCount);
    }

    const total = members.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 60);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = members.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      members: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Members endpoint error:', err);
    res.status(500).json({ error: 'Server error loading members' });
  }
});

module.exports = router;

