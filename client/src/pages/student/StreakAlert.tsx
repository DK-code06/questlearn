import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Zap } from 'lucide-react';

interface StreakProps {
  isOpen: boolean;
  streakCount: number;
  onClose: () => void;
}

const StreakAlert = ({ isOpen, streakCount, onClose }: StreakProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 20 }}
            className="bg-[#0f172a] border-2 border-orange-500 p-8 rounded-[3rem] text-center max-w-sm shadow-[0_0_50px_rgba(249,115,22,0.3)] relative overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 blur-[100px]" />
            
            <div className="relative inline-block mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame size={100} className="text-orange-500" fill="currentColor" />
              </motion.div>
              
              {/* Floating Particles */}
              <motion.div 
                animate={{ y: [-10, -30], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-0 right-0 text-orange-400"
              >
                <Zap size={20} fill="currentColor" />
              </motion.div>
            </div>

            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
              STREAK ACTIVE!
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-4">
               <span className="text-orange-500 font-black text-7xl">{streakCount}</span>
               <div className="text-left">
                  <p className="text-white font-black text-xl leading-none">DAYS</p>
                  <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">In a row</p>
               </div>
            </div>

            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Your dedication is legendary, Hero! Keep the flame alive to earn massive XP multipliers.
            </p>

            <button 
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              CONTINUE QUEST
            </button>

            {/* Subtle Close Cross */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StreakAlert;