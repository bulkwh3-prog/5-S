import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Star, CheckCircle, Sparkles } from "lucide-react";

export function playChimeSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a delightful sweet retro chime
    // Note 1: C5 to C6 pitch slide
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.15); // C6
    
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.3);
    
    // Note 2: E5 to E6 pitch slide, slightly delayed for a sweeping arpeggio
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.15); // E6
      
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 100);

    // Note 3: G5 to G6 pitch slide, adding extra warmth
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      osc3.frequency.exponentialRampToValueAtTime(1567.98, audioCtx.currentTime + 0.2); // G6
      
      gain3.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.start();
      osc3.stop(audioCtx.currentTime + 0.3);
    }, 200);
  } catch (e) {
    console.warn("Web Audio Context not active or blocked:", e);
  }
}

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  submitterName: string;
}

export function CelebrationPopup({ isOpen, onClose, submitterName }: CelebrationPopupProps) {
  useEffect(() => {
    if (isOpen) {
      playChimeSound();
      
      // Auto close after 3.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Generate random positions for background spark elements
  const sparkles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i * 360) / 12,
    delay: i * 0.05,
    distance: Math.random() * 80 + 70,
    size: Math.random() * 12 + 6,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="celebration-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950 cursor-pointer"
          />

          {/* Centered card content */}
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", damping: 15 } }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl border border-pink-100"
          >
            {/* Absolute golden beams background effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none" />

            {/* Sparkles radiating out */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-1 h-1">
              {sparkles.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.2, 0],
                    x: Math.cos((spark.angle * Math.PI) / 180) * spark.distance,
                    y: Math.sin((spark.angle * Math.PI) / 180) * spark.distance,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: spark.delay,
                    ease: "easeOut",
                  }}
                  className="absolute"
                  style={{
                    width: spark.size,
                    height: spark.size,
                  }}
                >
                  <Sparkles
                    className="w-full h-full text-pink-400 fill-pink-300"
                    style={{ transform: `rotate(${spark.angle}deg)` }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Icon Banner */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-100 text-pink-600 mb-6 relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Award className="h-14 w-14 text-pink-600 fill-pink-50" />
              </motion.div>
              <motion.div
                animate={{
                  y: [-10, 10],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
                className="absolute -top-1 -right-1"
              >
                <Star className="h-6 w-6 text-amber-400 fill-amber-300" />
              </motion.div>
            </div>

            {/* Celebratory text */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
              className="text-3xl font-black text-slate-900 tracking-tight"
            >
              ส่งรายงานสำเร็จ!
            </motion.h2>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, type: "spring" } }}
              className="my-5 inline-block rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 text-white shadow-lg shadow-pink-500/30"
            >
              <div className="flex items-center gap-2 font-black text-2xl tracking-wide">
                <Sparkles className="h-6 w-6 text-yellow-300 fill-yellow-300 animate-pulse" />
                <span>+10 Points!</span>
                <Sparkles className="h-6 w-6 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
              className="text-slate-600 font-bold text-base px-2 leading-relaxed"
            >
              ยอดเยี่ยมมากคุณ <span className="text-pink-600 font-black underline decoration-wavy decoration-pink-300">{submitterName}</span>
              <br />
              ช่วยดูแลพื้นที่ให้สะอาดเอี่ยมอ่องอยู่เสมอ ✨
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              className="mt-8"
            >
              <button
                id="close-celebration-btn"
                onClick={onClose}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 px-6 font-black text-white transition hover:opacity-95 active:scale-95 cursor-pointer shadow-md shadow-indigo-100"
              >
                รับแต้มและทำงานต่อ
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
