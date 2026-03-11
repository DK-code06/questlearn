const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Problem = require('../models/Problem');
const Battle = require('../models/Battle');
const User = require('../models/User');

// ✅ Wrapper imports REMOVED. We only need the execution service now.
const { evaluateSubmission } = require('../services/codeExecutionService');

// ==========================================
// 1. INSTRUCTOR: Create Problem
// ==========================================
router.post('/problem', auth, async (req, res) => {
    try {
        if (req.user.role !== 'instructor') return res.status(403).json({ msg: "Instructors only" });
        const problem = new Problem({ ...req.body, instructor: req.user.id });
        await problem.save();
        res.json(problem);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. STUDENT: Get all problems
// ==========================================
router.get('/problems', auth, async (req, res) => {
    try {
        const problems = await Problem.find().select('-testcases.hidden'); // Don't send hidden testcases to client
        res.json(problems);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. STUDENT: Create Battle Room
// ==========================================
router.post('/create-room', auth, async (req, res) => {
    try {
        const { problemId, battleType } = req.body;
        const roomId = `BTLX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const battle = new Battle({
            roomId,
            problem: problemId,
            battleType,
            participants: [{ user: req.user.id }]
        });
        await battle.save();
        
        res.json({ success: true, battle }); 
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 4. STUDENT: Join Battle Room
// ==========================================
router.post('/join-room/:roomId', auth, async (req, res) => {
    try {
        const battle = await Battle.findOne({ roomId: req.params.roomId }).populate('problem').populate('participants.user', 'name');
        if (!battle) return res.status(404).json({ error: "Room not found" });
        if (battle.status !== 'waiting') return res.status(400).json({ error: "Battle already started" });

        const isParticipant = battle.participants.some(p => p.user._id.toString() === req.user.id);
        if (!isParticipant) {
            battle.participants.push({ user: req.user.id });
            await battle.save();
        }
        res.json({ success: true, battle });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 5. STUDENT: Get Room Status (Polling)
// ==========================================
router.get('/:roomId/status', auth, async (req, res) => {
    try {
        const battle = await Battle.findOne({ roomId: req.params.roomId })
            .populate('problem')
            .populate('participants.user', 'name');

        if (!battle) return res.status(404).json({ error: 'Room not found' });

        res.json({ success: true, battle });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 6. STUDENT: Run Code (Against Visible Test Cases)
// ==========================================
router.post('/:roomId/run', auth, async (req, res) => {
    try {
        const { code, language } = req.body;
        const battle = await Battle.findOne({ roomId: req.params.roomId }).populate('problem');
        
        if (!battle) return res.status(404).json({ error: "Room not found" });

        // Get ONLY visible test cases
        const visibleTestCases = battle.problem.testcases.filter(tc => !tc.hidden);

        // ✅ Pass raw code directly to the evaluator
        const executionResult = await evaluateSubmission({
            code: code, 
            language,
            testCases: visibleTestCases,
            mode: 'run'
        });

        res.json(executionResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Execution Error" });
    }
});

// ==========================================
// 7. STUDENT: Submit Code (Against ALL Test Cases)
// ==========================================
router.post('/:roomId/submit', auth, async (req, res) => {
    try {
        const { code, language } = req.body;
        const battle = await Battle.findOne({ roomId: req.params.roomId }).populate('problem');
        
        if (!battle) return res.status(404).json({ error: "Room not found" });
        if (battle.status !== 'active') return res.status(400).json({ error: "Battle is not active right now" });

        // ⏱️ TIMER ENFORCEMENT LOGIC
        if (battle.startTime) {
            const elapsedSeconds = Math.floor((Date.now() - new Date(battle.startTime).getTime()) / 1000);
            const durationSeconds = (battle.duration || 30) * 60; // Assumes 30 mins if not set in DB
            
            if (elapsedSeconds >= durationSeconds) {
                battle.status = 'finished';
                battle.endTime = new Date();
                await battle.save();
                return res.status(400).json({ error: "Time expired. The battle has concluded." });
            }
        }

        // ✅ Pass raw code directly to the evaluator (No Wrappers)
        const executionResult = await evaluateSubmission({
            code: code,
            language,
            testCases: battle.problem.testcases,
            mode: 'submit'
        });

        // Update Participant Score
        const participant = battle.participants.find(p => p.user.toString() === req.user.id);
        if (participant) {
            participant.bestScore = Math.max(participant.bestScore || 0, executionResult.passedCases);
        }

        // Check Win Condition
        if (executionResult.isWinner && battle.status !== 'finished') {
            battle.status = 'finished';
            battle.endTime = new Date();
            participant.isWinner = true;
            
            // Reward the Winner with XP and Medals
            const user = await User.findById(req.user.id);
            user.gamification.totalPoints += (battle.problem.xpReward || 20);
            
            if (!user.gamification.medals) user.gamification.medals = { gold: 0, silver: 0 };
            user.gamification.medals.gold += (battle.problem.medalReward || 1);
            
            await user.save();
        }

        await battle.save();
        
        // Use optional chaining for results to prevent crashes if execution fails entirely
        const failedCaseNumber = executionResult.results?.find(r => !r.passed)?.caseNumber || null;

        res.json({ 
            mode: "submit",
            verdict: executionResult.isWinner ? "Accepted" : "Wrong Answer",
            passedCases: executionResult.passedCases, 
            totalCases: executionResult.totalCases, 
            isWinner: executionResult.isWinner,
            result: executionResult.isWinner ? "win" : "pending",
            xpEarned: executionResult.isWinner ? (battle.problem.xpReward || 20) : 0,
            failedCaseNumber: failedCaseNumber
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Compilation Error" });
    }
});

// ==========================================
// 8. LOG PASTE ATTEMPT (Anti-Cheat)
// ==========================================
router.post('/:roomId/paste-attempt', auth, async (req, res) => {
    try {
        console.log(`[ANTI-CHEAT] User ${req.user.id} attempted to ${req.body.type} in room ${req.params.roomId}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to log attempt' });
    }
});
// ==========================================
// 9. INSTRUCTOR: Delete Problem
// ==========================================
router.delete('/problem/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'instructor') return res.status(403).json({ msg: "Instructors only" });
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) return res.status(404).json({ msg: "Problem not found" });
        res.json({ msg: "Problem deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 10. INSTRUCTOR: Edit Problem
// ==========================================
router.put('/problem/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'instructor') return res.status(403).json({ msg: "Instructors only" });
        const updatedProblem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProblem);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
module.exports = router;