const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

// 📊 1. Get Student Marks Report for a Course
router.get('/reports/:courseId', auth, async (req, res) => {
    try {
        const reports = await Progress.find({ course: req.params.courseId })
            // 🟢 POPULATE the nested location object
            .populate('student', 'name email location') 
            .select('completedSections student');
        res.json(reports);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
// 🔍 Get detailed section-wise marks for a specific student
// 🔍 Get detailed section-wise marks for a specific student
router.get('/student-detail/:courseId/:studentId', auth, async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        // 1. Find the student's progress for this specific course
        const progress = await Progress.findOne({ 
            course: courseId, 
            student: studentId 
        }).populate('student', 'name email location');

        // 🟢 If no progress document exists, it means the student hasn't started any levels
        if (!progress) {
            const studentUser = await User.findById(studentId).select('name email location');
            return res.json({
                student: studentUser,
                results: [], // Return empty array instead of 404 so the UI doesn't crash
                msg: "Hero has not started any missions yet."
            });
        }

        // 2. Fetch course data to get the Level Titles
        const course = await Course.findById(courseId);

        // 3. Map the completed sections to a readable format
        const detailedResults = progress.completedSections.map(completed => {
            // Find the specific section in the course curriculum
            const sectionData = course.sections.id(completed.sectionId);
            
            return {
                title: sectionData ? sectionData.title : "Classified Level",
                score: completed.score || 0,
                totalPossible: completed.totalPossible || 10,
                completedAt: completed.completedAt,
                type: sectionData ? sectionData.type : 'text'
            };
        });

        res.json({
            student: progress.student,
            results: detailedResults
        });
    } catch (err) {
        console.error("Intel Fetch Error:", err.message);
        res.status(500).json({ msg: 'Server Intel Failure', error: err.message });
    }
});
// 🌍 2. Get Geographical Distribution of Students
// 🌍 Update the Geo-Analytics Route
router.get('/geo-analytics/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Fetch all enrolled students and their full profiles
        const students = await User.find({ _id: { $in: course.enrolledStudents } });

        const locationMap = {};

        students.forEach(s => {
            // 🟢 LOGIC FIX: Access the nested 'location.city' correctly
            const city = (s.location && s.location.city && s.location.city !== "Unknown") 
                         ? s.location.city 
                         : "Unknown";
            
            locationMap[city] = (locationMap[city] || 0) + 1;
        });

        // Determine leader (excluding "Unknown" if possible)
        const citiesOnly = { ...locationMap };
        delete citiesOnly["Unknown"];

        const sortedRegions = Object.entries(citiesOnly).sort((a, b) => b[1] - a[1]);
        const leader = sortedRegions.length > 0 ? sortedRegions[0][0] : "Unknown";

        res.json({
            highestRegion: leader,
            totalUniqueLocations: Object.keys(citiesOnly).length,
            fullBreakdown: locationMap
        });
    } catch (err) {
        console.error("Geo-Intel failure:", err);
        res.status(500).send('Server Error');
    }
});
module.exports = router;