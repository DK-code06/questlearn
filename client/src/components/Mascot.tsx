import { motion, easeInOut } from 'framer-motion';

interface MascotProps {
  mood: 'idle' | 'happy' | 'sad';
}

const Mascot = ({ mood }: MascotProps) => {
  // We use DiceBear API to get different robot faces based on mood
  const getAvatarUrl = () => {
    const seed = mood === 'happy' ? 'Felix' : mood === 'sad' ? 'Chester' : 'Aneka';
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}&eyes=${mood === 'happy' ? 'roundFrame02' : mood === 'sad' ? 'shade01' : 'roundFrame01'}&mouth=${mood === 'happy' ? 'smile02' : mood === 'sad' ? 'square02' : 'square01'}`;
  };

  // Animation Variants
  const variants = {
    idle: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 2, ease: easeInOut } }, // Floating
    happy: { y: [0, -20, 0], scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], transition: { repeat: Infinity, duration: 0.5 } }, // Jumping
    sad: { x: [0, -10, 10, -10, 10, 0], rotate: [0, -5, 5, 0], transition: { duration: 0.5 } } // Shaking head
  };

  return (
    <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
        {/* Speech Bubble (Optional) */}
        <div className="absolute -top-6 -right-12 bg-white text-black text-xs font-bold px-3 py-1 rounded-xl rounded-bl-none shadow-lg animate-bounce">
            {mood === 'idle' && "Your turn!"}
            {mood === 'happy' && "Awesome!"}
            {mood === 'sad' && "Oops..."}
        </div>

        {/* The Character */}
        <motion.img 
            key={mood} // Re-render animation when mood changes
            src={getAvatarUrl()} 
            alt="Mascot"
            className="w-full h-full drop-shadow-2xl"
            variants={variants}
            animate={mood}
        />
    </div>
  );
};

export default Mascot;