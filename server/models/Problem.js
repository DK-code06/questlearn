const mongoose = require('mongoose');

const testcaseSchema = new mongoose.Schema({
    input: String,
    output: String,
    hidden: { type: Boolean, default: false }
});

const ProblemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // RPG Rewards assigned by Instructor
    xpReward: { type: Number, min: 10, max: 50, default: 20 },
    medalReward: { type: Number, min: 1, max: 5, default: 1 },

    examples: [{ input: String, output: String, explanation: String }],
    testcases: [testcaseSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Problem", ProblemSchema);