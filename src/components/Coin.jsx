import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import coinImg from '../assets/coin.png';

const Coin = ({ result, isSpinning }) => {
  const [flipY, setFlipY] = useState(-64);

  useEffect(() => {
    const update = () => {
      setFlipY(window.innerWidth < 640 || window.innerHeight < 700 ? -64 : -110);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const compact = flipY > -90;

  return (
    <div className="coin-container relative flex items-center justify-center w-full max-w-[min(100%,280px)] mx-auto">
      <div className="absolute green-radial-glow rounded-full pointer-events-none" />

      <motion.div
        className="coin relative z-10"
        animate={
          isSpinning
            ? {
                rotateY: [0, 1800, 3600],
                y: [0, flipY, 0],
                scale: [1, compact ? 1.06 : 1.12, 1],
              }
            : result === 'HEAD'
              ? { rotateY: 0, scale: 1 }
              : { rotateY: 180, scale: 1 }
        }
        transition={
          isSpinning
            ? { duration: 3, ease: [0.45, 0.05, 0.55, 0.95] }
            : { duration: 0.8, type: 'spring', stiffness: 100, damping: 12 }
        }
      >
        <div className="coin-face overflow-hidden border-[4px] sm:border-[5px] border-amber-500/25">
          <img src={coinImg} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="coin-label rounded-full border border-amber-400/40 flex items-center justify-center bg-gradient-to-br from-amber-500/25 to-amber-900/50 shadow-[0_0_24px_rgba(234,179,8,0.25)]">
              <span className="font-display coin-label-text font-black text-amber-300 tracking-widest">
                HEAD
              </span>
            </div>
          </div>
        </div>

        <div className="coin-face coin-tails overflow-hidden border-[4px] sm:border-[5px] border-cyan-500/25 bg-[#141418]">
          <img
            src={coinImg}
            alt=""
            draggable={false}
            className="w-full h-full object-cover brightness-[0.45] contrast-[1.15] grayscale"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <div className="coin-label rounded-full border border-cyan-400/40 flex items-center justify-center bg-gradient-to-br from-cyan-500/25 to-cyan-900/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
              <span className="font-display coin-label-text font-black text-cyan-300 tracking-widest">
                TAIL
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Coin;
