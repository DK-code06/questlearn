import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Plus, Trash2, Edit2, Award, Zap, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const ManageProblems = () => {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await api.get('/battles/problems');
            setProblems(res.data);
        } catch (err) {
            console.error("Failed to fetch problems");
        } finally {
            setLoading(false);
        }
    };

    // ✅ ADDED: Delete Logic
    const deleteProblem = async (id: string) => {
        if (window.confirm("Are you sure you want to permanently delete this battle scenario?")) {
            try {
                await api.delete(`/battles/problem/${id}`);
                setProblems(problems.filter(p => p._id !== id));
            } catch (err) {
                alert("Failed to delete problem");
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase tracking-tighter">
                            COMBAT DATABASE
                        </h1>
                        <p className="text-gray-400 mt-2 italic">Manage your deployed coding challenges.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/instructor/dashboard')} className="text-gray-500 hover:text-white font-bold px-4 transition-colors">Studio</button>
                        <button onClick={() => navigate('/instructor/create-problem')} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                            <Plus size={20} /> Create Problem
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" size={40}/></div>
                ) : problems.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
                        <Terminal size={48} className="mx-auto text-gray-700 mb-4"/>
                        <h3 className="text-xl font-bold text-gray-300 mb-2">No Combat Scenarios Deployed</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {problems.map((prob) => (
                            <div key={prob._id} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl hover:border-purple-500 transition-all group shadow-xl">
                                <h3 className="text-xl font-black text-white mb-2 line-clamp-1">{prob.title}</h3>
                                <p className="text-xs text-gray-500 mb-6 line-clamp-2">{prob.description}</p>
                                
                                <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-gray-800 mb-6">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <Award size={16}/> <span className="font-black text-xs">{prob.medalReward} Medals</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neon-blue">
                                        <Zap size={16}/> <span className="font-black text-xs">{prob.xpReward} XP</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase ${prob.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : prob.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                                        {prob.difficulty}
                                    </span>
                                    
                                    {/* ✅ ADDED: Edit and Delete Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => navigate(`/instructor/edit-problem/${prob._id}`)} className="text-gray-500 hover:text-blue-400 transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteProblem(prob._id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageProblems;