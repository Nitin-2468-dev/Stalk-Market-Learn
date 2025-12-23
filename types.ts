
export interface HistoryPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  history: HistoryPoint[];
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  avgCost: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface UserState {
  balance: number;
  portfolio: PortfolioItem[];
  xp: number;
  level: number;
  history: Transaction[];
  badges: Badge[];
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'AUTO_SELL';
  shares: number;
  price: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  PORTFOLIO = 'PORTFOLIO',
  MARKETS = 'MARKETS',
  LEARN = 'LEARN',
  LEADERBOARD = 'LEADERBOARD',
  SETTINGS = 'SETTINGS'
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | 'YTD' | 'ALL';
