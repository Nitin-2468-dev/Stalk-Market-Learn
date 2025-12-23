
import React, { useMemo, useState, useEffect } from 'react';
import { UserState, Stock, TimeRange } from '../types';
import TradingChart from './TradingChart';
import TradeWidget from './TradeWidget';
import { analyzeMarketDynamics } from '../services/geminiService';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

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

  const runDiagnostic = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const insight = await analyzeMarketDynamics(selectedStock.symbol, selectedStock.history);
      setAiAnalysis(insight);
    } catch (e) {
      setAiAnalysis("ERR: Critical failure in data ingestion.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* Refined Technical Header Stats Unit with Icons */}
      <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
              <span className="material-icons-outlined text-blue-500 text-3xl">terminal</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                Command Center
                <div className="flex items-center gap-2 bg-emerald-600/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] not-italic tracking-widest font-black uppercase">Live Node</span>
                </div>
              </h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Environment Alpha | v5.2 Optimized</p>
            </div>
          </div>
          
          {/* HUD Metadata Matrix with Icons */}
          <div className="hidden min-[1400px]:grid grid-cols-2 gap-x-8 gap-y-2 border-l border-slate-800 pl-8">
             <div className="flex items-center gap-3">
               <span className="material-icons-outlined text-[12px] text-emerald-500">sync</span>
               <div className="flex flex-col">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Status</span>
                 <span className="text-[8px] font-bold text-white uppercase">Synchronized</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <span className="material-icons-outlined text-[12px] text-blue-500">router</span>
               <div className="flex flex-col">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Network</span>
                 <span className="text-[8px] font-bold text-white uppercase">Alpha Core</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-[#0b1120]/60 backdrop-blur-xl border border-slate-800/50 p-5 rounded-2xl min-w-[200px] shadow-2xl group hover:border-blue-500/30 transition-colors">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-between items-center">
              Total Valuation
              <span className="material-icons-outlined text-[10px] text-blue-500">account_balance_wallet</span>
            </p>
            <p className="text-2xl font-black text-white tracking-tight font-mono">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#0b1120]/60 backdrop-blur-xl border border-slate-800/50 p-5 rounded-2xl min-w-[150px] shadow-2xl group hover:border-emerald-500/30 transition-colors">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex justify-between items-center">
              Performance
              <span className={`material-icons-outlined text-[10px] ${stats.lifetimeGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.lifetimeGain >= 0 ? 'trending_up' : 'trending_down'}
              </span>
            </p>
            <p className={`text-2xl font-black tracking-tight font-mono ${stats.lifetimeGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.lifetimeGain >= 0 ? '+' : ''}{stats.lifetimeGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Panoramic Horizontal Asset Bar */}
      <div className="bg-[#0b1120]/40 backdrop-blur-md border border-slate-800/50 rounded-[2rem] p-3 flex gap-4 overflow-x-auto hide-scrollbar shadow-2xl w-full">
        {stocks.map(s => (
          <button
            key={s.symbol}
            onClick={() => onSelectStock(s.symbol)}
            className={`flex-shrink-0 flex items-center gap-6 px-8 py-4 rounded-2xl transition-all duration-300 border ${selectedStock.symbol === s.symbol ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/30' : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800/80 hover:border-slate-700'}`}
          >
            <span className={`text-xs font-black tracking-[0.2em] ${selectedStock.symbol === s.symbol ? 'text-white' : 'text-slate-500'}`}>{s.symbol}</span>
            <div className="text-right">
              <p className={`text-sm font-mono font-black ${selectedStock.symbol === s.symbol ? 'text-white' : 'text-slate-200'}`}>${s.price.toFixed(2)}</p>
              <p className={`text-[10px] font-black ${selectedStock.symbol === s.symbol ? 'text-blue-100' : s.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {s.change >= 0 ? '+' : ''}{s.changePercent.toFixed(1)}%
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Row 1: Full-Width Panoramic Chart */}
      <div className="w-full">
        <div className="bg-[#0b1120] rounded-[3rem] border border-slate-800/50 shadow-2xl p-8 lg:p-12 relative overflow-hidden group w-full">
          <div className={`absolute -top-64 -right-64 w-[500px] h-[500px] blur-[150px] opacity-20 transition-all duration-700 ${selectedStock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="flex items-center gap-8 min-w-0">
              <div className="overflow-hidden">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase truncate leading-none italic">{selectedStock.name}</h2>
                <div className="flex items-center gap-6 mt-4">
                  <span className={`text-5xl font-mono font-black tracking-tighter transition-all duration-75 ${priceFlash === 'UP' ? 'text-emerald-400 scale-105' : priceFlash === 'DOWN' ? 'text-rose-400 scale-105' : 'text-white'}`}>
                    ${selectedStock.price.toFixed(2)}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-black px-3 py-1 rounded-xl ${selectedStock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {selectedStock.change >= 0 ? '▲' : '▼'} {Math.abs(selectedStock.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner">
              {(['1D', '1W', '1M', '3M', 'ALL'].map(r => (
                <button
                  key={r}
                  onClick={() => onRangeChange(r as TimeRange)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRange === r ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  {r}
                </button>
              )))}
            </div>
          </div>

          <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-slate-900 bg-slate-950/40 p-1 shadow-inner relative transition-all duration-500">
            <TradingChart data={selectedStock.history} />
          </div>

          <div className="mt-12 grid grid-cols-4 gap-12 px-4 relative z-10 border-t border-slate-800/50 pt-8">
            <div className="flex items-start gap-4">
               <span className="material-icons-outlined text-slate-600 text-lg">assessment</span>
               <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Trading Volume</p>
                <p className="text-lg font-black text-white font-mono tracking-tight">{selectedStock.volume}</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <span className="material-icons-outlined text-slate-600 text-lg">pie_chart</span>
               <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Market Cap</p>
                <p className="text-lg font-black text-white font-mono tracking-tight">{selectedStock.marketCap}</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <span className="material-icons-outlined text-emerald-600 text-lg">bolt</span>
               <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Buying Power</p>
                <p className="text-lg font-black text-emerald-400 font-mono tracking-tight">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
               </div>
            </div>
            <div className="flex items-start gap-4 justify-end">
               <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Node Latency</p>
                <p className="text-lg font-black text-blue-400 font-mono tracking-tight">0.8ms</p>
               </div>
               <span className="material-icons-outlined text-blue-600 text-lg">speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Trade Widget & Intelligence Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8">
          <TradeWidget stock={selectedStock} user={user} onTrade={onTrade} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Intelligence Terminal */}
          <div className="bg-[#0b1120]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col overflow-hidden group min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-3">
                 <span className="material-icons-outlined text-sm">psychology</span>
                 Market Intelligence
              </h2>
              <button 
                onClick={runDiagnostic}
                disabled={isAnalyzing}
                className="p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-50"
              >
                <span className={`material-icons-outlined text-blue-500 text-lg ${isAnalyzing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            </div>

            <div className="flex-1 bg-black/40 rounded-2xl border border-slate-800/50 p-6 relative overflow-hidden">
               {isAnalyzing ? (
                 <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-12 h-1 bg-blue-500 animate-[pulse_1s_infinite]"></div>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em] animate-pulse">Scanning Signals...</span>
                 </div>
               ) : aiAnalysis ? (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                   <p className="text-[11px] font-mono text-emerald-400/90 leading-relaxed uppercase tracking-tight">
                     {aiAnalysis}
                   </p>
                   <div className="mt-4 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Diagnostic Complete</span>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
                    <span className="material-icons-outlined text-4xl">radar</span>
                    <button 
                      onClick={runDiagnostic}
                      className="text-[9px] font-black uppercase tracking-widest border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Initialize Diagnostic
                    </button>
                 </div>
               )}
            </div>
          </div>

          <div className="bg-[#0b1120]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 px-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <span className="material-icons-outlined text-slate-500 text-sm">history_edu</span>
                 Order Journal
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </h2>
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {user.history.length === 0 ? (
                <div className="text-center py-12 opacity-20 flex flex-col items-center">
                  <span className="material-icons-outlined text-3xl mb-3">list_alt</span>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Awaiting execution...</p>
                </div>
              ) : (
                user.history.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 group animate-in slide-in-from-right-4 duration-500">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-2xl ${tx.type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {tx.type[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate leading-tight uppercase tracking-tighter">{tx.symbol}</p>
                      <p className="text-[8px] font-bold text-slate-500 leading-none mt-1">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white">{tx.shares} UN</p>
                      <p className="text-[9px] font-mono text-slate-500">${tx.price.toFixed(2)}</p>
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
