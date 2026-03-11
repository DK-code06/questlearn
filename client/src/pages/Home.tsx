import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Users, Trophy } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon-blue selection:text-black">
      
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

    </div>
  );
};

export default Home;