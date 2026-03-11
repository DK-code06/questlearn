const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Issue = require('../models/Issue'); // ✅ Added Issue model
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
// Middleware to ensure ONLY Admin can enter
const adminAuth = (req, res, next) => {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: "Admin Access Denied" });
    }
    next();
};

// ==========================================
// 📊 1. GET SYSTEM-WIDE ANALYTICS
// ==========================================
router.get('/stats', [auth, adminAuth], async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstructors = await User.countDocuments({ role: 'instructor' });
        const totalCourses = await Course.countDocuments();
        
        const courses = await Course.find().select('title enrolledStudents sections averageRating');
        const courseData = courses.map(c => ({
            title: c.title,
            studentCount: c.enrolledStudents.length,
            sectionCount: c.sections.length,
            rating: c.averageRating
        }));

        res.json({ totalStudents, totalInstructors, totalCourses, courseData });
    } catch (err) { 
        res.status(500).send('Server Error'); 
    }
});

// ==========================================
// 🛡️ 2. USER MANAGEMENT (Delete User)
// ==========================================
router.delete('/user/:id', [auth, adminAuth], async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User eliminated from the quest realm." });
    } catch (err) { 
        res.status(500).send('Server Error'); 
    }
});

// ==========================================
// 🔍 3. DETAILED USER LOOKUP
// ==========================================
router.get('/users/details', [auth, adminAuth], async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email gamification');
        
        const detailedStudents = await Promise.all(students.map(async (student) => {
            const progress = await Progress.find({ student: student._id }).populate('course', 'title sections');
            
            return {
                ...student._doc,
                ongoingCourses: progress.filter(p => !p.isCompleted).length,
                completedCourses: progress.filter(p => p.isCompleted).length,
                details: progress.map(p => ({
                    title: p.course?.title,
                    percent: p.course?.sections.length > 0 
                        ? ((p.completedSections.length / p.course.sections.length) * 100).toFixed(0) 
                        : 0
                }))
            };
        }));

        const instructors = await User.find({ role: 'instructor' });
        const detailedInstructors = await Promise.all(instructors.map(async (ins) => {
            const courses = await Course.find({ instructor: ins._id });
            const totalStudentsInAllCourses = courses.reduce((acc, curr) => acc + curr.enrolledStudents.length, 0);
            
            return {
                ...ins._doc,
                courseCount: courses.length,
                impact: totalStudentsInAllCourses,
                courseList: courses.map(c => ({ title: c.title, students: c.enrolledStudents.length }))
            };
        }));

        res.json({ students: detailedStudents, instructors: detailedInstructors });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ⚠️ 4. GET ALL ISSUES (For the sidebar)
// ==========================================
router.get('/issues', [auth, adminAuth], async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 📈 GET INDIVIDUAL ENGAGEMENT DATA
router.get('/engagement/details', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('name role');
        
        const engagementReport = await Promise.all(users.map(async (u) => {
            // Find sessions and handle case where no sessions exist
            const sessions = await Analytics.find({ user: u._id }) || [];
            
            // Calculate total time safely
            const totalMinutes = sessions.reduce((acc, curr) => {
                return acc + (Number(curr.duration) || 0);
            }, 0);

            return {
                _id: u._id, // ✅ Send the ID for the React 'key'
                name: u.name,
                role: u.role,
                totalMinutes: Math.round(totalMinutes),
                sessionCount: sessions.length
            };
        }));

        res.json(engagementReport);
    } catch (err) {
        console.error("Engagement Route Error:", err.message);
        res.status(500).json({ msg: 'Server Error calculating engagement' });
    }
});

module.exports = router;