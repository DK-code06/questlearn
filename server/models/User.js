const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },

  // 👤 HERO DOSSIER FIELDS (Added for Profile Sync)
  dob: { type: String, default: "" },
  domain: { type: String, default: "" },
  currentStudying: { type: String, default: "" },
  profilePic: { type: String, default: "" }, // Base64 or URL

  location: {
    city: { type: String, default: "Unknown" },
    country: { type: String, default: "India" }
  },
  
  // 🟢 SOCIAL FEATURES
  isOnline: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // 🏆 GAMIFICATION SYSTEM
  gamification: {
    totalPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 }, 
    
    // 🔥 Streak Management
    streak: { type: Number, default: 1 }, 
    lastActive: { type: Date, default: Date.now },
    
    // 🏅 Medals
    medals: { 
      gold: { type: Number, default: 0 },   
      silver: { type: Number, default: 0 }, 
    },
    
    // 🛡️ Inventory
    inventory: {
        streakFreeze: { type: Number, default: 0 },
        xpBoosters: { type: Number, default: 0 }
    }
  },

  // 🎓 INSTRUCTOR STATS
  instructorStats: {
    totalCourses: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 } 
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);