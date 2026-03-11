import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Terminal, Plus, Save, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const EditProblem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [formData, setFormData] = useState({
        title: '', description: '', difficulty: 'Medium', xpReward: 20, medalReward: 1,
        examples: [{ input: '', output: '', explanation: '' }],
        testcases: [{ input: '', output: '', hidden: false }]
    });

    useEffect(() => {
        api.get('/battles/problems').then(res => {
            const probToEdit = res.data.find((p: any) => p._id === id);
            if (probToEdit) {
                setFormData({
                    title: probToEdit.title,
                    description: probToEdit.description,
                    difficulty: probToEdit.difficulty,
                    xpReward: probToEdit.xpReward,
                    medalReward: probToEdit.medalReward,
                    examples: probToEdit.examples?.length > 0 ? probToEdit.examples : [{ input: '', output: '', explanation: '' }],
                    testcases: probToEdit.testcases?.length > 0 ? probToEdit.testcases : [{ input: '', output: '', hidden: false }]
                });
            }
            setFetching(false);
        });
    }, [id]);

    const addExample = () => {
        setFormData({ ...formData, examples: [...formData.examples, { input: '', output: '', explanation: '' }] });
    };

    const updateExample = (index: number, field: 'input' | 'output' | 'explanation', value: string) => {
        const newEx = [...formData.examples];
        newEx[index] = { ...newEx[index], [field]: value };
        setFormData({ ...formData, examples: newEx });
    };

    const removeExample = (indexToRemove: number) => {
        const newEx = formData.examples.filter((_, idx) => idx !== indexToRemove);
        setFormData({ ...formData, examples: newEx });
    };

    const addTestcase = () => {
        setFormData({ ...formData, testcases: [...formData.testcases, { input: '', output: '', hidden: false }] });
    };

    const updateTestcase = (index: number, field: 'input' | 'output' | 'hidden', value: string | boolean) => {
        const newCases = [...formData.testcases];
        newCases[index] = { ...newCases[index], [field]: value };
        setFormData({ ...formData, testcases: newCases });
    };

    const removeTestcase = (indexToRemove: number) => {
        const newCases = formData.testcases.filter((_, idx) => idx !== indexToRemove);
        setFormData({ ...formData, testcases: newCases });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/battles/problem/${id}`, formData);
            alert("Combat Problem Updated!");
            navigate('/instructor/manage-problems');
        } catch (err) {
            alert("Update failed.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-neon-blue" size={40}/></div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 md:gap-2 text-gray-500 hover:text-white mb-4 md:mb-6 text-xs md:text-sm transition-colors"><ArrowLeft size={14} className="md:w-4 md:h-4"/> Back</button>
                <h1 className="text-xl md:text-3xl font-black text-purple-500 flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
                    <Terminal className="w-6 h-6 md:w-8 md:h-8" /> EDIT BATTLE PROBLEM
                </h1>
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <input required placeholder="Problem Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-gray-700 p-3 md:p-4 rounded-xl text-white outline-none focus:border-purple-500 text-sm md:text-base" />
                    
                    <textarea required rows={5} placeholder="Problem Description / Constraints..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-gray-700 p-3 md:p-4 rounded-xl text-white outline-none focus:border-purple-500 custom-scrollbar text-sm md:text-base" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <div>
                            <label className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-1.5 md:mb-2 block">Difficulty</label>
                            <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-black border border-gray-700 p-3 md:p-4 rounded-xl text-white outline-none focus:border-purple-500 cursor-pointer text-sm">
                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-1.5 md:mb-2 block">XP Reward</label>
                            <input type="number" min="10" max="50" value={formData.xpReward} onChange={e => setFormData({...formData, xpReward: Number(e.target.value)})} className="w-full bg-black border border-gray-700 p-3 md:p-4 rounded-xl text-white outline-none focus:border-purple-500 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-1.5 md:mb-2 block">Medals to Winner</label>
                            <input type="number" min="1" max="5" value={formData.medalReward} onChange={e => setFormData({...formData, medalReward: Number(e.target.value)})} className="w-full bg-black border border-gray-700 p-3 md:p-4 rounded-xl text-white outline-none focus:border-purple-500 text-sm" />
                        </div>
                    </div>

                    <div className="pt-5 md:pt-6 border-t border-gray-800">
                        <h3 className="text-xs md:text-sm font-bold text-orange-500 mb-3 md:mb-4 uppercase">Sample Executions (Visible to Students)</h3>
                        
                        {formData.examples.map((ex, idx) => (
                            <div key={idx} className="flex flex-col gap-2 md:gap-3 mb-3 md:mb-4 bg-orange-950/10 p-4 md:p-5 rounded-xl md:rounded-2xl border border-orange-500/20">
                                <div>
                                    <label className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mb-1 block">Example Input</label>
                                    <textarea rows={1} placeholder="e.g. 2 5" value={ex.input} onChange={e => updateExample(idx, 'input', e.target.value)} className="w-full bg-black border border-gray-700 p-2 md:p-3 rounded-lg text-xs md:text-sm font-mono outline-none focus:border-orange-500 custom-scrollbar" />
                                </div>
                                <div>
                                    <label className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mb-1 block">Example Output</label>
                                    <textarea rows={1} placeholder="e.g. -3" value={ex.output} onChange={e => updateExample(idx, 'output', e.target.value)} className="w-full bg-black border border-gray-700 p-2 md:p-3 rounded-lg text-xs md:text-sm font-mono outline-none focus:border-orange-500 custom-scrollbar" />
                                </div>
                                <div>
                                    <label className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mb-1 block">Explanation (Optional)</label>
                                    <textarea rows={2} placeholder="Explain why the output is -3..." value={ex.explanation} onChange={e => updateExample(idx, 'explanation', e.target.value)} className="w-full bg-black border border-gray-700 p-2 md:p-3 rounded-lg text-xs md:text-sm outline-none focus:border-orange-500 custom-scrollbar" />
                                </div>
                                
                                <div className="flex justify-end mt-1 md:mt-2">
                                    <button type="button" onClick={() => removeExample(idx)} className="flex items-center gap-1 text-red-500 text-[10px] md:text-xs font-bold uppercase hover:text-red-400 transition-colors">
                                        <Trash2 size={12} className="md:w-3.5 md:h-3.5" /> Remove Example
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        <button type="button" onClick={addExample} className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-orange-500 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase flex items-center justify-center gap-1.5 md:gap-2 w-full transition-colors mt-2">
                            <Plus size={14} strokeWidth={3} className="md:w-4 md:h-4" /> Add Another Example
                        </button>
                    </div>

                    <div className="pt-5 md:pt-6 border-t border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                            <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase">Compiler Test Cases</h3>
                            <span className="text-[9px] md:text-[10px] text-gray-600 normal-case bg-black px-2 md:px-3 py-1 rounded-full border border-gray-800 w-fit">Supports Multi-line Input</span>
                        </div>
                        
                        {formData.testcases.map((tc, idx) => (
                            <div key={idx} className="flex flex-col gap-2 md:gap-3 mb-3 md:mb-4 bg-black/50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-800">
                                <div>
                                    <label className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mb-1 block">Standard Input (stdin)</label>
                                    <textarea rows={2} placeholder="e.g. 5\n1 2 3 4 5" value={tc.input} onChange={e => updateTestcase(idx, 'input', e.target.value)} className="w-full bg-black border border-gray-700 p-2 md:p-3 rounded-lg text-xs md:text-sm font-mono outline-none focus:border-purple-500 custom-scrollbar" />
                                </div>
                                
                                <div>
                                    <label className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mb-1 block">Expected Output (stdout)</label>
                                    <textarea rows={2} placeholder="Expected Result" value={tc.output} onChange={e => updateTestcase(idx, 'output', e.target.value)} className="w-full bg-black border border-gray-700 p-2 md:p-3 rounded-lg text-xs md:text-sm font-mono outline-none focus:border-purple-500 custom-scrollbar" />
                                </div>
                                
                                <div className="flex justify-between items-center mt-1 md:mt-2 pt-2 md:pt-3 border-t border-gray-800">
                                    <label className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="checkbox" checked={tc.hidden} onChange={e => updateTestcase(idx, 'hidden', e.target.checked)} className="w-3.5 h-3.5 md:w-4 md:h-4 accent-purple-500 cursor-pointer" /> 
                                        Hidden Testcase
                                    </label>
                                    
                                    {formData.testcases.length > 1 && (
                                        <button type="button" onClick={() => removeTestcase(idx)} className="flex items-center gap-1 text-red-500 text-[10px] md:text-xs font-bold uppercase hover:text-red-400 transition-colors">
                                            <Trash2 size={12} className="md:w-3.5 md:h-3.5" /> Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        <button type="button" onClick={addTestcase} className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-500 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase flex items-center justify-center gap-1.5 md:gap-2 w-full transition-colors mt-2">
                            <Plus size={14} strokeWidth={3} className="md:w-4 md:h-4" /> Add Another Testcase
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 md:mt-8 active:scale-[0.98] shadow-lg shadow-purple-900/20 disabled:opacity-50 text-sm md:text-base">
                        {loading ? "SAVING SCENARIO..." : <><Save size={16} className="md:w-4.5 md:h-4.5" /> UPDATE PROBLEM</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProblem;