const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ✅ Import the execution service
const { evaluateSubmission } = require('../services/codeExecutionService');

// ==========================================
// 1. 🟢 GET ALL COURSES (Student Dashboard)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name');
    res.json(courses);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 👤 GET INSTRUCTOR'S OWN COURSES
// ==========================================
router.get('/my-courses', auth, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 🔴 GET LIVE STATUS (For Instructor Dashboard)
// ==========================================
router.get('/:id/live-status', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).select('liveSession');
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        
        // Return defaults if liveSession is undefined
        res.json(course.liveSession || { isActive: false, meetingLink: '' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 🔴 TOGGLE LIVE STATUS (Start/Stop Class)
// ==========================================
router.post('/:id/live-status', auth, async (req, res) => {
    try {
        const { isActive } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ msg: "Course not found" });

        // Security Check
        if (course.instructor.toString() !== req.user.id) {
            return res.status(401).json({ msg: "Not Authorized" });
        }

        // Initialize object if missing
        if (!course.liveSession) course.liveSession = {};

        // Update Status
        course.liveSession.isActive = isActive;
        
        // Optional: Set start time if going live
        if (isActive) {
            course.liveSession.startTime = new Date();
        }

        await course.save();
        res.json(course.liveSession);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// 2. 🟢 GET SINGLE COURSE (Course Detail)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name');
    if (!course) return res.status(404).json({ msg: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 3. 🛡️ CREATE COURSE (Instructor Only)
// ==========================================
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access Denied: Instructors Only' });
    }

    const { title, description, category, thumbnail } = req.body;

    const newCourse = new Course({
      title,
      description,
      category,
      thumbnail,
      instructor: req.user.id,
      sections: []
    });

    const course = await newCourse.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { 'instructorStats.totalCourses': 1 } });

    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 4. ➕ ADD SECTION (Video / Quiz / Code)
// ==========================================
router.post('/:id/sections', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized' });
    }

    const newSection = req.body;
    course.sections.push(newSection);
    await course.save();

    res.json(course.sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 📅 UPDATE LIVE SETTINGS (Meeting Link/Date)
// ==========================================
router.put('/:id/live', auth, async (req, res) => {
  try {
    const { meetingLink, scheduledDate, isActive } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ msg: 'Course not found' });

    // Security: Only the instructor can update
    if (course.instructor.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized' });
    }

    // 🔥 Update the nested liveSession object properly
    course.liveSession = {
      meetingLink: meetingLink || course.liveSession?.meetingLink || "",
      scheduledDate: scheduledDate || course.liveSession?.scheduledDate || null,
      isActive: isActive !== undefined ? isActive : (course.liveSession?.isActive || false)
    };

    await course.save();
    console.log("✅ Live Config Updated for course:", course.title);
    res.json(course.liveSession);
  } catch (err) {
    console.error("❌ Schedule Update Error:", err);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 🎓 ENROLL IN A COURSE
// ==========================================
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.user.id);
    await course.save();

    res.json(course.enrolledStudents);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 💬 GET COURSE CHAT HISTORY
// ==========================================
router.get('/:id/chat', auth, async (req, res) => {
  try {
    const Chat = require('../models/Chat'); 
    
    const chats = await Chat.find({ courseId: req.params.id, type: 'group' })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
      
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 5. ✏️ UPDATE COURSE (Instructor Only)
// ==========================================
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, thumbnail } = req.body;
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (course.instructor.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to edit this course' });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (thumbnail) course.thumbnail = thumbnail;

    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// ⭐️ POST RATING
// ==========================================
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body; // Expecting 1-5
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ msg: 'Course not found' });

    // 1. Check if student is enrolled
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ msg: 'You must be enrolled to rate this course' });
    }

    // 2. Check if already rated (update it) or add new
    const existingRating = course.ratings.find(r => r.student.toString() === req.user.id);
    
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      course.ratings.push({ student: req.user.id, rating });
    }

    // 3. Recalculate Average Rating
    const total = course.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    course.averageRating = (total / course.ratings.length).toFixed(1);

    await course.save();
    res.json({ averageRating: course.averageRating, totalRatings: course.ratings.length });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 6. 🗑️ DELETE COURSE (Instructor Only)
// ==========================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (course.instructor.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to delete this course' });
    }

    await course.deleteOne(); 
    await User.findByIdAndUpdate(req.user.id, { $inc: { 'instructorStats.totalCourses': -1 } });

    res.json({ msg: 'Course removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 7. 🗑️ DELETE SECTION
// ==========================================
router.delete('/:id/sections/:sectionId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (course.instructor.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not Authorized' });
    }

    course.sections = course.sections.filter(
      (sec) => sec._id.toString() !== req.params.sectionId
    );

    await course.save();
    res.json(course.sections);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 8. ✏️ UPDATE SECTION (Edit Title/Content)
// ==========================================
router.put('/:id/sections/:sectionId', auth, async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (course.instructor.toString() !== req.user.id) {
          return res.status(401).json({ msg: 'Not Authorized' });
      }
  
      const index = course.sections.findIndex(
          (s) => s._id.toString() === req.params.sectionId
      );
  
      if (index === -1) return res.status(404).json({ msg: "Section not found" });
  
      course.sections[index] = { ...course.sections[index]._doc, ...req.body };
  
      await course.save();
      res.json(course.sections);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

// ==========================================
// 9. 💻 EXECUTE LESSON CODE (Student)
// ==========================================
router.post('/:courseId/sections/:sectionId/execute', auth, async (req, res) => {
    try {
        const { code, language, mode } = req.body;
        const course = await Course.findById(req.params.courseId);
        
        if (!course) return res.status(404).json({ error: "Course not found" });

        const section = course.sections.id(req.params.sectionId);
        if (!section || section.type !== 'code') {
            return res.status(400).json({ error: "Invalid coding section" });
        }

        let testCasesToRun = section.codeChallenge.testCases || [];
        
        // If mode is 'run', only use visible test cases
        if (mode === 'run') {
            testCasesToRun = testCasesToRun.filter(tc => !tc.hidden);
        }

        if (testCasesToRun.length === 0) {
            return res.status(400).json({ error: "No test cases configured for this lesson." });
        }

        // Send to Judge0 using the exact same service as Battles
        const executionResult = await evaluateSubmission({
            code,
            language,
            testCases: testCasesToRun,
            mode: mode || 'submit'
        });

        res.json(executionResult);
    } catch (err) {
        console.error("Lesson Execution Error:", err);
        res.status(500).json({ error: "Execution Error" });
    }
});

module.exports = router;