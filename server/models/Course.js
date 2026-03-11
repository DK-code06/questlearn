const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  category: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ⭐ RATING SYSTEM
  ratings: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  averageRating: { type: Number, default: 0 },

  // 👥 ENROLLMENT
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalEnrolled: { type: Number, default: 0 }, // Useful for quick sorting on Dashboard

  // 📹 LIVE CLASSROOM
  liveSession: {
    isActive: { type: Boolean, default: false },
    startTime: { type: Date },
    meetingLink: { type: String },
    scheduledDate: { type: Date, default: null } 
  },

  // 📚 CONTENT SECTIONS
  sections: [
    {
      title: { type: String, required: true },
      type: { type: String, enum: ['video', 'mcq', 'code', 'text'], default: 'video' },
      
      // Content fields
      videoUrl: { type: String },
      content: { type: String }, 
      
      // Programming challenges
      codeChallenge: {
        problemStatement: { type: String },
        starterCode: { type: String },
        testCases: [{ input: String, output: String }]
      },

      // Quiz / MCQ
      quiz: [{
        question: { type: String },
        options: [String],
        correctIndex: { type: Number }
      }],

      // Rewards
      points: { type: Number, default: 10 },
      medalType: { type: String, enum: ['none', 'silver', 'gold'], default: 'silver' } 
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);