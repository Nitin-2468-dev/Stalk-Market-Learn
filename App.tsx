
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Page, UserState, Stock, TimeRange, HistoryPoint } from './types';
import { INITIAL_BALANCE, MOCK_STOCKS, ALL_BADGES } from './constants';
import Dashboard from './components/Dashboard';
import TradeWidget from './components/TradeWidget';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const generateOHLC = useCallback((basePrice: number, range: TimeRange, symbol: string): HistoryPoint[] => {
    const pointsCount = range === '1D' ? 60 : range === '1W' ? 80 : 100;
    let currentPrice = basePrice * (0.95 + Math.random() * 0.1);
    
    const history = Array.from({ length: pointsCount }, (_, i) => {
      const volatility = 0.015;
      const change = currentPrice * volatility * (Math.random() - 0.45); 
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + (Math.random() * currentPrice * 0.002);
      const low = Math.min(open, close) - (Math.random() * currentPrice * 0.002);
      const volume = Math.floor(Math.random() * 5000) + 1000;
      
      currentPrice = close;
      
      let label = '';
      if (range === '1D') label = `${Math.floor(i / 2) + 9}:${(i % 2) * 30 || '00'}`;
      else label = `T-${pointsCount - i}`;

      return { time: label, open, high, low, close, volume };
    });
    
    return history;
  }, []);

  const [stocks, setStocks] = useState<Stock[]>(() => 
    MOCK_STOCKS.map(s => ({
      ...s,
      history: generateOHLC(s.price, '1M', s.symbol)
    }))
  );

  const [user, setUser] = useState<UserState>({
    balance: INITIAL_BALANCE,
    portfolio: [],
    xp: 0,
    level: 1,
    history: [],
    badges: [],
  });
  
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>(stocks[0].symbol);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

  const activeStock = useMemo(() => 
    stocks.find(s => s.symbol === selectedStockSymbol) || stocks[0], 
    [stocks, selectedStockSymbol]
  );

  useEffect(() => {
    setStocks(prev => prev.map(s => ({
      ...s,
      history: generateOHLC(s.price, selectedRange, s.symbol)
    })));
  }, [selectedRange, generateOHLC]);

  // High Frequency Simulation Logic + Automated Order Monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        const nextStocks = prevStocks.map(stock => {
          const volatility = 0.0004; 
          const move = stock.price * volatility * (Math.random() - 0.48); 
          const newPrice = Math.max(0.01, stock.price + move);
          
          const updatedHistory = [...stock.history];
          if (updatedHistory.length > 0) {
            const lastIdx = updatedHistory.length - 1;
            const last = { ...updatedHistory[lastIdx] };
            last.close = newPrice;
            last.high = Math.max(last.high, newPrice);
            last.low = Math.min(last.low, newPrice);
            last.volume += Math.floor(Math.random() * 10);
            updatedHistory[lastIdx] = last;
          }

          return {
            ...stock,
            price: newPrice,
            change: stock.change + move,
            changePercent: (stock.change + move) / (stock.price - (stock.change + move)) * 100,
            history: updatedHistory
          };
        });

        // Trigger Automated Order Check
        setUser(currentUser => {
          let updatedUser = { ...currentUser };
          let userChanged = false;

          currentUser.portfolio.forEach(pos => {
            const currentStock = nextStocks.find(s => s.symbol === pos.symbol);
            if (!currentStock) return;

            const isSlHit = pos.stopLoss && currentStock.price <= pos.stopLoss;
            const isTpHit = pos.takeProfit && currentStock.price >= pos.takeProfit;

            if (isSlHit || isTpHit) {
              const totalVal = currentStock.price * pos.shares;
              
              updatedUser.balance += totalVal;
              updatedUser.portfolio = updatedUser.portfolio.filter(p => p.symbol !== pos.symbol);
              updatedUser.history = [{
                id: Math.random().toString(36).substr(2, 9),
                symbol: pos.symbol,
                type: 'AUTO_SELL',
                shares: pos.shares,
                price: currentStock.price,
                timestamp: Date.now()
              }, ...updatedUser.history];
              updatedUser.xp += 200; 
              userChanged = true;
            }
          });

          return userChanged ? updatedUser : currentUser;
        });

        return nextStocks;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = (symbol: string, shares: number, type: 'BUY' | 'SELL', stopLoss?: number, takeProfit?: number) => {
    const stockIndex = stocks.findIndex(s => s.symbol === symbol);
    if (stockIndex === -1) return;
    const stock = stocks[stockIndex];
    const totalCost = stock.price * shares;

    if (type === 'BUY') {
      if (user.balance < totalCost) {
        alert("Execution Error: Insufficient funds.");
        return;
      }
      setUser(prev => {
        const existing = prev.portfolio.find(p => p.symbol === symbol);
        let newPortfolio;
        if (existing) {
          newPortfolio = prev.portfolio.map(p => 
            p.symbol === symbol 
              ? { 
                  ...p, 
                  shares: p.shares + shares, 
                  avgCost: (p.avgCost * p.shares + totalCost) / (p.shares + shares),
                  stopLoss: stopLoss || p.stopLoss,
                  takeProfit: takeProfit || p.takeProfit
                } 
              : p
          );
        } else {
          newPortfolio = [...prev.portfolio, { symbol, shares, avgCost: stock.price, stopLoss, takeProfit }];
        }
        const newXp = prev.xp + 100;
        return {
          ...prev,
          balance: prev.balance - totalCost,
          portfolio: newPortfolio,
          history: [{ id: Math.random().toString(36).substr(2, 9), symbol, type, shares, price: stock.price, timestamp: Date.now(), stopLoss, takeProfit }, ...prev.history],
          xp: newXp,
          level: Math.floor(newXp / 1000) + 1
        };
      });
    } else {
      const pos = user.portfolio.find(p => p.symbol === symbol);
      if (!pos || pos.shares < shares) {
        alert("Execution Error: Insufficient shares.");
        return;
      }
      setUser(prev => {
        const newXp = prev.xp + 150;
        return {
          ...prev,
          balance: prev.balance + totalCost,
          portfolio: prev.portfolio.map(p => p.symbol === symbol ? { ...p, shares: p.shares - shares } : p).filter(p => p.shares > 0),
          history: [{ id: Math.random().toString(36).substr(2, 9), symbol, type, shares, price: stock.price, timestamp: Date.now() }, ...prev.history],
          xp: newXp,
          level: Math.floor(newXp / 1000) + 1
        };
      });
    }

    const impactFactor = 0.0002; 
    const priceChange = type === 'BUY' ? stock.price * impactFactor * (shares / 5) : -stock.price * impactFactor * (shares / 5);
    const newPrice = Math.max(0.01, stock.price + priceChange);

    setStocks(prev => prev.map(s => {
      if (s.symbol === symbol) {
        const updatedHistory = [...s.history];
        if (updatedHistory.length > 0) {
          const lastIdx = updatedHistory.length - 1;
          const last = { ...updatedHistory[lastIdx] };
          last.close = newPrice;
          last.high = Math.max(last.high, newPrice);
          last.low = Math.min(last.low, newPrice);
          updatedHistory[lastIdx] = last;
        }
        return { ...s, price: newPrice, history: updatedHistory };
      }
      return s;
    }));
  };

  const performReset = useCallback(() => {
    setIsResetting(true);
    setTimeout(() => {
      setUser({
        balance: INITIAL_BALANCE,
        portfolio: [],
        xp: 0,
        level: 1,
        history: [],
        badges: [],
      });
      setStocks(MOCK_STOCKS.map(s => ({
        ...s,
        history: generateOHLC(s.price, selectedRange, s.symbol)
      })));
      setSelectedStockSymbol(MOCK_STOCKS[0].symbol);
      setIsResetting(false);
      setResetConfirm(false);
    }, 800);
  }, [generateOHLC, selectedRange]);

  const handleResetClick = () => {
    if (resetConfirm) {
      performReset();
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Reset Overlay */}
      {isResetting && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center space-y-4 animate-pulse">
           <span className="material-symbols-outlined text-rose-500 text-6xl animate-spin">restart_alt</span>
           <h2 className="text-rose-500 font-black tracking-[0.5em] uppercase italic">Wiping Terminal Data...</h2>
        </div>
      )}

      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-[#0b1120] border border-blue-500/20 rounded-[3rem] max-w-lg w-full p-12 shadow-2xl relative overflow-hidden text-center space-y-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600"></div>
            <div className="bg-blue-500/10 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-blue-400 border border-blue-500/20">
              <span className="material-symbols-outlined text-4xl">terminal</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Execution Terminal</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                High-Frequency Execution Suite. Real-time market impact enabled. Initialize your virtual $100k node.
              </p>
            </div>
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs"
            >
              Access Command
            </button>
          </div>
        </div>
      )}

      {/* Ticker Tape */}
      <div className="bg-slate-950 border-b border-slate-900/50 h-14 relative z-50 overflow-hidden flex items-center shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <div className="absolute left-0 top-0 bottom-0 z-10 bg-slate-950 flex items-center px-6 border-r border-slate-800 shadow-[10px_0_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">Alpha Stream</span>
          </div>
        </div>
        <div className="inline-flex gap-14 animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] cursor-default pl-[180px]">
          {stocks.concat(stocks).map((s, i) => (
            <div key={`${s.symbol}-${i}`} className="flex items-center gap-4 text-xs font-bold transition-all hover:text-white group">
              <span className="text-slate-600 font-black tracking-widest group-hover:text-blue-400">{s.symbol}</span>
              <span className="text-white font-mono">${s.price.toFixed(2)}</span>
              <span className={`flex items-center gap-1 font-black ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.change >= 0 ? '▲' : '▼'}{Math.abs(s.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#070b14] border-r border-slate-900 hidden lg:flex flex-col p-6 space-y-12 shadow-2xl relative z-40 transition-all duration-300 ease-in-out`}>
          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-4 top-10 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl z-50 hover:bg-blue-500 transition-colors"
          >
            <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`}>chevron_right</span>
          </button>

          {/* Icon Header (No text) */}
          <div className="flex items-center justify-center pt-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-4 rounded-2xl text-white shadow-2xl shadow-blue-500/20">
              <span className="material-symbols-outlined text-3xl">terminal</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2.5">
            {[
              { id: Page.DASHBOARD, icon: 'space_dashboard', label: 'Command' },
              { id: Page.MARKETS, icon: 'analytics', label: 'Terminal' },
              { id: Page.PORTFOLIO, icon: 'account_balance_wallet', label: 'Holdings' },
              { id: Page.LEADERBOARD, icon: 'emoji_events', label: 'Ranks' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center ${isSidebarOpen ? 'justify-start px-6' : 'justify-center px-0'} py-5 rounded-[1.5rem] transition-all font-black text-sm uppercase tracking-[0.15em] relative group ${currentPage === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <span className="material-symbols-outlined text-2xl shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="ml-6 transition-opacity duration-300">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className={`bg-slate-900/40 ${isSidebarOpen ? 'p-6' : 'p-2'} rounded-[2.5rem] border border-slate-800/50 backdrop-blur-2xl transition-all duration-300`}>
             <div className={`flex items-center ${isSidebarOpen ? 'gap-4 mb-6' : 'justify-center mb-0'} transition-all`}>
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-2xl uppercase">
                  AT
                </div>
                {isSidebarOpen && (
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-black text-white tracking-tight truncate w-32">Alex Trader</p>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md mt-1 w-fit">LVL {user.level}</p>
                  </div>
                )}
             </div>
             
             {isSidebarOpen && (
               <>
                 <div className="w-full bg-slate-800/50 rounded-full h-2 mb-3 overflow-hidden shadow-inner p-0.5 mt-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(user.xp % 1000) / 10}%` }}
                    ></div>
                 </div>
                 <p className="text-[8px] text-slate-600 text-center uppercase tracking-[0.4em] font-black">{user.xp % 1000} / 1000 XP</p>
               </>
             )}
             
             <button
               onClick={handleResetClick}
               className={`w-full mt-6 flex items-center justify-center ${isSidebarOpen ? 'gap-3 py-3 px-4' : 'gap-0 p-3'} border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group ${resetConfirm ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
             >
               <span className={`material-symbols-outlined text-sm ${resetConfirm ? 'animate-bounce' : 'group-hover:rotate-180'} transition-transform duration-500`}>
                {resetConfirm ? 'warning' : 'restart_alt'}
               </span>
               {isSidebarOpen && <span>{resetConfirm ? 'Confirm Reset' : 'Reset Node'}</span>}
             </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#05080f] relative scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {currentPage === Page.DASHBOARD ? (
              <Dashboard 
                user={user} 
                stocks={stocks} 
                selectedRange={selectedRange} 
                onRangeChange={setSelectedRange}
                selectedStock={activeStock}
                onSelectStock={setSelectedStockSymbol}
                onTrade={handleTrade}
              />
            ) : currentPage === Page.MARKETS ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="xl:col-span-8 space-y-10">
                   <div className="flex items-center justify-between">
                     <div>
                       <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Asset Terminal</h2>
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Active Surveillance</p>
                     </div>
                     <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-900">
                        {['1D', '1W', '1M', 'ALL'].map((r) => (
                          <button 
                            key={r}
                            onClick={() => setSelectedRange(r as TimeRange)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRange === r ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-600 hover:text-white hover:bg-slate-900'}`}
                          >
                            {r}
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="bg-[#0b1120]/40 backdrop-blur-md rounded-[3rem] border border-slate-900 overflow-hidden shadow-2xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-950/80 text-slate-600 text-[10px] uppercase tracking-[0.4em] font-black border-b border-slate-900">
                          <tr>
                            <th className="p-10">Instrument</th>
                            <th className="p-10 text-right">Quote</th>
                            <th className="p-10 text-right">Volatility</th>
                            <th className="p-10 text-right">Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50">
                          {stocks.map(s => (
                            <tr 
                              key={s.symbol} 
                              onClick={() => setSelectedStockSymbol(s.symbol)}
                              className={`cursor-pointer hover:bg-white/[0.01] transition-all group ${selectedStockSymbol === s.symbol ? 'bg-blue-600/[0.03]' : ''}`}
                            >
                              <td className="p-10">
                                <div className="flex items-center gap-6">
                                  <div className={`w-20 min-w-[80px] h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all border-2 shadow-inner ${s.change >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                                    {s.symbol}
                                  </div>
                                  <div className="flex flex-col overflow-hidden min-w-0">
                                    <span className="font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter text-xl truncate">{s.symbol}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">{s.name}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-10 text-right font-mono font-bold text-white text-xl tracking-tighter">${s.price.toFixed(2)}</td>
                              <td className={`p-10 text-right font-black text-sm ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <div className="flex items-center justify-end gap-2">
                                  <span className="material-symbols-outlined text-sm">{s.change >= 0 ? 'trending_up' : 'trending_down'}</span>
                                  {Math.abs(s.changePercent).toFixed(2)}%
                                </div>
                              </td>
                              <td className="p-10 text-right">
                                <span className="text-slate-500 text-[11px] font-black tracking-[0.2em] bg-slate-950 px-4 py-2 rounded-xl border border-slate-900 uppercase">
                                  {s.volume}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
                <div className="xl:col-span-4 relative">
                  <div className="sticky top-12">
                    <TradeWidget stock={activeStock} user={user} onTrade={handleTrade} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[70vh] space-y-10 animate-in zoom-in-95 duration-700">
                <div className="w-28 h-28 rounded-[2.5rem] bg-[#0b1120] flex items-center justify-center border border-slate-800 shadow-2xl relative">
                  <span className="material-symbols-outlined text-blue-500 text-6xl">settings_input_component</span>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{currentPage} NODE</h3>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-widest max-w-sm mx-auto leading-loose">
                    High-Frequency Simulation in Progress.
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentPage(Page.DASHBOARD)}
                  className="px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 text-white"
                >
                  Return Command
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default App;
