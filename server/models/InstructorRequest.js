const mongoose = require('mongoose');

const InstructorRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    institution: { type: String, required: true },
    city: { type: String, required: true },
    domain: { type: String, required: true },
    experience: { type: Number, required: true },
    credentialFile: { type: String }, // We will store this as a Base64 string
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InstructorRequest', InstructorRequestSchema);