import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Loader2} from 'lucide-react';
import io from 'socket.io-client';
import api from '../utils/api';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
interface Props {
  myId: string;
  myName: string;
  friendId: string;
  friendName: string;
  friendPic?: string; // Support for profile pictures
  onClose: () => void;
}

const ChatWindow = ({ myId, myName, friendId, friendName, friendPic, onClose }: Props) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Load Chat History
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await api.get(`/friends/chat/${friendId}`);
        setMessageList(res.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();

    // 2. Join Signal Room
    socket.emit('join_user_room', myId);

    // 3. Listen for Messages
    const handleReceiveMessage = (data: any) => {
      if (data.sender === friendId || data.senderId === friendId || data.sender === myId) {
        setMessageList((list) => [...list, data]);
      }
    };

    // 4. Listen for Typing Events
    const handleTypingStart = ({ senderId }: { senderId: string }) => {
      if (senderId === friendId) setIsFriendTyping(true);
    };

    const handleTypingStop = ({ senderId }: { senderId: string }) => {
      if (senderId === friendId) setIsFriendTyping(false);
    };

    socket.on('receive_private_message', handleReceiveMessage);
    socket.on('display_typing', handleTypingStart);
    socket.on('hide_typing', handleTypingStop);

    return () => {
      socket.off('receive_private_message', handleReceiveMessage);
      socket.off('display_typing', handleTypingStart);
      socket.off('hide_typing', handleTypingStop);
    };
  }, [myId, friendId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, isFriendTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);

    // Emit typing_start to server
    socket.emit('typing_start', { receiverId: friendId, senderId: myId });

    // Clear previous timeout and set a new one to stop typing indicator after 2 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: friendId, senderId: myId });
    }, 2000);
  };

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        senderId: myId,
        senderName: myName,
        receiverId: friendId,
        message: currentMessage,
      };

      socket.emit('send_private_message', messageData);
      socket.emit('typing_stop', { receiverId: friendId, senderId: myId }); // Stop indicator immediately on send
      setCurrentMessage("");
    }
  };

  return (
    // Changed to h-full for split-pane view, or keep fixed if you want it floating
    <div className="flex flex-col h-full bg-[#020202] border-l border-gray-800 animate-in fade-in duration-300">
      
      {/* Header (WhatsApp Style) */}
      <div className="bg-[#0a0a0a] p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl border border-gray-700 overflow-hidden bg-gray-900">
              {friendPic ? (
                <img src={friendPic} className="w-full h-full object-cover" alt={friendName} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase">
                  {friendName.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-tight leading-none">
              {friendName}
            </h3>
            {isFriendTyping ? (
              <p className="text-[10px] text-neon-blue font-black uppercase tracking-widest animate-pulse mt-1">
                Decrypting...
              </p>
            ) : (
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                Secure Link Active
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={20}/>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/30 custom-scrollbar">
        {loadingHistory ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-neon-blue" /></div>
        ) : messageList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-center">
            <MessageSquare size={40} className="mb-2"/>
            <p className="text-xs uppercase tracking-widest">Establish transmission with {friendName}</p>
          </div>
        ) : (
          messageList.map((msg, index) => {
            const msgSenderId = msg.sender?._id || msg.sender || msg.senderId;
            const isMe = msgSenderId === myId;

            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm transition-all ${
                  isMe 
                  ? 'bg-neon-blue text-black rounded-tr-none font-bold shadow-[0_0_15px_rgba(0,243,255,0.1)]' 
                  : 'bg-gray-900 text-gray-200 rounded-tl-none border border-gray-800'
                }`}>
                  <p className="break-words leading-relaxed">{msg.message}</p>
                  <p className={`text-[8px] font-black uppercase mt-2 opacity-50 ${isMe ? 'text-black' : 'text-gray-500'}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form 
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="p-5 bg-[#0a0a0a] border-t border-gray-800 flex gap-3"
      >
        <input
          type="text"
          value={currentMessage}
          onChange={handleInputChange}
          placeholder="Enter Command..."
          className="flex-1 bg-black text-white text-sm rounded-xl px-5 py-4 outline-none border border-gray-800 focus:border-neon-blue transition-all"
        />
        <button 
          type="submit"
          disabled={!currentMessage.trim()}
          className="bg-neon-blue p-4 rounded-xl hover:bg-cyan-400 text-black transition-all disabled:opacity-20 shadow-lg shadow-cyan-900/20 active:scale-90"
        >
          <Send size={20} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;