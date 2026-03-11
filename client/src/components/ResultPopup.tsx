import { X, Trophy, Skull } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";

interface Props {
  isWinner: boolean;
  winnerName: string | null;
  onClose: () => void;
}

const ResultPopup = ({ isWinner, winnerName, onClose }: Props) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate("/student/dashboard");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      {isWinner && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      
      <div className={`relative w-[500px] p-10 rounded-[3rem] shadow-2xl text-center border-4 ${isWinner ? 'bg-yellow-900/20 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'bg-red-900/20 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]'}`}>
        
        <button onClick={handleClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition">
          <X size={24} />
        </button>

        <div className="flex justify-center mb-6">
          {isWinner ? <Trophy size={80} className="text-yellow-500 animate-bounce" /> : <Skull size={80} className="text-red-500" />}
        </div>

        <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">
          {isWinner ? "VICTORY ACHIEVED" : "MISSION FAILED"}
        </h2>

        {isWinner ? (
          <p className="text-yellow-400 font-bold text-lg mb-8 uppercase tracking-widest">
            You conquered the arena!
          </p>
        ) : (
          <p className="text-red-400 font-bold text-lg mb-8 uppercase tracking-widest">
            {winnerName ? `${winnerName} secured the objective.` : "Defeated by the compiler."}
          </p>
        )}

        <button
          onClick={handleClose}
          className={`w-full font-black py-4 rounded-2xl uppercase tracking-widest transition-all hover:scale-105 ${isWinner ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-600 text-white hover:bg-red-500'}`}
        >
          Return to Hub
        </button>
      </div>
    </div>
  );
};

export default ResultPopup;