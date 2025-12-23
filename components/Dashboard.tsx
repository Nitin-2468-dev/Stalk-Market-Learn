
import React, { useMemo, useState, useEffect } from 'react';
import { UserState, Stock, TimeRange } from '../types';
import TradingChart from './TradingChart';
import TradeWidget from './TradeWidget';

interface DashboardProps {
  user: UserState;
  stocks: Stock[];
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  selectedStock: Stock;
  onSelectStock: (symbol: string) => void;
  onTrade: (symbol: string, shares: number, type: 'BUY' | 'SELL') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  stocks, 
  selectedRange, 
  onRangeChange, 
  selectedStock, 
  onSelectStock,
  onTrade 
}) => {
  const [prevPrice, setPrevPrice] = useState(selectedStock.price);
  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const marketValue = user.portfolio.reduce((total, item) => {
      const stock = stocks.find(s => s.symbol === item.symbol);
      return total + (stock ? stock.price * item.shares : 0);
    }, 0);
    
    const totalValue = marketValue + user.balance;
    const initialDeposit = 100000;
    const lifetimeGain = totalValue - initialDeposit;
    const lifetimeGainPercent = (lifetimeGain / initialDeposit) * 100;

    return { totalValue, marketValue, lifetimeGain, lifetimeGainPercent };
  }, [user.portfolio, user.balance, stocks]);

  // Flash effect on price change
  useEffect(() => {
    if (selectedStock.price > prevPrice) {
      setPriceFlash('UP');
    } else if (selectedStock.price < prevPrice) {
      setPriceFlash('DOWN');
    }
    const timer = setTimeout(() => setPriceFlash(null), 100);
    setPrevPrice(selectedStock.price);
    return () => clearTimeout(timer);
  }, [selectedStock.price]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            Command Center
            <span className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full not-italic tracking-widest border border-emerald-500/20 font-black">ACTIVE</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">Cockpit v4.2 | Real-Time Execution</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-surface/30 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl min-w-[160px] shadow-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Valuation</p>
            <p className="text-xl font-black text-white tracking-tight font-mono">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-surface/30 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl min-w-[160px] shadow-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Session P/L</p>
            <p className={`text-xl font-black tracking-tight font-mono ${stats.lifetimeGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.lifetimeGain >= 0 ? '+' : ''}{stats.lifetimeGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Market Matrix (Asset Switcher) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Market Watch
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {stocks.map(s => (
                <button
                  key={s.symbol}
                  onClick={() => onSelectStock(s.symbol)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border group relative overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 ${selectedStock.symbol === s.symbol ? 'bg-blue-600/10 border-blue-500/50 shadow-inner shadow-blue-500/5' : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/70 hover:border-slate-700'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden z-10">
                    <span className={`w-12 h-9 min-w-[48px] rounded-xl flex items-center justify-center text-[10px] font-black border transition-colors ${s.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {s.symbol}
                    </span>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-xs font-black text-slate-500 tracking-tight truncate w-full group-hover:text-white transition-colors uppercase">{s.symbol}</span>
                    </div>
                  </div>
                  <div className="text-right z-10">
                    <p className="text-[11px] font-bold text-white font-mono">${s.price.toFixed(2)}</p>
                    <p className={`text-[9px] font-black ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.change >= 0 ? '+' : ''}{Math.abs(s.changePercent).toFixed(1)}%
                    </p>
                  </div>
                  {selectedStock.symbol === s.symbol && <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Main Terminal Display */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-surface rounded-[2.5rem] border border-slate-700/50 shadow-2xl p-8 relative overflow-hidden group">
            {/* Ambient Background Glow based on sentiment */}
            <div className={`absolute -top-32 -right-32 w-80 h-80 blur-[120px] opacity-20 transition-all duration-700 ${selectedStock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-5 min-w-0">
                <div className={`w-20 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl border-2 shadow-2xl transition-all duration-300 ${selectedStock.change >= 0 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10' : 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-rose-500/10'}`}>
                  {selectedStock.symbol}
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase truncate leading-none">{selectedStock.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-2xl font-mono font-black tracking-tighter transition-all duration-75 ${priceFlash === 'UP' ? 'text-emerald-400 scale-105' : priceFlash === 'DOWN' ? 'text-rose-400 scale-105' : 'text-white'}`}>
                      ${selectedStock.price.toFixed(2)}
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${selectedStock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {selectedStock.change >= 0 ? '▲' : '▼'} {Math.abs(selectedStock.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                {(['1D', '1W', '1M', '3M'].map(r => (
                  <button
                    key={r}
                    onClick={() => onRangeChange(r as TimeRange)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRange === r ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    {r}
                  </button>
                )))}
              </div>
            </div>

            <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-2 shadow-inner relative">
              <TradingChart data={selectedStock.history} />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 px-2 relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Asset Liquidity</p>
                <p className="text-sm font-bold text-white font-mono tracking-tight">{selectedStock.volume}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Market Valuation</p>
                <p className="text-sm font-bold text-white font-mono tracking-tight">{selectedStock.marketCap}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Execution Power</p>
                <p className="text-sm font-bold text-emerald-400 font-mono tracking-tight">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Execution Terminal & Tape */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <TradeWidget stock={selectedStock} user={user} onTrade={onTrade} />

          <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl flex-1 flex flex-col overflow-hidden max-h-[350px]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-2 flex items-center justify-between">
              Real-Time Tape
              <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500"></span>
            </h2>
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              {user.history.length === 0 ? (
                <div className="text-center py-12 opacity-20">
                  <span className="material-icons-outlined text-4xl block mb-2">history_toggle_off</span>
                  <p className="text-[9px] font-black uppercase tracking-widest">Awaiting execution signals...</p>
                </div>
              ) : (
                user.history.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 group animate-in slide-in-from-right-2 duration-300">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg ${tx.type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {tx.type[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white truncate leading-tight uppercase tracking-tighter">{tx.symbol}</p>
                      <p className="text-[8px] font-bold text-slate-500 leading-none mt-0.5">{new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white">{tx.shares} UNITS</p>
                      <p className="text-[9px] font-mono text-slate-500">@${tx.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
