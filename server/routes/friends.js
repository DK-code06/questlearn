const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat'); 
const auth = require('../middleware/auth');

// ==========================================
// 🔍 SEARCH USERS
// ==========================================
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      name: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
      role: 'student'
    }).select('name email profilePic isOnline'); // 🟢 FIX 1: Changed 'avatar' to 'profilePic'

    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 📩 SEND FRIEND REQUEST
// ==========================================
router.post('/request/:id', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const target = await User.findById(targetId);
    const me = await User.findById(req.user.id);

    if (!target) return res.status(404).json({ msg: 'User not found' });
    if (me.friends.includes(targetId)) return res.status(400).json({ msg: 'Already friends' });
    if (target.friendRequests.includes(req.user.id)) return res.status(400).json({ msg: 'Request already sent' });

    target.friendRequests.push(req.user.id);
    await target.save();

    res.json({ msg: 'Request sent!' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// ✅ ACCEPT FRIEND REQUEST
// ==========================================
router.put('/accept/:id', auth, async (req, res) => {
  try {
    const senderId = req.params.id;
    const me = await User.findById(req.user.id);
    const sender = await User.findById(senderId);

    if (!me.friendRequests.includes(senderId)) {
      return res.status(400).json({ msg: 'No request from this user' });
    }

    me.friends.push(senderId);
    sender.friends.push(req.user.id);
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== senderId);

    await me.save();
    await sender.save();

    res.json(me.friends);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 📜 GET MY FRIENDS & REQUESTS
// ==========================================
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'name email profilePic isOnline') // 🟢 FIX 2: Added profilePic
      .populate('friendRequests', 'name email profilePic');  // 🟢 Added profilePic here too just in case
    
    res.json({
      friends: user.friends,
      requests: user.friendRequests
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 💬 GET PRIVATE CHAT HISTORY (Fixes erasing on refresh)
// ==========================================
router.get('/chat/:friendId', auth, async (req, res) => {
  try {
    const messages = await Chat.find({
      type: 'private',
      $or: [
        { sender: req.user.id, receiverId: req.params.friendId },
        { sender: req.params.friendId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Chat History Error:", err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;