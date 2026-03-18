import { useState, useEffect, useContext } from 'react';
import { Search, UserPlus, Users, MessageSquare, Terminal, ShieldCheck, Check, X, Flame, Award, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import ChatWindow from '../../components/ChatWindow';

const SocialHub = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext) as any;
  const [chatFriend, setChatFriend] = useState<any>(null);

  const [selectedAllyStats, setSelectedAllyStats] = useState<any>(null);
  const [, setIntelLoading] = useState(false);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/friends');
      setFriends(res.data.friends);
      setRequests(res.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewAllyDossier = async (allyId: string) => {
    setIntelLoading(true);
    try {
      const res = await api.get(`/users/ally-intel/${allyId}`);
      setSelectedAllyStats(res.data);
    } catch (err) {
      alert("Hero intel is currently encrypted or unavailable.");
    } finally {
      setIntelLoading(false);
    }
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!searchTerm) return;
    try {
      const res = await api.get(`/friends/search?q=${searchTerm}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendRequest = async (id: string) => {
    try {
      await api.post(`/friends/request/${id}`);
      alert("Request Sent!");
      setSearchResults(searchResults.filter(u => u._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed");
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      await api.put(`/friends/accept/${id}`);
      loadSocialData();
    } catch (err) {
      alert("Failed to accept");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-black overflow-hidden border-t border-gray-800 selection:bg-neon-blue selection:text-black font-sans">
      
      {/* 1. LEFT SIDEBAR: ALLIES LIST & SEARCH */}
      <div className={`w-full md:w-[400px] border-r border-gray-800 flex-col bg-[#050505] ${chatFriend ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 bg-[#0a0a0a] border-b border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Social Hub</h1>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('friends')} className={`p-2 rounded-xl transition-all ${activeTab === 'friends' ? 'bg-neon-blue text-black' : 'bg-gray-900 text-gray-500'}`}><Users size={20} /></button>
                <button onClick={() => setActiveTab('search')} className={`p-2 rounded-xl transition-all ${activeTab === 'search' ? 'bg-neon-blue text-black' : 'bg-gray-900 text-gray-500'}`}><UserPlus size={20} /></button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input className="w-full bg-black border border-gray-800 p-3 pl-10 rounded-xl text-xs text-white outline-none focus:border-neon-blue transition-all" placeholder={activeTab === 'search' ? "Search Global Database..." : "Filter Connections..."} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); if(activeTab === 'search') handleSearch(e);}} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-10"><Terminal className="animate-pulse text-neon-blue" /></div>
          ) : activeTab === 'friends' ? (
            <div className="divide-y divide-gray-900/50">
              {requests.length > 0 && (
                <div className="p-4 bg-neon-blue/5 border-b border-gray-800">
                  <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest mb-3 px-2">Incoming Requests</p>
                  {requests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-2">
                       <span className="text-sm font-bold text-white">{req.name}</span>
                       <div className="flex gap-1">
                         <button onClick={() => acceptRequest(req._id)} className="bg-green-600 p-1.5 rounded-lg text-white hover:bg-green-500"><Check size={14}/></button>
                         <button className="bg-red-900/30 p-1.5 rounded-lg text-red-500 hover:bg-red-600 hover:text-white"><X size={14}/></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              {friends.length === 0 ? (
                <div className="p-10 text-center"><Terminal className="mx-auto text-gray-800 mb-4" size={40} /><p className="text-gray-600 text-xs font-bold uppercase tracking-widest">No Active Alliances</p></div>
              ) : (
                friends.map((friend) => (
                  <div key={friend._id} onClick={() => setChatFriend(friend)} className={`flex items-center gap-4 p-5 cursor-pointer transition-all hover:bg-white/5 group border-l-4 ${chatFriend?._id === friend._id ? 'bg-neon-blue/10 border-neon-blue' : 'border-transparent'}`}>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl border-2 border-gray-800 overflow-hidden bg-gray-900 group-hover:border-neon-blue/50 transition-colors">
                        {friend.profilePic ? (<img src={friend.profilePic} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-600 font-black text-xl">{friend.name.charAt(0)}</div>)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#050505] ${friend.isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-700'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-white uppercase text-sm tracking-tight">{friend.name}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); viewAllyDossier(friend._id); }}
                          className="text-[9px] font-black text-neon-blue hover:text-white uppercase tracking-widest border border-neon-blue/20 px-2 py-1 rounded bg-neon-blue/5 transition-all"
                        >
                          Dossier
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium truncate mt-1">
                        {friend.isOnline ? "Active Signal Detected" : "Terminal Offline"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
               {searchResults.map((u) => (
                 <div key={u._id} className="bg-gray-900/40 border border-gray-800 p-4 rounded-2xl flex justify-between items-center group hover:border-neon-blue/40 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-gray-700 overflow-hidden bg-black flex items-center justify-center font-black text-gray-400 uppercase">
                           {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                        </div>
                        <p className="font-bold text-white text-sm">{u.name}</p>
                    </div>
                    <button onClick={() => sendRequest(u._id)} className="bg-neon-blue text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Request</button>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT SIDE: THE CHAT VIEWPORT */}
      <div className={`${chatFriend ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#020202] relative`}>
        {chatFriend ? (
          <div className="h-full w-full flex flex-col animate-in fade-in duration-500">
            <div className="flex-1 overflow-hidden relative">
               <ChatWindow 
                  myId={user._id} 
                  myName={user.name} 
                  friendId={chatFriend._id} 
                  friendName={chatFriend.name} 
                  friendPic={chatFriend.profilePic} 
                  onClose={() => setChatFriend(null)} 
               />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-20">
            <MessageSquare size={120} className="text-gray-500 mb-6" strokeWidth={1} />
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Encrypted Messaging</h2>
            <p className="max-w-md mt-4 text-gray-400 font-bold uppercase text-xs tracking-[0.3em] leading-relaxed">Select an authorized ally to initiate a secure point-to-point uplink.</p>
          </div>
        )}
      </div>

      {/* 3. TACTICAL DOSSIER MODAL */}
      {selectedAllyStats && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-[#0f172a] border-2 border-neon-blue/30 rounded-[3rem] w-full max-w-lg p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.2)]">
            <button onClick={() => setSelectedAllyStats(null)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-gray-800 overflow-hidden mb-6 shadow-2xl">
                {selectedAllyStats.profilePic ? (
                  <img src={selectedAllyStats.profilePic} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center text-4xl font-black text-gray-700">{selectedAllyStats.name.charAt(0)}</div>
                )}
              </div>
              
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">{selectedAllyStats.name}</h2>
              <p className="text-neon-blue text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                Ally Dossier: Level {Math.floor(selectedAllyStats.gamification.totalPoints / 100) + 1} Elite
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-gray-800">
                  <Flame className="text-orange-500 mx-auto mb-2" size={24} fill="currentColor" />
                  <p className="text-2xl font-black text-white">{selectedAllyStats.gamification.streak}</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Active Streak</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-gray-800">
                  <Award className="text-green-500 mx-auto mb-2" size={24} />
                  <p className="text-2xl font-black text-white">{selectedAllyStats.completedCount}</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Quests Cleared</p>
                </div>
              </div>

              <div className="w-full bg-black/60 border border-gray-800 rounded-2xl p-6 text-left">
                <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Completed Operations</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {selectedAllyStats.completedQuests.length === 0 ? (
                    <p className="text-gray-700 text-xs italic">No missions secured yet.</p>
                  ) : (
                    selectedAllyStats.completedQuests.map((q: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <CheckCircle size={14} className="text-green-500 shrink-0" /> {q.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialHub;