import { useState } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ReportIssueModal = ({ user, onClose }: any) => {
    const [formData, setFormData] = useState({ subject: '', description: '' });

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            await api.post('/issues', {
                ...formData,
                role: user.role,
                name: user.name
            });
            alert("Report transmitted. The Admin will review it.");
            onClose();
        } catch (err) { alert("Transmission failed."); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-red-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <AlertCircle className="text-red-500" /> REPORT AN ISSUE
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subject</label>
                        <input 
                            required
                            className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white focus:border-red-500 outline-none"
                            placeholder="e.g. Video not loading"
                            onChange={e => setFormData({...formData, subject: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white focus:border-red-500 outline-none resize-none"
                            placeholder="Describe the anomaly..."
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <Send size={18} /> SEND REPORT
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportIssueModal;