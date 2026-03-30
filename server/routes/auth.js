const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');
const InstructorRequest = require('../models/InstructorRequest');

// ==========================================
// 1. REGISTER USER (Sign Up)
// ==========================================
router.post('/register', async (req, res) => {
  const { name, email, password, role, city } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role: role || 'student',
      location: { city: city || 'Unknown', country: 'India' },
      gamification: {
        streak: 1, // 🟢 Always start at 1 for Day 1
        lastActive: new Date(),
        totalPoints: 0,
        inventory: { streakFreeze: 0 }
      }
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ==========================================
// 2. LOGIN USER (With Streak Fix & Speed Boost)
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 🔥 STREAK LOGIC 🔥
    const now = new Date();
    const lastActive = new Date(user.gamification?.lastActive || now);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 🟢 Fix: If streak is 0, jumpstart it to 1 because the user is active today
    if (!user.gamification.streak || user.gamification.streak === 0) {
      user.gamification.streak = 1;
    } 
    else if (diffDays === 1) {
      // Returned exactly the next day
      user.gamification.streak += 1;
    } 
    else if (diffDays > 1) {
      // 🛡️ Check for Streak Freeze protection
      if (user.gamification.inventory?.streakFreeze > 0) {
        user.gamification.inventory.streakFreeze -= 1;
        // Streak is preserved (doesn't reset)
      } else {
        // Streak broken, start again at 1
        user.gamification.streak = 1;
      }
    }

    user.gamification.lastActive = now;
    user.isOnline = true;
    await user.save(); // Wait for user save

    const payload = { user: { id: user.id, role: user.role } };

    // ⚡ SPEED FIX: Do not 'await' analytics. Let it save in the background!
    Analytics.create({
      user: user._id,
      role: user.role,
      action: 'login',
      startTime: new Date()
    }).catch(err => console.error("Analytics Error:", err.message));

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      
      // ⚡ SPEED FIX: Send the whole 'user' object back so frontend doesn't have to ask for it again
      user.password = undefined; // Don't send password hash to client
      
      res.json({
        token,
        role: user.role,
        streak: user.gamification.streak,
        freezes: user.gamification.inventory?.streakFreeze || 0,
        user: user // Inject user profile into payload
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 3. SUBMIT INSTRUCTOR REQUEST (Public API)
// ==========================================
router.post('/request-instructor', async (req, res) => {
    try {
        const { name, email, institution, city, domain, experience, credentialFile } = req.body;

        // 1. Check if user already exists in the system
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'An account with this email already exists.' });
        }

        // 2. Check if they already applied
        let existingRequest = await InstructorRequest.findOne({ email });
        if (existingRequest) {
            return res.status(400).json({ msg: 'An application for this email is already pending review.' });
        }

        // 3. Save the request
        const newRequest = new InstructorRequest({
            name, email, institution, city, domain, experience, credentialFile
        });

        await newRequest.save();
        res.status(201).json({ msg: 'Application transmitted successfully! The High Council will review your dossier.' });

    } catch (err) {
        console.error("Instructor Request Error:", err.message);
        res.status(500).json({ msg: 'Server error processing application.' });
    }
});

module.exports = router;