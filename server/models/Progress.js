const mongoose = require('mongoose');

// Define the sub-schema separately to ensure Mongoose treats it as an object
const CompletedSectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  score: { type: Number, default: 0 },
  totalPossible: { type: Number, default: 10 },
  completedAt: { type: Date, default: Date.now }
}, { _id: false }); // _id: false prevents Mongoose from adding a random ID to every sub-level

const ProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  completedSections: [CompletedSectionSchema], // Use the sub-schema here
  isCompleted: { type: Boolean, default: false },
  completionDate: { type: Date },
  lastAccess: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', ProgressSchema);