import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlayCircle, Users, Radio, 
  Star, Zap, AlertCircle, Loader2, Flame, Shield, ShoppingCart, Trophy, Sparkles, Sword, Terminal
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import ReportIssueModal from '../../components/ReportIssueModal';
import StreakAlert from './StreakAlert';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  // 🟢 FIXED: Streak Popup Logic - Only shows once per session
  useEffect(() => {
    if (user?.gamification?.streak >= 1) {
      const hasSeenStreak = sessionStorage.getItem('streakShown');
      
      if (!hasSeenStreak) {
        // Trigger popup with a slight delay for better UX
        const timer = setTimeout(() => {
          setShowStreakPopup(true);
          sessionStorage.setItem('streakShown', 'true');
        }, 1200); 
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to load missions");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const liveCourses = courses.filter(c =>
    c.enrolledStudents?.includes(user?._id) && c.liveSession?.isActive
  );

  const displayStreak = user?.gamification?.streak > 0 ? user.gamification.streak : 1;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8 selection:bg-neon-blue selection:text-black">
      
      {/* HERO CINEMATIC BANNER */}
      <div className="relative w-full mb-12 rounded-[3.5rem] overflow-hidden bg-[#020617] border border-gray-800/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-neon-blue/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full animate-pulse" />
        
        <div className="relative z-10 px-8 py-12 md:px-20 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8 backdrop-blur-md">
              <Terminal size={14} className="text-neon-blue" />
              <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">System Status: Online // Sector 7</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] mb-8">
              LEVEL UP <br />
              <span className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">YOUR REALITY</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed font-medium max-w-xl mb-10">
              QuestLearn is more than a platform—it's your digital proving ground. Conquer complex modules, earn legendary XP, and rise through the global ranks.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">{courses.length}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Active Operations</span>
               </div>
               <div className="w-px h-10 bg-gray-800 hidden sm:block" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">24/7</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Uplink</span>
               </div>
               <div className="w-px h-10 bg-gray-800 hidden sm:block" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">EARTH</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Global Server</span>
               </div>
            </div>
          </div>

          <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative">
             <div className="absolute -top-4 -right-4 bg-neon-blue text-black p-3 rounded-2xl rotate-12 shadow-lg">
                <Sparkles size={20} />
             </div>
             
             <div className="space-y-8">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                      <Flame size={28} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Streak</p>
                      <h4 className="text-3xl font-black italic">{displayStreak} Days</h4>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-neon-blue/10 rounded-2xl flex items-center justify-center text-neon-blue border border-neon-blue/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                      <Zap size={28} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Energy (XP)</p>
                      <h4 className="text-3xl font-black italic">{user?.gamification?.totalPoints || 0}</h4>
                   </div>
                </div>

                <button 
                  onClick={() => navigate('/student/shop')}
                  className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] uppercase tracking-widest text-[10px] hover:bg-neon-blue hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={18} /> Visit Armory
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Tactical Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-16 gap-6">
        <div className="relative flex-1 max-w-lg group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" size={20} />
          <input
              type="text"
              placeholder="Filter Quest Archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-800 p-5 pl-14 rounded-[1.5rem] text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700 font-bold text-xs uppercase tracking-widest"
          />
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={() => navigate('/student/rankings')}
                className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-yellow-500 text-white px-8 py-4 rounded-[1.5rem] font-black transition-all group text-[10px] uppercase tracking-widest shadow-lg"
            >
                <Trophy size={18} className="text-yellow-500 group-hover:scale-110 transition-transform" /> Hall of Heroes
            </button>
            <button
                onClick={() => navigate('/student/social')}
                className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-neon-blue text-white px-8 py-4 rounded-[1.5rem] font-black transition-all group text-[10px] uppercase tracking-widest shadow-lg"
            >
                <Users size={18} className="text-neon-blue group-hover:scale-110 transition-transform" /> Social Hub
            </button>
            <button 
              onClick={() => setIsIssueOpen(true)} 
              className="p-4 bg-gray-900/50 border border-gray-800 rounded-2xl text-gray-600 hover:text-red-500 transition-colors"
            >
              <AlertCircle size={22}/>
            </button>
        </div>
      </div>

      {/* LIVE SIGNAL ALERT */}
      {liveCourses.length > 0 && (
        <div className="mb-16">
            {liveCourses.map(course => (
                <div key={course._id} className="bg-red-600/5 border-2 border-red-600/30 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-600/5 animate-pulse" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="bg-red-600 p-5 rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.4)]"><Radio size={36} className="text-white" /></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">LIVE COMBAT: {course.title}</h2>
                            <p className="text-red-500 text-xs font-black uppercase tracking-[0.4em] mt-1">Instructor presence confirmed. Synchronize now.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.open(course.liveSession.meetingLink, '_blank')}
                        className="mt-8 md:mt-0 bg-white text-black px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.2em] text-xs relative z-10"
                    >
                        Join Battle
                    </button>
                </div>
            ))}
        </div>
      )}

      {/* Section Divider */}
      <div className="flex items-center gap-6 mb-12">
        <h2 className="text-xs font-black text-white uppercase tracking-[0.6em] italic whitespace-nowrap">Open Mission Objectives</h2>
        <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent" />
      </div>

      {/* Quest Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-neon-blue mb-6" size={50} />
            <p className="text-gray-600 font-black uppercase text-xs tracking-[0.4em] animate-pulse">Decrypting Mission Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredCourses.map((course) => {
                const isEnrolled = course.enrolledStudents?.includes(user?._id);
                const isLive = course.liveSession?.isActive;

                return (
                    <div key={course._id} className={`bg-gray-900/20 rounded-[3.5rem] overflow-hidden border-2 transition-all duration-500 group flex flex-col ${isLive && isEnrolled ? 'border-red-600 bg-red-600/5' : 'border-gray-800/50 hover:border-neon-blue hover:bg-gray-900/40 shadow-xl hover:shadow-neon-blue/10'}`}>
                        <div className="h-64 bg-black relative overflow-hidden">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-900 font-black text-[10rem] italic opacity-20">{course.title.charAt(0)}</div>
                            )}
                            <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black text-neon-blue border border-neon-blue/30 uppercase tracking-widest">{course.category}</div>
                            {isEnrolled && <div className="absolute top-8 right-8 bg-green-500 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-xl">Authorized</div>}
                        </div>

                        <div className="p-10 flex flex-col flex-1">
                            <h3 className="font-black text-2xl text-white mb-4 group-hover:text-neon-blue transition-colors line-clamp-1 uppercase tracking-tight italic">{course.title}</h3>
                            
                            <div className="flex items-center gap-6 mb-10">
                                <div className="flex items-center gap-2 text-yellow-500 font-black text-xs">
                                    <Star size={16} fill="currentColor" /> {course.averageRating?.toFixed(1) || "0.0"}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest">
                                    <Users size={16} /> {course.enrolledStudents?.length || 0} Allies
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-8 border-t border-gray-800/50">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-white tracking-widest">{course.sections?.length || 0} SECTORS</span>
                                   <span className="text-[8px] font-bold text-gray-600 uppercase mt-1 tracking-tighter underline decoration-neon-blue/30 underline-offset-4">Intelligence File Available</span>
                                </div>
                                <button
                                    onClick={() => navigate(`/student/course/${course._id}`)}
                                    className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${
                                        isEnrolled ? 'bg-green-600 text-white hover:bg-white hover:text-black shadow-green-900/20' : 'bg-neon-blue text-black hover:bg-white shadow-cyan-900/20'
                                    }`}
                                >
                                    {isEnrolled ? 'Resume' : 'Initiate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {isIssueOpen && <ReportIssueModal user={user} onClose={() => setIsIssueOpen(false)} />}
      <StreakAlert isOpen={showStreakPopup} streakCount={displayStreak} onClose={() => setShowStreakPopup(false)} />
    </div>
  );
};

export default StudentDashboard;