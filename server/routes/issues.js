const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');

// 📩 1. SUBMIT AN ISSUE (For Students & Instructors)
router.post('/', auth, async (req, res) => {
    try {
        const { subject, description, role, name } = req.body;
        const newIssue = new Issue({
            reporter: req.user.id,
            reporterName: name,
            role: role,
            subject,
            description
        });
        await newIssue.save();
        res.json({ msg: "Issue reported to the High Council." });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 📋 2. GET ALL ISSUES (Admin Only - Used by your AdminDashboard)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: "Denied" });
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;