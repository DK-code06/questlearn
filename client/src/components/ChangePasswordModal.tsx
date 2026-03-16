import { useState } from 'react';
import { X, Lock, KeyRound, Loader2 } from 'lucide-react';
import api from '../utils/api';

const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return alert("New passkeys do not match.");
        }
        if (formData.newPassword.length < 6) {
            return alert("Passkey must be at least 6 characters.");
        }

        setLoading(true);
        try {
            const res = await api.put('/users/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            alert(res.data.msg);
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.msg || "Failed to update passkey.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-neon-blue/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,243,255,0.15)] relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-neon-blue/10 rounded-2xl flex items-center justify-center text-neon-blue border border-neon-blue/20 mb-4 shadow-inner">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Security Protocol</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Update your access credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input 
                            required type="password" placeholder="Current Passkey" 
                            value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                            className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-xl text-sm text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700" 
                        />
                    </div>
                    <div className="relative">
                        <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input 
                            required type="password" placeholder="New Passkey" 
                            value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})}
                            className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-xl text-sm text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700" 
                        />
                    </div>
                    <div className="relative">
                        <CheckCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input 
                            required type="password" placeholder="Confirm New Passkey" 
                            value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-xl text-sm text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700" 
                        />
                    </div>

                    <button disabled={loading} type="submit" className="w-full bg-neon-blue hover:bg-cyan-400 text-black font-black py-4 rounded-xl mt-6 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-cyan-900/20">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Credentials"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Quick fix for the missing icon above:
import { CheckCircle } from 'lucide-react';
export default ChangePasswordModal;