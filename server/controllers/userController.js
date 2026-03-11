const User = require('../models/User');

exports.updateProgress = async (req, res) => {
  try {
    const { courseId, sectionId, xpEarned } = req.body;
    
    // 1. Get the user
    const user = await User.findById(req.user.id);
    
    // 2. Check if this section is ALREADY in their progress
    // We compare Strings to be safe (MongoDB ObjectIds can be tricky)
    const alreadyCompleted = user.progress.some(p => 
        (p.sectionId && p.sectionId.toString() === sectionId) || 
        (p.toString() === sectionId) // Handle cases where it's just a string array
    );

    if (!alreadyCompleted) {
        // 3. Add to progress
        user.progress.push({ 
            sectionId: sectionId, 
            completedAt: new Date(), 
            courseId: courseId 
        });

        // 4. Add XP
        user.xp = (user.xp || 0) + (xpEarned || 10);
        
        await user.save();
    }

    res.json(user.progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};