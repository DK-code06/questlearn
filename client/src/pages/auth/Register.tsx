import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { User, Shield, Loader2, Sparkles, MapPin } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) as any;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    city: '' 
  });
  
  // ✅ NEW: State to hold the manually typed city if "Other" is selected
  const [customCity, setCustomCity] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, role, city } = formData;

  const realms = [
    "Chennai", "Madurai", "Coimbatore", "Bangalore", 
    "Hyderabad", "Mumbai", "Delhi", "Pune"
  ];

  const onChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: any) => {
    e.preventDefault();
    
    // ✅ Determine the final city to send to the backend
    const finalCity = city === 'Other' ? customCity.trim() : city;
    
    if (!finalCity) return alert("Please select or enter your Home Realm (City)");
    
    setLoading(true);
    try {
      // ✅ Inject the finalCity into the payload
      const payload = { ...formData, city: finalCity };
      const res = await axios.post('http://localhost:5000/api/auth/register', payload);
      
      login(res.data.token, res.data.role);
      
      if (res.data.role === 'instructor') {
          navigate('/instructor/dashboard');
      } else {
          navigate('/student/dashboard');
      }

    } catch (err: any) {
      alert(err.response?.data?.msg || 'Registration Failed. Email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-neon-blue selection:text-black">
      <div className="bg-[#0f172a] border border-gray-800 p-10 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden group">
        
        {/* Decorative Background Glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl transition-all duration-700 ${role === 'instructor' ? 'bg-purple-500/10' : 'bg-neon-blue/10'}`}></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white mb-2 text-center tracking-tighter uppercase flex items-center justify-center gap-2">
            JOIN THE <span className={role === 'instructor' ? 'text-purple-400' : 'text-neon-blue'}>QUEST</span>
          </h1>
          <p className="text-gray-500 text-center mb-8 font-bold uppercase text-[10px] tracking-[0.3em]">
            Create your Legend ID
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            
            {/* Role Selection Tabs */}
            <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-2xl border border-gray-800">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'student'})}
                className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${role === 'student' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <User size={16} /> STUDENT
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'instructor'})}
                className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${role === 'instructor' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Shield size={16} /> INSTRUCTOR
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Hero Name</label>
              <input required type="text" placeholder="Alex Mercer" name="name" value={name} onChange={onChange} className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700" />
            </div>

            {/* 🟢 UPDATED: Home Realm (City) Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest flex items-center gap-1">
                <MapPin size={10} /> Home Realm (City)
              </label>
              <select 
                required 
                name="city" 
                value={city} 
                onChange={onChange}
                className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-[#0f172a]">Select Realm...</option>
                {realms.map(r => (
                  <option key={r} value={r} className="bg-[#0f172a]">{r}</option>
                ))}
                {/* ✅ Added 'Other' Option */}
                <option value="Other" className="bg-[#0f172a] font-bold text-neon-blue">Other (Specify manually)</option>
              </select>
            </div>

            {/* ✅ NEW: Conditionally render custom input if "Other" is selected */}
            {city === 'Other' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-neon-blue uppercase ml-2 tracking-widest">Enter City Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Type your city..." 
                  value={customCity} 
                  onChange={(e) => setCustomCity(e.target.value)} 
                  className="w-full bg-black/50 border border-neon-blue/50 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700" 
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Email Address</label>
              <input required type="email" placeholder="hero@questlearn.com" name="email" value={email} onChange={onChange} className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Secret Passkey</label>
              <input required type="password" placeholder="••••••••" name="password" value={password} onChange={onChange} className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-gray-700" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full font-black py-5 rounded-2xl mt-6 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 ${
                role === 'instructor' 
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' 
                : 'bg-neon-blue hover:bg-cyan-400 text-black shadow-neon-blue/20'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Sparkles size={18} />
                  {role === 'instructor' ? 'INITIALIZE TEACHING' : 'INITIALIZE LEARNING'}
                </>
              )}
            </button>
          </form>

          <p className="text-gray-600 text-center mt-10 text-xs font-bold uppercase tracking-widest">
            Already have an ID? <Link to="/login" className="text-white hover:text-neon-blue transition-colors underline-offset-4">Access Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;