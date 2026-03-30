const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 🛒 Universal Shop Purchase Route
router.post('/buy/:itemId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { itemId } = req.params;
        
        let cost = 0;
        if (itemId === 'streak_freeze') cost = 500;
        else if (itemId === 'xp_booster') cost = 1200;
        else return res.status(400).json({ msg: "Item not found in the shop." });

        if (user.gamification.totalPoints < cost) {
            return res.status(400).json({ msg: "Not enough XP. Keep learning!" });
        }

        // Deduct points
        user.gamification.totalPoints -= cost;

        // Add to inventory safely
        if (!user.gamification.inventory) user.gamification.inventory = {};
        
        if (itemId === 'streak_freeze') {
            user.gamification.inventory.streakFreeze = (user.gamification.inventory.streakFreeze || 0) + 1;
        }
        if (itemId === 'xp_booster') {
            user.gamification.inventory.xpBoosters = (user.gamification.inventory.xpBoosters || 0) + 1;
        }

        await user.save();
        res.json({
            msg: "Item successfully purchased!",
            gamification: user.gamification
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;