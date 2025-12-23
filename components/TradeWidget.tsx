
import React, { useState } from 'react';
import { Stock, UserState } from '../types';

interface TradeWidgetProps {
  stock: Stock;
  user: UserState;
  onTrade: (symbol: string, shares: number, type: 'BUY' | 'SELL', stopLoss?: number, takeProfit?: number) => void;
}

const TradeWidget: React.FC<TradeWidgetProps> = ({ stock, user, onTrade }) => {
  const [shares, setShares] = useState<number>(1);
  const [executionFlash, setExecutionFlash] = useState<'BUY' | 'SELL' | null>(null);
  
  // Advanced Order State
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slValue, setSlValue] = useState<string>('');
  const [tpValue, setTpValue] = useState<string>('');
  
  const totalCost = shares * stock.price;
  const currentPosition = user.portfolio.find(p => p.symbol === stock.symbol);
  const ownedShares = currentPosition?.shares || 0;

  const handleTrade = (type: 'BUY' | 'SELL') => {
    if (shares <= 0) return;
    
    const sl = slEnabled && slValue ? parseFloat(slValue) : undefined;
    const tp = tpEnabled && tpValue ? parseFloat(tpValue) : undefined;

    // Basic validation
    if (type === 'BUY' && sl && sl >= stock.price) {
      alert("Risk Parameter Error: Stop-Loss must be below entry price.");
      return;
    }
    if (type === 'BUY' && tp && tp <= stock.price) {
      alert("Risk Parameter Error: Take-Profit must be above entry price.");
      return;
    }

    onTrade(stock.symbol, shares, type, sl, tp);
    
    setExecutionFlash(type);
    setTimeout(() => setExecutionFlash(null), 150);
  };

  const setMaxBuy = () => {
    const max = Math.floor(user.balance / stock.price);
    setShares(max > 0 ? max : 1);
  };

  const setMaxSell = () => {
    setShares(ownedShares > 0 ? ownedShares : 1);
  };

  return (
    <div className={`bg-[#0b1120]/60 border rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-150 ${
      executionFlash === 'BUY' ? 'border-emerald-500 scale-[0.99] bg-emerald-500/10' : 
      executionFlash === 'SELL' ? 'border-rose-500 scale-[0.99] bg-rose-500/10' : 
      'border-slate-700/50'
    }`}>
      <div className={`py-2.5 px-6 text-center text-white text-[9px] font-black tracking-[0.3em] uppercase transition-colors ${
        executionFlash === 'BUY' ? 'bg-emerald-600' : 
        executionFlash === 'SELL' ? 'bg-rose-600' : 
        'bg-gradient-to-r from-blue-700 to-indigo-800'
      }`}>
        {executionFlash ? 'EXECUTION SUCCESS' : 'Execution Terminal'}
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Focus</span>
            <span className="text-xl font-black text-white tracking-tighter truncate">{stock.symbol}</span>
          </div>
          <div className="text-right flex flex-col shrink-0">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Quote</span>
            <span className="text-xl font-mono font-bold text-white">${stock.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 flex justify-between items-center gap-2">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Holding</span>
            <span className="text-xs font-bold text-white truncate">{ownedShares} Units</span>
          </div>
          <div className="flex flex-col text-right overflow-hidden">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Available</span>
            <span className="text-xs font-bold text-emerald-400 truncate">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Quantity Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Order Amount</label>
            <div className="flex gap-2">
              <button onClick={setMaxBuy} className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors">Max Buy</button>
              <button onClick={setMaxSell} className="text-[8px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors">Max Sell</button>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border-slate-800 rounded-xl py-3 px-4 text-lg font-bold text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-700 uppercase">Units</span>
          </div>
        </div>

        {/* Risk Management Fields */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Stop Loss</label>
              <button 
                onClick={() => setSlEnabled(!slEnabled)}
                className={`w-6 h-3 rounded-full relative transition-colors ${slEnabled ? 'bg-rose-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${slEnabled ? 'left-3.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <input
              type="number"
              disabled={!slEnabled}
              placeholder="0.00"
              value={slValue}
              onChange={(e) => setSlValue(e.target.value)}
              className="w-full bg-slate-950 border-slate-800 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono font-bold text-rose-400 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Take Profit</label>
              <button 
                onClick={() => setTpEnabled(!tpEnabled)}
                className={`w-6 h-3 rounded-full relative transition-colors ${tpEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${tpEnabled ? 'left-3.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <input
              type="number"
              disabled={!tpEnabled}
              placeholder="0.00"
              value={tpValue}
              onChange={(e) => setTpValue(e.target.value)}
              className="w-full bg-slate-950 border-slate-800 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono font-bold text-emerald-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center px-1 pt-2">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Est. Impact</span>
          <span className="text-sm font-black text-white tracking-tight">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleTrade('BUY')}
            className="group relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all py-3 rounded-xl shadow-xl shadow-emerald-500/10"
          >
            <span className="relative z-10 text-white font-black text-[10px] uppercase tracking-[0.1em]">Market Buy</span>
          </button>
          
          <button
            onClick={() => handleTrade('SELL')}
            className="group relative overflow-hidden bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all py-3 rounded-xl shadow-xl shadow-rose-500/10"
          >
            <span className="relative z-10 text-white font-black text-[10px] uppercase tracking-[0.1em]">Market Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeWidget;
