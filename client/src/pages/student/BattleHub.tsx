import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sword, Key } from 'lucide-react';
import api from '../../utils/api';

const BattleHub = () => {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<any[]>([]);
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        api.get('/battles/problems').then(res => setProblems(res.data)).catch(console.error);
    }, []);

    const createRoom = async (problemId: string) => {
        try {
            const res = await api.post('/battles/create-room', { problemId, battleType: '1vs1' });
            navigate(`/student/battle/${res.data.battle.roomId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create room");
        }
    };

    const joinRoom = async () => {
        if (!joinCode) return;
        try {
            await api.post(`/battles/join-room/${joinCode.toUpperCase()}`);
            navigate(`/student/battle/${joinCode.toUpperCase()}`);
        } catch (err) { alert("Invalid Room Code"); }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 italic uppercase tracking-tighter">BATTLE ARENA</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest mt-2 text-[10px] md:text-sm">Compete. Compile. Conquer.</p>
                </div>

                <div className="flex justify-center mb-10 md:mb-12">
                    <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-[2rem] text-center w-full max-w-md shadow-2xl">
                        <Key className="text-neon-blue mx-auto mb-4 w-8 h-8 md:w-10 md:h-10"/>
                        <h2 className="text-lg md:text-xl font-black uppercase mb-4 tracking-wider">Join Private Match</h2>
                        <input 
                            value={joinCode} 
                            onChange={e => setJoinCode(e.target.value)} 
                            placeholder="ENTER ROOM CODE..." 
                            className="w-full bg-black border border-gray-700 p-4 rounded-xl text-center text-lg md:text-xl font-mono uppercase text-neon-blue focus:border-neon-blue outline-none mb-4 tracking-[0.2em] placeholder:text-gray-600 placeholder:tracking-normal" 
                        />
                        <button onClick={joinRoom} className="w-full bg-neon-blue text-black font-black py-4 rounded-xl uppercase tracking-widest hover:bg-cyan-400 transition-colors active:scale-95 text-sm md:text-base">
                            Initiate Uplink
                        </button>
                    </div>
                </div>

                <h3 className="text-base md:text-xl font-black uppercase tracking-widest text-gray-400 mb-6 text-center md:text-left">Select Target Problem (Host)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {problems.map(prob => (
                        <div key={prob._id} className="bg-black border border-gray-800 hover:border-orange-500 p-5 md:p-6 rounded-2xl group transition-all shadow-lg hover:shadow-orange-500/10 flex flex-col">
                            <h4 className="font-black text-lg md:text-xl text-white group-hover:text-orange-500 line-clamp-1">{prob.title}</h4>
                            <div className="flex justify-between items-center mt-4 mb-6">
                                <span className={`text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1 rounded ${prob.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : prob.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {prob.difficulty}
                                </span>
                                <span className="text-xs md:text-sm font-black text-yellow-500">+{prob.xpReward} XP</span>
                            </div>
                            <button onClick={() => createRoom(prob._id)} className="mt-auto w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 transition-transform">
                                <Sword size={14}/> Host Battle
                            </button>
                        </div>
                    ))}
                </div>
                
                {problems.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-[2rem]">
                        <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No Battle Problems Deployed.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default BattleHub;