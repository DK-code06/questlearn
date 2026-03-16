const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const InstructorRequest = require('../models/InstructorRequest');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

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
                _id: u._id,
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


// ==========================================
// 📄 5. GET PENDING INSTRUCTOR REQUESTS
// ==========================================
router.get('/instructor-requests', [auth, adminAuth], async (req, res) => {
    try {
        const requests = await InstructorRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ✅ 6. APPROVE INSTRUCTOR REQUEST & EMAIL THEM
// ==========================================
router.post('/instructor-requests/:id/approve', [auth, adminAuth], async (req, res) => {
    try {
        const request = await InstructorRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ msg: 'Already processed' });

        // Check if user already exists
        let user = await User.findOne({ email: request.email });
        if (user) return res.status(400).json({ msg: 'User already exists with this email' });

        // Create the Instructor Account with a Default Password
        const defaultPassword = "QuestInstructor123!";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        user = new User({
            name: request.name,
            email: request.email,
            password: hashedPassword,
            role: 'instructor',
            domain: request.domain,
            location: { city: request.city, country: 'India' },
            instructorStats: { totalCourses: 0, totalStudents: 0 }
        });

        await user.save();

        // Mark request as approved
        request.status = 'approved';
        await request.save();

        // 📧 SEND WELCOME EMAIL
        try {
            const emailMessage = `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; background-color: #0a0a0a; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #333;">
                    <h1 style="color: #a855f7; text-align: center; text-transform: uppercase; font-style: italic;">Welcome to QuestLearn</h1>
                    <p style="font-size: 16px;">Greetings ${user.name},</p>
                    <p style="font-size: 16px; color: #ccc;">The High Council has reviewed your dossier and approved your application to become an Instructor.</p>
                    <div style="background-color: #000; padding: 20px; border-radius: 10px; border: 1px solid #333; margin: 30px 0;">
                        <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Credentials</p>
                        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 0;"><strong>Temporary Passkey:</strong> <span style="color: #00f3ff; font-family: monospace; font-size: 18px;">${defaultPassword}</span></p>
                    </div>
                    <p style="font-size: 14px; color: #ff4444; font-weight: bold;">⚠️ IMPORTANT: Please log in and change your temporary passkey immediately.</p>
                    <a href="${process.env.FRONTEND_URL || 'https://questlearn-six.vercel.app'}/login" style="display: block; width: 100%; text-align: center; background-color: #a855f7; color: #fff; padding: 15px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 30px; text-transform: uppercase; letter-spacing: 2px;">Access Creator Studio</a>
                </div>
            `;

            await sendEmail({
                email: user.email,
                subject: 'Your QuestLearn Instructor Account is Ready!',
                message: emailMessage
            });
            console.log(`Email successfully sent to ${user.email}`);
        } catch (emailError) {
            console.error("Email failed to send, but account was created:", emailError);
        }

        res.json({ msg: `Instructor created successfully! Welcome email dispatched.` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ❌ 7. REJECT INSTRUCTOR REQUEST
// ==========================================
router.post('/instructor-requests/:id/reject', [auth, adminAuth], async (req, res) => {
    try {
        const request = await InstructorRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        request.status = 'rejected';
        await request.save();

        res.json({ msg: 'Application rejected and archived.' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;