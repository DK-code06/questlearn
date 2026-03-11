const mongoose = require("mongoose");

const BattleSchema = new mongoose.Schema({
    roomId: { type: String, unique: true, required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
    status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
    battleType: { type: String, enum: ['1vs1', '2vs2', '4vs4'], default: '1vs1' },
    
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, default: 'joined' },
        bestScore: { type: Number, default: 0 },
        isWinner: { type: Boolean, default: false }
    }],
    
    startTime: Date,
    endTime: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Battle", BattleSchema);