import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, LogOut, Layout, Users, Bell, Calendar, Trophy, User as UserIcon, Globe, Sword, Terminal, Menu, X, KeyRound } from 'lucide-react';
import api from '../utils/api';
import ChangePasswordModal from './ChangePasswordModal';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const location = useLocation(); // ✅ NEW: Used to determine active page
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Helper function to check if a link is active
  const isActive = (path: string) => location.pathname.includes(path);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      fetchUpcoming();
    }
  }, [isAuthenticated, user]);

  const fetchUpcoming = async () => {
    if (!user || !user._id) return;
    try {
      const res = await api.get('/courses');
      const now = new Date();
      const scheduled = res.data.filter((c: any) =>
        c.enrolledStudents.includes(user._id) &&
        c.liveSession?.scheduledDate &&
        new Date(c.liveSession.scheduledDate) > now
      );
      setUpcomingClasses(scheduled);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-black/95 border-b border-gray-900 sticky top-0 z-50 backdrop-blur-xl px-4 md:px-8 lg:px-12">
      {/* Added overflow-visible so dropdowns aren't clipped, but keeping layout tight */}
      <div className="w-full flex items-center justify-between h-16 md:h-20">
        
        {/* 1. LEFT SECTION: BRANDING & SYSTEM STATUS */}
        <div className="flex items-center gap-3 md:gap-8">
          <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 md:gap-3 group shrink-0">
            <div className="bg-neon-blue p-1.5 md:p-2 rounded-lg md:rounded-xl group-hover:rotate-[15deg] transition-all duration-300 shadow-[0_0_25px_rgba(0,243,255,0.3)]">
              <Zap className="text-black fill-black w-4 h-4 md:w-6 md:h-6" />
            </div>
            <span className="text-lg md:text-2xl font-black tracking-tighter uppercase italic text-white group-hover:text-neon-blue transition-colors">
              Quest<span className="text-neon-blue hidden sm:inline">Learn</span>
            </span>
          </Link>

          {/* Dynamic Server Status (Hidden on very small screens) */}
          <div className="hidden lg:flex items-center gap-3 border-l border-gray-800 pl-8 shrink-0">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Server: <span className="text-white">{user?.location?.city || 'Global'}</span>
             </span>
          </div>
        </div>

        {/* 2. RIGHT SECTION: NAVIGATION & HERO HUD */}
        <div className="flex items-center gap-3 lg:gap-8">
          {isAuthenticated ? (
            <>
              {/* DESKTOP LINKS (Hidden on Mobile) - Simplified Terms & Active States */}
              <div className="hidden xl:flex items-center gap-8 border-r border-gray-800 pr-8">
                {user?.role === 'student' ? (
                  <>
                    <Link to="/student/dashboard" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/student/dashboard') ? 'text-neon-blue border-neon-blue' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Layout size={16} className={isActive('/student/dashboard') ? 'text-neon-blue' : 'text-gray-500'} /> COURSES
                    </Link>
                    <Link to="/student/social" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/student/social') ? 'text-neon-blue border-neon-blue' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Users size={16} className={isActive('/student/social') ? 'text-neon-blue' : 'text-gray-500'} /> COMMUNITY
                    </Link>
                    <Link to="/student/rankings" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/student/rankings') ? 'text-neon-blue border-neon-blue' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Trophy size={16} className={isActive('/student/rankings') ? 'text-neon-blue' : 'text-gray-500'} /> LEADERBOARD
                    </Link>
                    <Link to="/student/battle-hub" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/student/battle') ? 'text-orange-500 border-orange-500' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Sword size={16} className={isActive('/student/battle') ? 'text-orange-500' : 'text-gray-500'} /> CHALLENGES
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/instructor/dashboard" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/instructor/dashboard') ? 'text-purple-500 border-purple-500' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Layout size={16} className={isActive('/instructor/dashboard') ? 'text-purple-500' : 'text-gray-500'} /> DASHBOARD
                    </Link>
                    <Link to="/instructor/manage-problems" className={`font-black text-[11px] tracking-widest flex items-center gap-2 transition-all pb-1 border-b-2 ${isActive('/instructor/manage-problems') ? 'text-purple-500 border-purple-500' : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'}`}>
                      <Terminal size={16} className={isActive('/instructor/manage-problems') ? 'text-purple-500' : 'text-gray-500'} /> CHALLENGES
                    </Link>
                  </>
                )}
              </div>

              {/* HERO HUD TOOLS */}
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                
                {/* NOTIFICATION HUB */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all relative ${showNotifications ? 'bg-neon-blue text-black' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'}`}
                  >
                    <Bell size={20} className="md:w-5 md:h-5" />
                    {upcomingClasses.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-red-600 border-2 border-black"></span>
                      </span>
                    )}
                  </button>

                  {/* NOTIFICATION DROPDOWN */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-4 md:mt-6 w-72 md:w-80 bg-gray-900 border border-gray-800 rounded-[2rem] shadow-2xl p-4 md:p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-4 md:mb-6 flex items-center gap-3">
                        <Calendar size={14} className="text-neon-blue"/> Scheduled
                      </h4>
                      <div className="space-y-3">
                        {upcomingClasses.length === 0 ? (
                          <div className="py-6 md:py-8 text-center bg-black/40 rounded-2xl md:rounded-3xl border border-gray-800/50">
                             <Globe size={20} className="mx-auto text-gray-800 mb-2 opacity-50" />
                             <p className="text-gray-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">No Active Classes</p>
                          </div>
                        ) : (
                          upcomingClasses.map((c: any) => (
                            <div key={c._id} className="bg-black/50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border border-gray-800 hover:border-neon-blue/40 transition-all group">
                              <p className="text-white font-black text-[10px] md:text-xs uppercase italic tracking-tight group-hover:text-neon-blue">{c.title}</p>
                              <div className="flex justify-between items-center mt-2 pt-2 md:mt-3 md:pt-3 border-t border-gray-800/50">
                                <span className="text-neon-blue text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">
                                  {new Date(c.liveSession.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                </span>
                                <span className="text-gray-600 text-[7px] md:text-[8px] font-black uppercase tracking-widest">
                                  {new Date(c.liveSession.scheduledDate).toLocaleDateString([], { weekday: 'short' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* USER PROFILE ACCESS (Simplified Name) */}
                <Link
                  to={user?.role === 'instructor' ? "/instructor/dashboard" : "/student/profile"}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 md:gap-4 bg-[#0a0a0a] border border-gray-800 p-1.5 md:p-2 md:pr-6 rounded-full md:rounded-3xl hover:border-neon-blue transition-all group shadow-xl"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 border border-gray-800 rounded-full md:rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-neon-blue group-hover:text-black transition-all duration-500">
                    <UserIcon size={16} className="md:w-5 md:h-5" />
                  </div>
                  <div className="hidden sm:flex flex-col pr-2 md:pr-0">
                    <span className="text-[10px] md:text-[11px] font-black text-white leading-none uppercase tracking-tight group-hover:text-neon-blue truncate max-w-[80px] md:max-w-none">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-[7px] md:text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-1 md:mt-1.5">
                      Profile
                    </span>
                  </div>
                </Link>

                {/* CHANGE PASSWORD */}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="hidden sm:block p-2 md:p-3.5 bg-gray-900 border border-gray-800 rounded-full md:rounded-2xl text-gray-500 hover:text-neon-blue hover:border-neon-blue/50 transition-all hover:scale-110 active:scale-95"
                  title="Change Password"
                >
                  <KeyRound size={16} className="md:w-5 md:h-5" />
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:block p-2 md:p-3.5 bg-gray-900 border border-gray-800 rounded-full md:rounded-2xl text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all hover:scale-110 active:scale-95"
                  title="Log Out"
                >
                  <LogOut size={16} className="md:w-5 md:h-5" />
                </button>

                {/* MOBILE HAMBURGER MENU BUTTON */}
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="xl:hidden p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors ml-1"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </>
          ) : (
            /* GUEST ACCESS */
            <div className="flex items-center gap-4 md:gap-8">
              <Link to="/login" className="text-gray-500 hover:text-white font-black text-[9px] md:text-[11px] tracking-[0.3em] uppercase transition-all">LOGIN</Link>
              <Link to="/register" className="bg-white text-black px-4 py-2 md:px-8 md:py-3.5 rounded-lg md:rounded-2xl font-black text-[9px] md:text-[11px] tracking-[0.3em] hover:bg-neon-blue transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                JOIN NOW
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU - Simplified Terms */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="xl:hidden absolute top-16 md:top-20 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-gray-800 flex flex-col p-4 shadow-2xl animate-in slide-in-from-top-2 z-50">
          {user?.role === 'student' ? (
            <>
              <Link onClick={closeMobileMenu} to="/student/dashboard" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/student/dashboard') ? 'text-neon-blue' : 'text-gray-300 hover:text-neon-blue'}`}>
                <Layout size={18} /> COURSES
              </Link>
              <Link onClick={closeMobileMenu} to="/student/social" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/student/social') ? 'text-neon-blue' : 'text-gray-300 hover:text-neon-blue'}`}>
                <Users size={18} /> COMMUNITY
              </Link>
              <Link onClick={closeMobileMenu} to="/student/rankings" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/student/rankings') ? 'text-neon-blue' : 'text-gray-300 hover:text-neon-blue'}`}>
                <Trophy size={18} /> LEADERBOARD
              </Link>
              <Link onClick={closeMobileMenu} to="/student/battle-hub" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/student/battle') ? 'text-orange-500' : 'text-gray-300 hover:text-orange-500'}`}>
                <Sword size={18} /> CHALLENGES
              </Link>
            </>
          ) : (
            <>
              <Link onClick={closeMobileMenu} to="/instructor/dashboard" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/instructor/dashboard') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-400'}`}>
                <Layout size={18} /> DASHBOARD
              </Link>
              <Link onClick={closeMobileMenu} to="/instructor/manage-problems" className={`p-4 border-b border-gray-800 font-black text-xs tracking-widest flex items-center gap-3 ${isActive('/instructor/manage-problems') ? 'text-purple-400' : 'text-gray-300 hover:text-purple-400'}`}>
                <Terminal size={18} /> CHALLENGES
              </Link>
            </>
          )}
          
          <button onClick={() => { closeMobileMenu(); setShowPasswordModal(true); }} className="p-4 border-b border-gray-800 text-gray-300 hover:text-white font-black text-xs tracking-widest flex items-center gap-3 text-left w-full">
            <KeyRound size={18} /> CHANGE PASSWORD
          </button>

          <button onClick={handleLogout} className="p-4 text-red-500 hover:text-red-400 font-black text-xs tracking-widest flex items-center gap-3 text-left w-full mt-2">
            <LogOut size={18} /> LOG OUT
          </button>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </nav>
  );
};

export default Navbar;