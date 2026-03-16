const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
// ==========================================
// 📈 1. UPDATE PROGRESS, MARKS & XP
// ==========================================
router.put('/progress', auth, async (req, res) => {
    const { courseId, sectionId, xpEarned, score, totalPossible } = req.body;

    try {
        let progress = await Progress.findOne({ student: req.user.id, course: courseId });

        if (!progress) {
            progress = new Progress({
                student: req.user.id,
                course: courseId,
                completedSections: []
            });
            await progress.save();
        }

        const alreadyDone = progress.completedSections.some(s => 
            (s.sectionId && s.sectionId.toString() === sectionId.toString()) || 
            (s.toString() === sectionId.toString())
        );

        if (alreadyDone) {
            return res.status(200).json({ msg: 'Level already cleared' });
        }

        const updatedProgress = await Progress.findOneAndUpdate(
            { student: req.user.id, course: courseId },
            { 
                $push: { 
                    completedSections: {
                        sectionId: sectionId.toString(),
                        score: Number(score) || 0,
                        totalPossible: Number(totalPossible) || 10,
                        completedAt: new Date()
                    } 
                } 
            },
            { new: true } 
        );

        const courseData = await Course.findById(courseId);
        if (courseData && updatedProgress.completedSections.length === courseData.sections.length) {
            updatedProgress.isCompleted = true;
            updatedProgress.completionDate = new Date();
            await updatedProgress.save();
        }

        const user = await User.findById(req.user.id);
        if (user) {
            let pointsGained = Number(xpEarned) || 10;
            const currentScore = Number(score) || 0;
            const maxScore = Number(totalPossible) || 10;

            if (currentScore === maxScore && maxScore > 0) {
                user.gamification.medals.gold += 1;
                pointsGained += 5; 
            } else if (currentScore >= maxScore * 0.5) {
                user.gamification.medals.silver += 1;
            }

            if (user.gamification.streak >= 5) {
                pointsGained = Math.round(pointsGained * 1.2);
            }

            user.gamification.totalPoints += pointsGained;
            user.gamification.weeklyPoints += pointsGained;
            user.gamification.lastActive = new Date();
            
            await user.save();

            await Analytics.create({
                user: req.user.id,
                role: user.role,
                action: 'completed_section',
                duration: pointsGained,
                startTime: new Date()
            });

            return res.json({ 
                msg: 'Quest Synced!', 
                totalXP: user.gamification.totalPoints,
                pointsGained,
                medals: user.gamification.medals
            });
        }
        res.status(404).json({ msg: 'Hero not found' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// ==========================================
// 👤 2. UPDATE PROFILE (Modify Dossier)
// ✅ FIXED: Added profilePic and ensured persistence
// ==========================================
router.put('/update-profile', auth, async (req, res) => {
    // Destructure all possible fields from the body
    const { name, dob, domain, currentStudying, city, country, profilePic } = req.body;
    
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "Hero record not found" });

        // Update Top Level Fields if they exist in request
        if (name) user.name = name;
        if (dob) user.dob = dob;
        if (domain) user.domain = domain;
        if (currentStudying) user.currentStudying = currentStudying;
        
        // 📸 SAVE PROFILE PHOTO
        if (profilePic) user.profilePic = profilePic;

        // 🟢 Robust Location Update
        if (city !== undefined) user.location.city = city;
        if (country !== undefined) user.location.country = country;

        await user.save();
        
        // Return the full updated user object (minus password) to update frontend context
        const userResponse = await User.findById(req.user.id).select('-password');
        res.json(userResponse);
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ msg: 'Command Center Sync Error' });
    }
});

// ==========================================
// 📊 3. GET PROFILE STATS (Ongoing vs Completed)
// ==========================================
router.get('/profile-stats', auth, async (req, res) => {
    try {
        const progresses = await Progress.find({ student: req.user.id }).populate('course');
        
        const completed = progresses
            .filter(p => p.isCompleted && p.course)
            .map(p => ({ 
                _id: p.course._id, 
                title: p.course.title 
            }));

        const ongoing = progresses
            .filter(p => !p.isCompleted && p.course)
            .map(p => {
                const totalSections = p.course.sections ? p.course.sections.length : 1;
                const progressPct = Math.round((p.completedSections.length / totalSections) * 100);
                return { 
                    _id: p.course._id, 
                    title: p.course.title, 
                    category: p.course.category || 'General',
                    progress: progressPct 
                };
            });

        res.json({ completed, ongoing });
    } catch (err) {
        console.error("Profile Stats Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 🏅 4. LEADERBOARD
// ==========================================
router.get('/leaderboard/:timeframe', auth, async (req, res) => {
    const { timeframe } = req.params;
    let dateLimit = new Date();

    if (timeframe === 'daily') dateLimit.setHours(0, 0, 0, 0);
    else if (timeframe === 'weekly') dateLimit.setDate(dateLimit.getDate() - 7);
    else if (timeframe === 'monthly') dateLimit.setMonth(dateLimit.getMonth() - 1);
    else dateLimit = new Date(0); 

    try {
        const rankings = await Progress.aggregate([
            { $unwind: "$completedSections" },
            { $match: { "completedSections.completedAt": { $gte: dateLimit } } },
            {
                $group: {
                    _id: "$student",
                    periodicXP: { $sum: 10 } 
                }
            },
            { $sort: { periodicXP: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    name: "$userDetails.name",
                    periodicXP: 1,
                    totalPoints: "$userDetails.gamification.totalPoints",
                    streak: "$userDetails.gamification.streak",
                    city: "$userDetails.location.city" 
                }
            }
        ]);
        res.json(rankings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
// ==========================================
// 🛡️ GET ALLY INTEL (For Social Hub Dossier)
// ✅ NEW: Aggregates level, streak, and mission history
// ==========================================
router.get('/ally-intel/:id', auth, async (req, res) => {
    try {
        // 1. Fetch Ally profile and gamification stats
        const ally = await User.findById(req.params.id)
            .select('name profilePic gamification location');
        
        if (!ally) {
            return res.status(404).json({ msg: "Hero not found in database" });
        }

        // 2. Fetch the Ally's completed mission history
        const progresses = await Progress.find({ 
            student: req.params.id, 
            isCompleted: true 
        }).populate('course', 'title');

        const completedQuests = progresses.map(p => ({
            title: p.course?.title || "Classified Operation"
        }));

        // 3. Construct the response for the Dossier modal
        res.json({
            name: ally.name,
            profilePic: ally.profilePic,
            gamification: {
                totalPoints: ally.gamification.totalPoints,
                streak: ally.gamification.streak,
                medals: ally.gamification.medals
            },
            completedCount: completedQuests.length,
            completedQuests: completedQuests
        });
    } catch (err) {
        console.error("Dossier Fetch Error:", err.message);
        res.status(500).send('Server Intelligence Failure');
    }
});

// ==========================================
// 🔐 CHANGE PASSWORD
// ==========================================
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        
        // 1. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect.' });
        }

        // 2. Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Passkey successfully updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
module.exports = router;