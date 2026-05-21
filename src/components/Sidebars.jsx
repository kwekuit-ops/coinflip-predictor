import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, TrendingUp, Users } from 'lucide-react';

export const HistorySidebar = ({ history }) => {
  return (
    <div className="glass-panel h-full w-20 flex flex-col items-center py-6 gap-4 border-r border-casino-border">
      <div className="bg-primary/10 p-2 rounded-lg border border-primary/30 mb-2">
        <History className="w-5 h-5 text-primary" />
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pb-10">
        <AnimatePresence>
          {history.map((res, i) => (
            <motion.div
              key={`${res}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg ${
                res === 'HEADS' 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              {res[0]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const LiveActivity = () => {
  const [players, setPlayers] = React.useState([]);

  React.useEffect(() => {
    const names = ['CryptoWhale', 'DegenKing', 'Satoshi77', 'MoonShooter', 'LuckyAce', 'CoinFlipPro', 'VegasVibes', 'AlphaTrader'];
    
    const interval = setInterval(() => {
      const newPlayer = {
        id: Date.now(),
        name: names[Math.floor(Math.random() * names.length)],
        amount: (Math.random() * 5).toFixed(2),
        side: Math.random() > 0.5 ? 'HEADS' : 'TAILS',
        win: Math.random() > 0.4
      };
      
      setPlayers(prev => [newPlayer, ...prev].slice(0, 8));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel h-full w-64 hidden lg:flex flex-col p-4 border-l border-casino-border">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold tracking-widest text-white uppercase">Live Players</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400">{p.name}</span>
                <span className={`text-[10px] font-mono ${p.side === 'HEADS' ? 'text-primary' : 'text-white/60'}`}>{p.side}</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold font-mono text-white">${p.amount}</div>
                <div className={`text-[9px] ${p.win ? 'text-primary' : 'text-red-500'}`}>
                  {p.win ? 'WIN' : 'LOSS'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
