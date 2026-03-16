import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Users, Trophy, Loader2 } from 'lucide-react';
import api from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State for the Instructor Request Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    city: '',
    domain: '',
    experience: '',
    credentialFile: '' // Stores Base64 data
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert File to Base64 string
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check (limit to ~2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please upload an image or PDF under 2MB.");
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, credentialFile: reader.result as string });
      };
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send data to the new backend route
      const res = await api.post('/auth/request-instructor', formData);
      alert(res.data.msg); // Show success message
      
      // Clear form
      setFormData({ name: '', email: '', institution: '', city: '', domain: '', experience: '', credentialFile: '' });
      
      // Clear the file input visually
      const fileInput = document.getElementById('credential-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      alert(err.response?.data?.msg || "Transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon-blue selection:text-black pb-20">
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8">
                LEVEL UP YOUR <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-500">
                    KNOWLEDGE
                </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                The first Learning Management System that plays like an RPG. 
                Complete coding quests, battle quizzes, earn XP, and build your alliance.
            </p>
            
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => navigate('/register')}
                    className="bg-neon-blue text-black px-8 py-4 rounded-full font-black text-lg hover:bg-cyan-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                    START GAME
                </button>
                <button 
                    onClick={() => navigate('/login')}
                    className="bg-gray-900 text-white border border-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all"
                >
                    RESUME
                </button>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-900/50 rounded-2xl flex items-center justify-center text-neon-blue mb-6">
                  <Code size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Code Battles</h3>
              <p className="text-gray-400">Write code directly in the browser. Solve challenges to earn Gold Medals and XP.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
              <div className="w-12 h-12 bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                  <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Social Alliances</h3>
              <p className="text-gray-400">Add friends, chat in real-time, and help each other defeat difficult course bosses.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
              <div className="w-12 h-12 bg-yellow-900/50 rounded-2xl flex items-center justify-center text-yellow-400 mb-6">
                  <Trophy size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Rank Up</h3>
              <p className="text-gray-400">Earn XP for every video watched and quiz passed. Climb the global leaderboard.</p>
          </div>
      </div>

      {/* 🛡️ INSTRUCTOR REQUEST SECTION */}
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] p-8 md:p-12 rounded-[3rem] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Become an Instructor
            </h2>
            <p className="text-gray-400 mt-3 font-bold text-sm tracking-widest uppercase">
              Submit your dossier for High Council review
            </p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10" onSubmit={handleRequestSubmit}>
            {/* Left Column */}
            <div className="space-y-4">
              <input required name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="Full Name" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
              <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="Email Address" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
              <input required name="institution" value={formData.institution} onChange={handleInputChange} type="text" placeholder="Institution / College" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
              <input required name="city" value={formData.city} onChange={handleInputChange} type="text" placeholder="City / Base of Operations" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <input required name="domain" value={formData.domain} onChange={handleInputChange} type="text" placeholder="Mastery Domain (e.g. React, Cyber Security)" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
              <input required name="experience" value={formData.experience} onChange={handleInputChange} type="number" min="0" placeholder="Years of Experience" className="w-full bg-black/50 border border-gray-800 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors" />
              
              {/* File Upload Placeholder */}
              <div className="relative border-2 border-dashed border-gray-700 bg-black/50 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-400 transition-colors cursor-pointer h-[120px] overflow-hidden">
                <span className="text-xs font-bold uppercase tracking-widest text-center whitespace-pre-wrap">
                  {formData.credentialFile ? "✔ Credentials Attached" : "Upload Credentials\n(PDF/Img)"}
                </span>
                <input 
                  id="credential-upload"
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  required={!formData.credentialFile} 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 mt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-purple-900/20 active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                Transmit Application
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Home;