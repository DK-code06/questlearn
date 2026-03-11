import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, MapPin, Zap, Timer, Globe, Target } from 'lucide-react';
import api from '../../utils/api';

const Leaderboard = () => {
    const [rankings, setRankings] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankings();
    }, [timeframe]);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/leaderboard/${timeframe}`);
            setRankings(res.data);
        } catch (err) {
            console.error("Failed to load Hall of Heroes");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-neon-blue selection:text-black">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2 flex items-center justify-center gap-3">
                        <Crown className="text-yellow-500" size={40} /> Hall of Heroes
                    </h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em]">Global Quest Rankings</p>
                </div>

                {/* Timeframe Selectors */}
                <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 mb-8 max-w-md mx-auto">
                    {(['daily', 'weekly', 'monthly', 'all'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${timeframe === t ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Zap className="text-neon-blue mb-4 animate-bounce" size={40} />
                        <p className="font-black text-xs uppercase tracking-widest text-gray-500">Retrieving Legend Data...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rankings.length === 0 ? (
                            <div className="text-center p-20 border-2 border-dashed border-gray-800 rounded-[2rem]">
                                <Target className="mx-auto text-gray-700 mb-4" size={48} />
                                <p className="text-gray-500 font-bold uppercase text-xs">No Hero activity detected in this cycle.</p>
                            </div>
                        ) : (
                            rankings.map((hero, index) => (
                                <div 
                                    key={hero._id}
                                    className={`relative group flex items-center justify-between p-5 rounded-[1.5rem] border transition-all hover:scale-[1.02] ${
                                        index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-500/50' : 
                                        index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/30' :
                                        index === 2 ? 'bg-gradient-to-r from-orange-900/10 to-transparent border-orange-900/30' :
                                        'bg-gray-900/50 border-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-6">
                                        {/* Rank Position */}
                                        <div className="w-8 text-center">
                                            {index === 0 ? <Trophy className="text-yellow-500 mx-auto" size={24} /> :
                                             index === 1 ? <Medal className="text-gray-400 mx-auto" size={24} /> :
                                             index === 2 ? <Medal className="text-orange-600 mx-auto" size={24} /> :
                                             <span className="font-black text-gray-600 italic">#{index + 1}</span>}
                                        </div>

                                        {/* Hero Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black border border-gray-800 rounded-2xl flex items-center justify-center text-neon-blue font-black shadow-inner">
                                                {hero.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black uppercase tracking-tight text-lg group-hover:text-neon-blue transition-colors">
                                                    {hero.name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1 uppercase">
                                                        <MapPin size={10} /> {hero.city || "Unknown Realm"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-700 font-black tracking-widest">•</span>
                                                    <span className="text-[10px] text-neon-blue/60 font-bold uppercase">
                                                        Total Points: {hero.totalPoints}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Display */}
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-2xl font-black italic tracking-tighter text-white">
                                                {hero.periodicXP}
                                            </span>
                                            <Zap className="text-neon-blue" size={18} fill="currentColor" />
                                        </div>
                                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Points Gained</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Footer Tip */}
                <div className="mt-12 text-center">
                    <p className="text-gray-700 font-bold uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                        <Timer size={12} /> Leaderboard resets every Monday at 00:00 UTC
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;