import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) as any;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 📡 Request Authentication
      const res = await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, formData);
      
      // 🔐 Save session to Context & LocalStorage
      login(res.data.token, res.data.role);

      // 🔀 DYNAMIC REDIRECT LOGIC
      // The role is baked into the response from the Backend logic we set up earlier
      if (res.data.role === 'admin') {
          navigate('/admin/dashboard'); // 🚀 Redirect to Admin Command Centre
      } else if (res.data.role === 'instructor') {
          navigate('/instructor/dashboard'); // 🎓 Redirect to Creator Studio
      } else {
          navigate('/student/dashboard'); // 🛡️ Redirect to Quest Board
      }

    } catch (err: any) {
      alert(err.response?.data?.msg || 'Login Failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-neon-blue selection:text-black">
      <div className="bg-[#0f172a] border border-gray-800 p-10 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden group">
        
        {/* Decorative Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/10 rounded-full blur-3xl group-hover:bg-neon-blue/20 transition-all duration-500"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white mb-2 text-center tracking-tighter uppercase">
            Welcome <span className="text-neon-blue text-glow">Back</span>
          </h1>
          <p className="text-gray-500 text-center mb-10 font-bold uppercase text-[10px] tracking-[0.3em]">
            Resume your legendary progress
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Identify Email</label>
              <input 
                required
                type="email" 
                placeholder="hero@questlearn.com" 
                name="email" 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Access Key</label>
              <input 
                required
                type="password" 
                placeholder="••••••••" 
                name="password" 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-black py-5 rounded-2xl mt-6 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <><LogIn size={20} strokeWidth={3} /> ENTER REALM</>
              )}
            </button>
          </form>

          <p className="text-gray-600 text-center mt-10 text-xs font-bold uppercase tracking-widest">
            New player? <Link to="/register" className="text-white hover:text-neon-blue transition-colors underline-offset-4">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;