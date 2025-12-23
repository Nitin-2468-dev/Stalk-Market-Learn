
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { HistoryPoint } from '../types';

interface TradingChartProps {
  data: HistoryPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HistoryPoint;
    const isUp = data.close >= data.open;
    const change = data.close - data.open;
    const changePercent = (change / data.open) * 100;

    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col gap-4 min-w-[220px] ring-1 ring-white/5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter mt-0.5">Execution Interval</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isUp ? 'Bullish' : 'Bearish'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Open</span>
            <span className="text-sm font-mono font-bold text-white tracking-tighter">${data.open.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Close</span>
            <span className="text-sm font-mono font-bold text-white tracking-tighter">${data.close.toFixed(2)}</span>
          </div>
          <div className="flex flex-col border-t border-slate-800 pt-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">High</span>
            <span className="text-sm font-mono font-bold text-emerald-400 tracking-tighter">${data.high.toFixed(2)}</span>
          </div>
          <div className="flex flex-col border-t border-slate-800 pt-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Low</span>
            <span className="text-sm font-mono font-bold text-rose-400 tracking-tighter">${data.low.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 space-y-2">
           <div className="flex justify-between items-center">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Net Change</span>
             <span className={`text-[11px] font-mono font-black ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
             </span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Interval Vol</span>
             <span className="text-[11px] font-mono font-black text-blue-400">{data.volume.toLocaleString()}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const CandlestickShape = (props: any) => {
  const { x, width, open, close, high, low, minPrice, maxPrice, background } = props;
  
  if (!background || !background.height) return null;

  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#f43f5e'; 
  const priceRange = maxPrice - minPrice;
  
  const getY = (price: number) => {
    return background.y + background.height * (1 - (price - minPrice) / priceRange);
  };

  const yOpen = getY(open);
  const yClose = getY(close);
  const yHigh = getY(high);
  const yLow = getY(low);

  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 2);
  const centerX = x + width / 2;

  return (
    <g>
      {/* Shadow/Wick */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Candle Body */}
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={bodyHeight}
        fill={isUp ? 'transparent' : color}
        stroke={color}
        strokeWidth={1.5}
        rx={1}
      />
    </g>
  );
};

const TradingChart: React.FC<TradingChartProps> = ({ data }) => {
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  useEffect(() => {
    if (data.length > 0) {
      const start = Math.max(0, data.length - 60);
      setRange([start, data.length]);
    }
  }, [data.length]);

  const slicedData = useMemo(() => {
    return data.slice(range[0], range[1]);
  }, [data, range]);

  const latestPrice = useMemo(() => {
    if (data.length === 0) return 0;
    return data[data.length - 1].close;
  }, [data]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (!slicedData || slicedData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const allPrices = slicedData.flatMap(d => [d.low, d.high]);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const priceRange = max - min;
    const padding = priceRange * 0.1; 
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding
    };
  }, [slicedData]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY;
    const currentCount = range[1] - range[0];
    const zoomAmount = Math.ceil(currentCount * zoomIntensity);

    let [start, end] = range;

    if (delta < 0) {
      if (currentCount > 5) {
        start = Math.min(end - 5, start + zoomAmount);
        end = Math.max(start + 5, end - zoomAmount);
      }
    } else {
      start = Math.max(0, start - zoomAmount);
      end = Math.min(data.length, end + zoomAmount);
    }

    setRange([start, end]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouseX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMouseX.current;
    if (Math.abs(deltaX) < 5) return;

    const currentCount = range[1] - range[0];
    const pixelsPerPoint = (containerRef.current?.clientWidth || 800) / currentCount;
    const pointsToShift = Math.round(-deltaX / pixelsPerPoint);

    if (pointsToShift !== 0) {
      let [start, end] = range;
      const newStart = Math.max(0, Math.min(data.length - currentCount, start + pointsToShift));
      const newEnd = newStart + currentCount;

      if (newStart !== start) {
        setRange([newStart, newEnd]);
        lastMouseX.current = e.clientX;
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#070b14] rounded-2xl overflow-hidden relative cursor-crosshair select-none border border-slate-900"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 left-6 z-20 flex gap-4 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Scale</span>
          <span className="text-[11px] font-mono font-bold text-blue-500 uppercase tracking-tight">
            {slicedData.length} BARS
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-20 z-20 flex flex-col items-end pointer-events-none">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Simulation</span>
        <span className="text-[11px] font-mono font-bold text-emerald-500 uppercase tracking-tight">
          HFT NODE ACTIVE
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={slicedData} margin={{ top: 40, right: 60, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="1 4" stroke="#1e293b" vertical={false} horizontal={true} opacity={0.5} />
          <XAxis 
            dataKey="time" 
            stroke="#334155" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            minTickGap={40}
            fontFamily="monospace"
            dy={10}
          />
          <YAxis 
            orientation="right"
            stroke="#334155"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[minPrice, maxPrice]}
            fontFamily="monospace"
            tickFormatter={(val) => `$${val.toFixed(2)}`}
          />
          <YAxis yAxisId="volume" hide domain={[0, (dataMax: number) => dataMax * 5]} />
          
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
            isAnimationActive={false}
          />

          {/* Reference Line for Last Price */}
          <ReferenceLine 
            y={latestPrice} 
            stroke="#3b82f6" 
            strokeDasharray="4 4" 
            strokeOpacity={0.6}
            label={{
                position: 'right',
                value: ` $${latestPrice.toFixed(2)}`,
                fill: '#3b82f6',
                fontSize: 10,
                fontWeight: '900',
                fontFamily: 'monospace',
                offset: 5
            }}
          />

          <Bar dataKey="volume" yAxisId="volume" barSize={8}>
            {slicedData.map((entry, index) => (
              <Cell 
                key={`vol-${index}`} 
                fill={entry.close >= entry.open ? '#10b981' : '#f43f5e'} 
                fillOpacity={0.12} 
              />
            ))}
          </Bar>

          <Bar 
            dataKey="close" 
            shape={(props: any) => {
              const item = slicedData[props.index];
              if (!item) return null;
              return (
                <CandlestickShape 
                  {...props} 
                  open={item.open} 
                  close={item.close} 
                  high={item.high} 
                  low={item.low}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              );
            }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
