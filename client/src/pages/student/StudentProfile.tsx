import { useState, useEffect, useContext } from 'react';
import {
  User, MapPin, Shield, Zap, Edit3, Save, Camera,
  CheckCircle, PlayCircle, Clock, Award, BookOpen, Flame
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const StudentProfile = () => {
  const { user, setUser } = useContext(AuthContext) as any;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    domain: '',
    currentStudying: '',
    city: '',
    country: 'India'
  });

  // 🟢 Sync local form with user context data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dob: user.dob || '',
        domain: user.domain || '',
        currentStudying: user.currentStudying || '',
        city: user.location?.city || '',
        country: user.location?.country || 'India'
      });
    }
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/users/profile-stats');
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dossier", err);
      setLoading(false);
    }
  };

  // 📸 Handle Profile Photo Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        try {
          const res = await api.put('/users/update-profile', { profilePic: base64Image });
          setUser(res.data); // Update global AuthContext
          alert("Profile image synchronized!");
        } catch (err) {
          alert("Image too large or transmission failed. Try a smaller file.");
        }
      };
    }
  };

  const handleSave = async () => {
    try {
      // 🟢 Match Backend nested structure (location.city, etc.)
      const payload = {
        name: formData.name,
        dob: formData.dob,
        domain: formData.domain,
        currentStudying: formData.currentStudying,
        city: formData.city,
        country: formData.country
      };

      const res = await api.put('/users/update-profile', payload);
      setUser(res.data);
      setIsEditing(false);
      alert("Dossier Synchronized, Hero!");
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to sync data.");
    }
  };

  // Gamification Calculations
  const currentXP = user?.gamification?.totalPoints || 0;
  const heroLevel = Math.floor(currentXP / 100) + 1;
  const xpInCurrentLevel = currentXP % 100;

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-neon-blue font-black animate-pulse uppercase tracking-[0.3em]">Decoding Dossier...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 selection:bg-neon-blue">
      <div className="max-w-7xl mx-auto">

        {/* 1. HERO HEADER CARD */}
        <div className="relative bg-[#020617] border border-white/5 rounded-[4rem] p-10 mb-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-neon-blue/5 blur-[120px] rounded-full -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-40 h-40 bg-black border-4 border-gray-800 rounded-[3rem] flex items-center justify-center overflow-hidden group-hover:border-neon-blue transition-all duration-500 shadow-2xl">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={80} className="text-gray-800" />
                )}
              </div>

              {/* Camera Button + Hidden Input */}
              <label className="absolute -bottom-2 -right-2 bg-neon-blue text-black p-3 rounded-2xl cursor-pointer hover:scale-110 transition-all shadow-xl border-4 border-black">
                <Camera size={20} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="text-center lg:text-left flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter">{user?.name}</h1>
                <div className="bg-neon-blue/10 border border-neon-blue/20 px-5 py-2 rounded-2xl inline-block">
                  <span className="text-neon-blue text-xs font-black tracking-[0.2em] uppercase">Level {heroLevel} Elite Hero</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mb-8 mx-auto lg:mx-0">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  <span>XP Progress</span>
                  <span>{xpInCurrentLevel}/100 XP</span>
                </div>
                <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all duration-1000" style={{ width: `${xpInCurrentLevel}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-neon-blue/10 rounded-2xl text-neon-blue"><Zap size={20} fill="currentColor" /></div>
                  <div>
                    <p className="text-2xl font-black">{currentXP}</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Lifetime XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><Flame size={20} fill="currentColor" /></div>
                  <div>
                    <p className="text-2xl font-black">{user?.gamification?.streak || 1}</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><Award size={20} /></div>
                  <div>
                    <p className="text-2xl font-black">{(user?.gamification?.medals?.gold || 0) + (user?.gamification?.medals?.silver || 0)}</p>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Medals Earned</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${isEditing ? 'bg-green-600 text-white animate-pulse' : 'bg-white text-black hover:bg-neon-blue'}`}
            >
              {isEditing ? <><Save size={18} /> Commit Changes</> : <><Edit3 size={18} /> Modify Dossier</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 2. PERSONAL DOSSIER FORM */}
          <div className="space-y-8">
            <div className="bg-[#020617] border border-white/5 p-10 rounded-[3rem] shadow-xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3 italic">
                <Shield size={16} className="text-neon-blue" /> Personal Dossier
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Identity Name</label>
                  <input disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-sm focus:border-neon-blue outline-none disabled:opacity-40 transition-all font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Date of Birth</label>
                  <input type="date" disabled={!isEditing} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-sm focus:border-neon-blue outline-none disabled:opacity-40 transition-all font-bold" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-neon-blue uppercase tracking-widest ml-1">Current Base (City)</label>                    <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input disabled={!isEditing} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-2xl text-sm focus:border-neon-blue outline-none disabled:opacity-40 font-bold" placeholder="e.g. Madurai" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Mastery Domain</label>
                  <input placeholder="e.g. Cyber Security" disabled={!isEditing} value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-sm focus:border-neon-blue outline-none disabled:opacity-40 transition-all font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Current Institution</label>
                  <input placeholder="e.g. MIT University" disabled={!isEditing} value={formData.currentStudying} onChange={(e) => setFormData({ ...formData, currentStudying: e.target.value })} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-sm focus:border-neon-blue outline-none disabled:opacity-40 transition-all font-bold" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. QUEST LOG */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#020617] border border-white/5 p-10 rounded-[3rem] shadow-xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 italic">
                <BookOpen size={16} className="text-neon-blue" /> Quest Archives
              </h3>
              <div className="space-y-12">
                <div>
                  <h4 className="text-[10px] font-black text-orange-500 uppercase mb-6 flex items-center gap-3 tracking-[0.2em]">
                    <Clock size={14} /> Active Deployments
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {!stats?.ongoing || stats.ongoing.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-800 rounded-[2rem] text-center">
                        <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No Active Missions Found</p>
                      </div>
                    ) : stats.ongoing.map((quest: any) => (
                      <div key={quest._id} className="bg-black border border-gray-800 p-6 rounded-[2rem] flex justify-between items-center group hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform"><PlayCircle size={24} /></div>
                          <div>
                            <p className="font-black text-lg group-hover:text-white transition-colors uppercase italic">{quest.title}</p>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mt-1">{quest.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white italic">{quest.progress}%</p>
                          <div className="w-32 bg-gray-900 h-2 rounded-full mt-2 overflow-hidden border border-white/5">
                            <div className="bg-orange-500 h-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${quest.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-green-500 uppercase mb-6 flex items-center gap-3 tracking-[0.2em]">
                    <CheckCircle size={14} /> Legendary Accomplishments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {!stats?.completed || stats.completed.length === 0 ? (
                      <p className="text-gray-700 text-[10px] font-black uppercase italic tracking-widest">The archives are empty...</p>
                    ) : stats.completed.map((quest: any) => (
                      <div key={quest._id} className="bg-black border border-gray-800 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-green-500/30 transition-all">
                        <div className="p-4 bg-green-500/10 rounded-2xl text-green-500"><Award size={24} /></div>
                        <div>
                          <p className="font-black text-sm text-gray-300 uppercase italic line-clamp-1">{quest.title}</p>
                          <p className="text-[8px] font-black text-green-500/50 uppercase tracking-[0.2em] mt-1">Status: Secured</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;