const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const Chat = require('./models/Chat'); 
const User = require('./models/User');
const Battle = require('./models/Battle'); 
const Problem = require('./models/Problem');

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
    methods: ["GET", "POST"]
  }
});

connectDB();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const activeUsers = new Map(); 

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users')); 
app.use('/api/friends', require('./routes/friends'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/instructor', require('./routes/instructor'));
app.use('/api/battles', require('./routes/battles'));

io.on('connection', (socket) => {
  console.log(`📡 Tactical Uplink Established: ${socket.id}`);

  socket.on('join_user_room', async (userId) => {
    socket.join(userId.toString());
    socket.userId = userId; 
    activeUsers.set(userId.toString(), socket.id);
    
    try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('user_status_change', { userId, isOnline: true });
    } catch (e) { console.error("Status Update Error:", e); }
    
    console.log(`👤 Hero ${userId} is now ACTIVE in the realm`);
  });

  socket.on('typing_start', ({ receiverId, senderId }) => {
    io.to(receiverId.toString()).emit('display_typing', { senderId });
  });

  socket.on('typing_stop', ({ receiverId, senderId }) => {
    io.to(receiverId.toString()).emit('hide_typing', { senderId });
  });

  socket.on('send_private_message', async (data) => {
    try {
      const newPrivateChat = new Chat({
        sender: data.senderId,
        senderName: data.senderName,
        receiverId: data.receiverId,
        message: data.message,
        type: 'private'
      });
      await newPrivateChat.save();

      io.to(data.receiverId.toString()).to(data.senderId.toString()).emit('receive_private_message', newPrivateChat);
    } catch (err) { 
      console.error("Private Encryption Error:", err); 
    }
  });

  socket.on('join_room', (courseId) => {
    socket.join(courseId.toString());
    console.log(`📂 Sector Access: Course ${courseId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const newChat = new Chat({
        courseId: data.courseId,
        sender: data.userId,
        senderName: data.userName,
        role: data.role,
        message: data.message,
        type: 'group'
      });
      await newChat.save();
      
      io.to(data.courseId.toString()).emit('receive_message', newChat);
    } catch (err) { 
      console.error("Sector Chat Error:", err); 
    }
  });

  socket.on('join_battle', (roomId) => {
    socket.join(`battle_${roomId}`);
    socket.currentRoom = roomId; 
    console.log(`⚔️ Combatant joined battle room: ${roomId}`);
    io.to(`battle_${roomId}`).emit('player_joined');
  });

  socket.on('start_battle', async (roomId) => {
    try {
      const battle = await Battle.findOne({ roomId });
      if (!battle) return;

      const durationMinutes = battle.duration || 30; 
      const durationMs = durationMinutes * 60 * 1000;
      
      battle.status = 'active';
      battle.startTime = new Date();
      await battle.save();

      io.to(`battle_${roomId}`).emit('battle_started');

      setTimeout(async () => {
        try {
          const currentBattle = await Battle.findOne({ roomId });
          if (currentBattle && currentBattle.status === 'active') {
            currentBattle.status = 'finished';
            currentBattle.endTime = new Date();
            await currentBattle.save();

            io.to(`battle_${roomId}`).emit('battle_over', { 
              winnerName: "Time Expired", 
              isDraw: true 
            });
          }
        } catch (err) {
          console.error("Timer End Battle Error:", err);
        }
      }, durationMs);

    } catch (err) {
      console.error("Start Battle Error:", err);
    }
  });

  socket.on('battle_won', ({ roomId, winnerName }) => {
    io.to(`battle_${roomId}`).emit('battle_over', { winnerName });
  });

  // ✅ HELPER: Automatically award victory if the opponent abandons
  const handlePlayerLeave = async (roomId, userId) => {
    try {
        const battle = await Battle.findOne({ roomId }).populate('participants.user');
        if (!battle || battle.status === 'finished') return;

        // Find the name of the person leaving
        const leaver = await User.findById(userId);
        const leaverName = leaver ? leaver.name : "An opponent";

        // Mark them as abandoned
        const participant = battle.participants.find(p => p.user._id.toString() === userId.toString());
        if (participant) {
            participant.status = 'abandoned';
            participant.isWinner = false;
        }

        const activeParticipants = battle.participants.filter(p => p.status !== 'abandoned');
        
        // If 1 player is left in an active game, they automatically win
        if (activeParticipants.length === 1 && battle.status === 'active') {
            battle.status = 'finished';
            battle.endTime = new Date();
            
            const winner = activeParticipants[0];
            winner.isWinner = true;

            const winnerUser = await User.findById(winner.user._id);
            const problem = await Problem.findById(battle.problem);
            
            if (winnerUser && problem) {
                winnerUser.gamification.totalPoints += (problem.xpReward || 20);
                if (!winnerUser.gamification.medals) winnerUser.gamification.medals = { gold: 0, silver: 0 };
                winnerUser.gamification.medals.gold += (problem.medalReward || 1);
                await winnerUser.save();
            }

            // Emit victory with a reason string so the winner knows why the match ended
            io.to(`battle_${roomId}`).emit('battle_over', { 
                winnerName: winner.user.name,
                reason: `${leaverName} abandoned the battle. You win by default!` 
            });
        } else if (activeParticipants.length === 0) {
            battle.status = 'finished';
        }
        
        await battle.save();
    } catch (err) { console.error("Leave Battle Error:", err); }
  };

  socket.on('abandon_battle', async ({ roomId, userId }) => {
      await handlePlayerLeave(roomId, userId);
  });

  socket.on('disconnect', async () => { 
    if (socket.userId) {
        activeUsers.delete(socket.userId.toString());
        try {
            await User.findByIdAndUpdate(socket.userId, { isOnline: false });
            io.emit('user_status_change', { userId: socket.userId, isOnline: false });
            
            // If they close the tab during a battle, trigger the forfeit logic
            if (socket.currentRoom) {
                await handlePlayerLeave(socket.currentRoom, socket.userId);
            }
        } catch (e) { console.error("Offline Sync Error:", e); }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 QUEST SERVER DEPLOYED ON PORT ${PORT}`);
});