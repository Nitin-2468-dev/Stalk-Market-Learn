
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { HistoryPoint } from '../types';

interface TradingChartProps {
  data: HistoryPoint[];
}

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
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
  const centerX = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={bodyHeight}
        fill={color}
        rx={0.5}
      />
    </g>
  );
};

const TradingChart: React.FC<TradingChartProps> = ({ data }) => {
  // State for visible range [startIndex, endIndex]
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  // Initialize or reset range when data length changes significantly
  useEffect(() => {
    if (data.length > 0) {
      // Show the last 40 points by default or all if fewer than 40
      const start = Math.max(0, data.length - 40);
      setRange([start, data.length]);
    }
  }, [data.length]);

  const slicedData = useMemo(() => {
    return data.slice(range[0], range[1]);
  }, [data, range]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (!slicedData || slicedData.length === 0) return { minPrice: 0, maxPrice: 100 };
    const allPrices = slicedData.flatMap(d => [d.low, d.high]);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const priceRange = max - min;
    const padding = priceRange * 0.15; 
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
      // Zoom In
      if (currentCount > 5) {
        start = Math.min(end - 5, start + zoomAmount);
        end = Math.max(start + 5, end - zoomAmount);
      }
    } else {
      // Zoom Out
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
    if (Math.abs(deltaX) < 5) return; // Sensitivity threshold

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
      className="w-full h-full bg-[#0b1120] rounded-2xl overflow-hidden relative cursor-crosshair select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 left-6 z-10 flex gap-3 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Perspective</span>
          <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-tighter">
            Viewing {slicedData.length} Intervals
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-6 z-10 flex flex-col items-end pointer-events-none">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Interaction</span>
        <span className="text-[9px] font-bold text-blue-400 mt-1 uppercase tracking-tighter">
          Scroll to Zoom • Drag to Pan
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={slicedData} margin={{ top: 40, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} horizontal={true} opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            minTickGap={30}
            fontFamily="monospace"
          />
          <YAxis 
            hide 
            domain={[minPrice, maxPrice]} 
          />
          <YAxis 
            yAxisId="volume"
            hide 
            domain={[0, (dataMax: number) => dataMax * 6]} 
          />
          
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #334155', 
              borderRadius: '12px',
              fontSize: '10px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '12px'
            }}
            labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            cursor={{ stroke: '#334155', strokeWidth: 1 }}
            formatter={(value: any, name: string) => {
              if (name === 'close') return [`$${value.toFixed(2)}`, 'Price'];
              if (name === 'volume') return [value.toLocaleString(), 'Vol'];
              return [value, name];
            }}
          />

          <Bar dataKey="volume" yAxisId="volume" barSize={8}>
            {slicedData.map((entry, index) => (
              <Cell 
                key={`vol-${index}`} 
                fill={entry.close >= entry.open ? '#10b981' : '#f43f5e'} 
                fillOpacity={0.2} 
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
