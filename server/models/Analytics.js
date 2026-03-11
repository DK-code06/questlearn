const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    role: { 
        type: String, 
        enum: ['student', 'instructor', 'admin'] // Added admin just in case
    },
    action: { 
        type: String,
        required: true // e.g., 'completed_section', 'login', 'course_view'
    }, 
    startTime: { 
        type: Date, 
        default: Date.now 
    },
    // We keep loginTime as an alias or extra field to prevent crashes 
    // if your routes still use that name
    loginTime: { 
        type: Date, 
        default: Date.now 
    },
    endTime: { 
        type: Date 
    },
    duration: { 
        type: Number, 
        default: 0 // Usually represents XP or minutes spent
    }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);