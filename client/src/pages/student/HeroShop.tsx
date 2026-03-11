import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Zap, ArrowLeft, ShoppingBag, 
  ChevronRight, Star, Lock, Sparkles 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const HeroShop = () => {
  const { user, setUser } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Shop Items Configuration
  const armoryItems = [
    {
      id: 'streak_freeze',
      name: 'Streak Shield',
      description: 'Protects your daily streak for 24 hours if you miss a quest.',
      cost: 500,
      icon: <Shield size={32} className="text-neon-blue" />,
      tag: 'ESSENTIAL',
      color: 'from-cyan-500/20 to-blue-500/20'
    },
    {
      id: 'xp_booster',
      name: 'Energy Overdrive',
      description: 'Double the XP earned from your next 3 quest levels.',
      cost: 1200,
      icon: <Zap size={32} className="text-purple-500" />,
      tag: 'ADVANCED',
      color: 'from-purple-500/20 to-pink-500/20'
    }
  ];

  const handlePurchase = async (itemId: string, cost: number) => {
    if (user.gamification.totalPoints < cost) {
      alert("Insufficient Energy (XP)! Complete more missions to earn points.");
      return;
    }

    setLoading(true);
    try {
      // Assuming you've created this backend route
      const res = await api.post(`/shop/buy/${itemId}`);
      
      // Update local context so the header points update immediately
      setUser({ ...user, gamification: res.data.gamification });
      alert("Upgrade Synchronized to your Inventory! 🛡️");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-neon-blue">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest mb-4"
            >
              <ArrowLeft size={16} /> Return to Hub
            </button>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase flex items-center gap-4">
              <ShoppingBag className="text-neon-blue" size={40} /> Hero Armory
            </h1>
          </div>

          {/* Points Display */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-neon-blue/10 rounded-2xl text-neon-blue">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Available Energy</p>
              <h2 className="text-3xl font-black text-white">{user?.gamification?.totalPoints || 0} <span className="text-xs text-neon-blue italic">XP</span></h2>
            </div>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {armoryItems.map((item) => (
            <div 
              key={item.id} 
              className="relative bg-gray-900/40 border border-gray-800 rounded-[3rem] p-8 overflow-hidden group hover:border-neon-blue/50 transition-all duration-500"
            >
              {/* Decorative Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-5 bg-black rounded-3xl border border-gray-800 group-hover:border-neon-blue/30 transition-colors">
                    {item.icon}
                  </div>
                  <span className="bg-gray-800 text-gray-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter group-hover:bg-neon-blue group-hover:text-black transition-colors">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-neon-blue transition-colors">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 h-12">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xl font-black">{item.cost} <span className="text-[10px] text-gray-600">XP</span></span>
                  </div>

                  <button 
                    onClick={() => handlePurchase(item.id, item.cost)}
                    disabled={loading || (user?.gamification?.totalPoints || 0) < item.cost}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neon-blue transition-all disabled:opacity-20 disabled:hover:bg-white"
                  >
                    Acquire <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Locked / Coming Soon Item */}
          <div className="bg-gray-900/20 border border-gray-800/50 border-dashed rounded-[3rem] p-8 flex flex-col items-center justify-center text-center opacity-50">
             <div className="p-5 bg-gray-800/30 rounded-3xl mb-4">
                <Lock size={32} className="text-gray-600" />
             </div>
             <h3 className="font-black uppercase tracking-widest text-gray-600">Legendary Artifact</h3>
             <p className="text-[10px] font-bold text-gray-700 uppercase mt-1">Unlocks at Level 20</p>
          </div>
        </div>

        {/* Inventory Briefing */}
        <div className="mt-16 bg-gray-900/30 border border-gray-800 p-8 rounded-[2.5rem]">
           <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-2">
             <Shield size={14}/> Current Gear Inventory
           </h4>
           <div className="flex flex-wrap gap-4">
              <div className="bg-black border border-gray-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                 <Shield size={18} className="text-neon-blue" />
                 <span className="text-sm font-bold text-gray-400">Streak Shields: <span className="text-white font-black">{user?.gamification?.inventory?.streakFreeze || 0}</span></span>
              </div>
              <div className="bg-black border border-gray-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                 <Zap size={18} className="text-purple-500" />
                 <span className="text-sm font-bold text-gray-400">XP Boosters: <span className="text-white font-black">{user?.gamification?.inventory?.xpBoosters || 0}</span></span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HeroShop;