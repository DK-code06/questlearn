import { useState, useEffect, useRef, useContext } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

// 🟢 Ensure port 5000 matches your backend
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
interface Props {
  courseId: string;
  instructorId: string; 
}

const ClassroomChat = ({ courseId, instructorId }: Props) => {
  const { user } = useContext(AuthContext) as any;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Join the Course Room (MATCHES BACKEND: 'join_room')
    socket.emit('join_room', courseId);

    // 2. Load History from Database
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/chat`);
        
        // 🟢 NORMALIZE DATA: Database uses 'sender._id', Socket uses 'userId'
        // We convert everything to a standard format for the UI
        const formattedHistory = res.data.map((msg: any) => ({
            ...msg,
            userId: msg.sender?._id || msg.sender, 
            userName: msg.senderName || msg.sender?.name || "User",
            role: msg.role
        }));
        
        setMessages(formattedHistory);
      } catch (err) {
        console.error("Failed to load chat");
      }
    };
    fetchHistory();

    // 3. Listen for Live Messages (MATCHES BACKEND: 'receive_message')
    const handleReceiveMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receive_message', handleReceiveMessage);

    // Cleanup listener to prevent duplicates
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [courseId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // 🟢 PAYLOAD MUST MATCH BACKEND EXPECTATIONS
    const payload = {
      courseId,
      userId: user._id,     // Backend expects 'userId'
      userName: user.name,  // Backend expects 'userName'
      role: user._id === instructorId ? 'instructor' : 'student',
      message: newMessage,
      createdAt: new Date().toISOString()
    };

    // Send to Server (MATCHES BACKEND: 'send_message')
    socket.emit('send_message', payload);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 shadow-sm z-10">
        <h3 className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
            Classroom Feed
        </h3>
        <p className="text-xs text-gray-500">Ask for help or discuss the lesson.</p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
            <div className="text-center text-gray-600 text-sm mt-10">
                No messages yet. Be the first to say hello!
            </div>
        )}

        {messages.map((msg, idx) => {
            // Handle both Socket data (userId) and DB data (sender._id)
            const msgSenderId = msg.userId || msg.sender?._id || msg.sender;
            const isMe = msgSenderId === user._id;
            const isInstructor = msg.role === 'instructor';

            return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold ${isInstructor ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {isMe ? "You" : msg.userName || msg.sender?.name || "User"}
                        </span>
                        {isInstructor && <ShieldCheck size={12} className="text-yellow-500"/>}
                    </div>
                    
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                        isMe 
                        ? 'bg-neon-blue text-black rounded-tr-none' 
                        : isInstructor 
                            ? 'bg-yellow-900/40 border border-yellow-600 text-yellow-100 rounded-tl-none'
                            : 'bg-gray-800 text-gray-200 rounded-tl-none'
                    }`}>
                        {msg.message}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-1">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                </div>
            );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black border-t border-gray-800">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-gray-900 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-neon-blue border border-gray-800 transition-colors"
            />
            <button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-neon-blue hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-500 text-black p-3 rounded-xl transition-all active:scale-95"
            >
                <Send size={20} />
            </button>
        </div>
      </div>

    </div>
  );
};

export default ClassroomChat;