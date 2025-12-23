
import React from 'react';
import { Stock, Badge } from './types';

export const INITIAL_BALANCE = 100000;

export const MOCK_STOCKS: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.35,
    change: 1.25,
    changePercent: 0.71,
    volume: '58.4M',
    marketCap: '2.75T',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 460.15,
    change: 15.40,
    changePercent: 3.45,
    volume: '42.1M',
    marketCap: '1.14T',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 245.30,
    change: -5.12,
    changePercent: -2.10,
    volume: '112.5M',
    marketCap: '780.2B',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 334.10,
    change: 0.85,
    changePercent: 0.25,
    volume: '22.8M',
    marketCap: '2.48T',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 135.20,
    change: 0.55,
    changePercent: 0.41,
    volume: '19.4M',
    marketCap: '1.69T',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    price: 105.20,
    change: 1.95,
    changePercent: 1.85,
    volume: '45.7M',
    marketCap: '169.8B',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: 128.90,
    change: -0.30,
    changePercent: -0.23,
    volume: '38.2M',
    marketCap: '1.33T',
    // Fix: Initialized with an empty array to satisfy the HistoryPoint[] type requirement.
    history: []
  }
];

export const ALL_BADGES: Badge[] = [
  { id: '1', name: 'First Launch', description: 'Executed first simulated trade', icon: 'rocket_launch' },
  { id: '2', name: 'Profit Maker', description: 'Closed a trade with >10% gain', icon: 'savings' },
  { id: '3', name: 'Diversified', description: 'Hold 5 different sectors', icon: 'pie_chart' },
  { id: '4', name: 'Diamond Hands', description: 'Held a position for 30+ days', icon: 'diamond' },
  { id: '5', name: 'Millionaire', description: 'Reach $1M Portfolio Value', icon: 'account_balance' },
  { id: '6', name: 'Oracle', description: '10 Winning Trades in a Row', icon: 'visibility' },
];
