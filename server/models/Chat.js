const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional for private
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 🔥 ADD THIS
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  role: { type: String, enum: ['instructor', 'student'], default: 'student' },
  message: { type: String, required: true },
  type: { type: String, enum: ['group', 'private'], default: 'group' }, // 🔥 ADD THIS
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', ChatSchema);