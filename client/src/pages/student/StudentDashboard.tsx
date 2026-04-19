import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Radio, 
  Star, Zap, AlertCircle, Loader2, Flame, ShoppingCart, Trophy, Terminal
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

  useEffect(() => {
    if (user?.gamification?.streak >= 1) {
      const hasSeenStreak = sessionStorage.getItem('streakShown');
      if (!hasSeenStreak) {
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
    <div className="min-h-screen bg-black text-white font-sans p-4 sm:p-6 md:p-8 selection:bg-neon-blue selection:text-black">
      
      {/* HERO BANNER */}
      <div className="relative w-full mb-10 md:mb-12 rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-[#020617] border border-gray-800/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-neon-blue/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full animate-pulse" />
        
        <div className="relative z-10 px-6 py-10 md:px-20 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12">
          <div className="text-center lg:text-left w-full lg:max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6 md:mb-8 backdrop-blur-md">
              <Terminal size={14} className="text-neon-blue" />
              <span className="text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">System Status: Online</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] mb-6 md:mb-8">
              LEVEL UP <br />
              <span className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">YOUR REALITY</span>
            </h1>
            
            <p className="text-gray-400 text-sm md:text-xl leading-relaxed font-medium max-w-2xl mb-8 md:mb-10 mx-auto lg:mx-0">
              QuestLearn is more than a platform—it's your digital proving ground. Conquer complex modules, earn XP, and rise through the global ranks.
            </p>

            <div className="grid grid-cols-2 lg:flex lg:flex-row justify-center lg:justify-start gap-3 md:gap-6 mt-4">
               <div className="flex flex-col items-center lg:items-start bg-white/5 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-white/10 lg:border-none">
                  <span className="text-2xl md:text-3xl font-black text-white italic">{courses.length}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 text-center lg:text-left">Active Courses</span>
               </div>
               <div className="w-px h-12 bg-gray-800 hidden lg:block" />
               <div className="flex flex-col items-center lg:items-start bg-white/5 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-white/10 lg:border-none">
                  <span className="text-2xl md:text-3xl font-black text-white italic">24/7</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 text-center lg:text-left">Live Access</span>
               </div>
               <div className="w-px h-12 bg-gray-800 hidden lg:block" />
               <div className="col-span-2 lg:col-span-1 flex flex-col items-center lg:items-start bg-white/5 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-white/10 lg:border-none">
                  <span className="text-2xl md:text-3xl font-black text-white italic">EARTH</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 text-center lg:text-left">Global Server</span>
               </div>
            </div>
          </div>

          <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative mx-auto lg:mx-0 mt-4 lg:mt-0">
             <div className="space-y-6 md:space-y-8">
                <div className="flex items-center gap-4 md:gap-6">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shrink-0">
                      <Flame size={24} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Streak</p>
                      <h4 className="text-2xl md:text-3xl font-black italic">{displayStreak} Days</h4>
                   </div>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-neon-blue/10 rounded-2xl flex items-center justify-center text-neon-blue border border-neon-blue/20 shrink-0">
                      <Zap size={24} fill="currentColor" />
                   </div>
                   <div>
                      <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Energy (XP)</p>
                      <h4 className="text-2xl md:text-3xl font-black italic">{user?.gamification?.totalPoints || 0}</h4>
                   </div>
                </div>
                <button 
                  onClick={() => navigate('/student/shop')}
                  className="w-full bg-white text-black font-black py-4 md:py-5 rounded-[1rem] md:rounded-[1.5rem] uppercase tracking-widest text-[10px] hover:bg-neon-blue hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Visit Store
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="w-full flex flex-col xl:flex-row items-center justify-between mb-10 md:mb-16 gap-4 md:gap-6">
        <div className="relative w-full xl:flex-1 max-w-2xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" size={20} />
          <input
              type="text"
              placeholder="Search Courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-800 p-4 md:p-5 pl-14 md:pl-16 rounded-[1.2rem] md:rounded-[1.5rem] text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700 font-bold text-xs uppercase tracking-widest"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full xl:w-auto">
            <button onClick={() => navigate('/student/rankings')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-yellow-500 text-white px-5 md:px-8 py-3 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black transition-all group text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg">
                <Trophy size={16} className="text-yellow-500 group-hover:scale-110 transition-transform" /> Leaderboard
            </button>
            <button onClick={() => navigate('/student/social')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-neon-blue text-white px-5 md:px-8 py-3 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black transition-all group text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg">
                <Users size={16} className="text-neon-blue group-hover:scale-110 transition-transform" /> Community
            </button>
            <button onClick={() => setIsIssueOpen(true)} className="p-3 md:p-4 bg-gray-900/50 border border-gray-800 rounded-[1rem] md:rounded-[1.5rem] text-gray-600 hover:text-red-500 transition-colors">
              <AlertCircle size={20}/>
            </button>
        </div>
      </div>

      <div className="w-full">
        {/* LIVE ALERT */}
        {liveCourses.length > 0 && (
          <div className="mb-10 md:mb-16">
              {liveCourses.map(course => (
                  <div key={course._id} className="bg-red-600/5 border-2 border-red-600/30 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-center justify-between shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden gap-6">
                      <div className="absolute inset-0 bg-red-600/5 animate-pulse" />
                      <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                          <div className="bg-red-600 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.4)] shrink-0"><Radio size={28} className="text-white" /></div>
                          <div>
                              <h2 className="text-lg md:text-3xl font-black uppercase italic tracking-tighter text-white">LIVE CLASS: {course.title}</h2>
                              <p className="text-red-500 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mt-1">Instructor is online. Join now.</p>
                          </div>
                      </div>
                      <button onClick={() => window.open(course.liveSession.meetingLink, '_blank')} className="w-full md:w-auto bg-white text-black px-8 py-4 md:px-10 rounded-xl md:rounded-2xl font-black shadow-2xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.2em] text-[10px] md:text-xs relative z-10 shrink-0">
                          Join Class
                      </button>
                  </div>
              ))}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
          <h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em] md:tracking-[0.6em] italic whitespace-nowrap">Available Courses</h2>
          <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent" />
        </div>

        {/* ✅ FIXED COURSE GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32">
              <Loader2 className="animate-spin text-neon-blue mb-4 md:mb-6" size={40} />
              <p className="text-gray-600 font-black uppercase text-[10px] md:text-xs tracking-[0.4em] animate-pulse">Loading Courses...</p>
          </div>
        ) : (
          // ✅ Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filteredCourses.map((course) => {
                  const isEnrolled = course.enrolledStudents?.includes(user?._id);
                  const isLive = course.liveSession?.isActive;

                  return (
                      <div
                        key={course._id}
                        onClick={() => navigate(`/student/course/${course._id}`)}
                        className={`rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${
                          isLive && isEnrolled
                            ? 'border-red-600 bg-red-600/5 hover:shadow-red-500/20'
                            : 'border-gray-800 bg-gray-900/50 hover:border-neon-blue hover:shadow-neon-blue/10'
                        }`}
                      >
                          {/* ✅ THUMBNAIL — always visible, not hidden behind opacity */}
                          <div className="relative w-full aspect-video bg-gray-900 overflow-hidden">
                              {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <span className="text-gray-700 font-black text-7xl italic">{course.title.charAt(0)}</span>
                                  </div>
                              )}
                              {/* Dark gradient only at bottom for text readability */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                              {/* Badges */}
                              <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black text-neon-blue border border-neon-blue/30 uppercase tracking-widest">
                                  {course.category}
                                </span>
                                {isLive && (
                                  <span className="bg-red-600 px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase animate-pulse">
                                    🔴 LIVE
                                  </span>
                                )}
                              </div>
                              {isEnrolled && (
                                <div className="absolute top-3 right-3 bg-green-500 text-black px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-xl">
                                  Enrolled
                                </div>
                              )}
                          </div>

                          {/* ✅ CARD BODY */}
                          <div className="p-4 md:p-5 flex flex-col flex-1">
                              <h3 className="font-black text-base md:text-lg text-white mb-2 group-hover:text-neon-blue transition-colors line-clamp-2 uppercase tracking-tight leading-tight">
                                {course.title}
                              </h3>

                              <div className="flex items-center gap-4 mb-4">
                                  <div className="flex items-center gap-1.5 text-yellow-400 font-black text-xs">
                                      <Star size={12} fill="currentColor" /> {course.averageRating?.toFixed(1) || "0.0"}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-500 font-bold text-xs">
                                      <Users size={12} /> {course.enrolledStudents?.length || 0} Students
                                  </div>
                                  <div className="ml-auto text-gray-600 font-black text-[10px] uppercase tracking-widest">
                                    {course.sections?.length || 0} Modules
                                  </div>
                              </div>

                              {/* ✅ CTA Button */}
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/student/course/${course._id}`);
                                  }}
                                  className={`w-full mt-auto py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                                      isEnrolled
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-neon-blue text-black hover:bg-cyan-400'
                                  }`}
                              >
                                  {isEnrolled ? 'Resume Quest' : 'Start Quest'}
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
        )}
      </div>

      {isIssueOpen && <ReportIssueModal user={user} onClose={() => setIsIssueOpen(false)} />}
      <StreakAlert isOpen={showStreakPopup} streakCount={displayStreak} onClose={() => setShowStreakPopup(false)} />
    </div>
  );
};

export default StudentDashboard;