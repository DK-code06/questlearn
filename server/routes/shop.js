const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 🛒 Buy a Streak Freeze (Cost: 500 Points)
router.post('/buy-freeze', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const COST = 500;

        if (user.gamification.totalPoints < COST) {
            return res.status(400).json({ msg: "Not enough XP. Keep questing!" });
        }

        // Deduct points and add to inventory
        user.gamification.totalPoints -= COST;
        user.gamification.inventory.streakFreeze += 1;

        await user.save();
        res.json({ 
            msg: "Shield Acquired! Your streak is protected.", 
            inventory: user.gamification.inventory,
            balance: user.gamification.totalPoints 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;