import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, LineChart as IconLineChart, PieChart as IconPieChart, AreaChart as IconAreaChart, Info, TrendingUp, Sparkles } from 'lucide-react';
import { Theme } from '../types';

interface DataVisualizerProps {
  data: any[];
  config: { type: 'bar' | 'line' | 'pie' | 'area'; xKey: string; yKeys: string[]; title?: string };
  theme: Theme;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

export default function DataVisualizer({ data, config, theme }: DataVisualizerProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>(config.type || 'bar');
  
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-sm ${
        theme === 'dark' ? 'bg-[#141414] border-[#1F1F1F] text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
      }`}>
        <Info className="w-5 h-5 text-neutral-500" />
        <span>No visualization data available.</span>
      </div>
    );
  }

  // Calculate some simple statistics
  const labelKey = config.xKey || Object.keys(data[0])[0];
  const valueKey = config.yKeys[0] || Object.keys(data[0])[1];
  
  const numericValues = data
    .map(d => parseFloat(d[valueKey]))
    .filter(val => !isNaN(val));

  const total = numericValues.reduce((sum, val) => sum + val, 0);
  const average = numericValues.length > 0 ? (total / numericValues.length).toFixed(1) : '0';
  const max = numericValues.length > 0 ? Math.max(...numericValues).toFixed(1) : '0';
  const min = numericValues.length > 0 ? Math.min(...numericValues).toFixed(1) : '0';

  const isDark = theme === 'dark';
  const listColors = COLORS;

  return (
    <div 
      className={`my-4 p-5 rounded-2xl border flex flex-col gap-4 shadow-sm select-none ${
        isDark 
          ? 'bg-[#0F0F10] border-[#1F1F1F] text-neutral-200' 
          : 'bg-white border-neutral-200 text-neutral-800'
      }`}
      id="data-viz-container"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-neutral-200 dark:border-neutral-800">
        <div>
          <h4 className="text-sm font-semibold tracking-tight uppercase flex items-center gap-1.5 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span>Interactive Data Visualizer</span>
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            {config.title || `Visualizing ${valueKey} by ${labelKey}`}
          </p>
        </div>

        {/* Chart Type Controller Buttons */}
        <div className={`flex items-center gap-1 p-1 rounded-xl self-start sm:self-center border ${
          isDark ? 'bg-[#161618] border-[#252528]' : 'bg-neutral-150 border-neutral-200'
        }`}>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
              chartType === 'bar'
                ? isDark ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-350'
            }`}
            title="Bar Chart"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
              chartType === 'line'
                ? isDark ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-350'
            }`}
            title="Line Chart"
          >
            <IconLineChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
              chartType === 'area'
                ? isDark ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-350'
            }`}
            title="Area Chart"
          >
            <IconAreaChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
              chartType === 'pie'
                ? isDark ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-350'
            }`}
            title="Pie Chart"
          >
            <IconPieChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {numericValues.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#151517] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-150'}`}>
            <span className="block text-[10px] text-neutral-500 uppercase font-mono">Average</span>
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{average}</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#151517] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-150'}`}>
            <span className="block text-[10px] text-neutral-500 uppercase font-mono">Max Value</span>
            <span className="text-sm font-semibold tracking-tight text-emerald-500">{max}</span>
          </div>
          <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#151517] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-150'}`}>
            <span className="block text-[10px] text-neutral-500 uppercase font-mono">Min Value</span>
            <span className="text-sm font-semibold tracking-tight text-rose-500">{min}</span>
          </div>
        </div>
      )}

      {/* Main Chart Rendering Surface */}
      <div className="h-[240px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222222' : '#E5E5E5'} />
              <XAxis dataKey={labelKey} stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <YAxis stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#141416' : '#FFFFFF', 
                  borderColor: isDark ? '#2E2E33' : '#E5E7EB',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderRadius: 8,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {config.yKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={listColors[idx % listColors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222222' : '#E5E5E5'} />
              <XAxis dataKey={labelKey} stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <YAxis stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#141416' : '#FFFFFF', 
                  borderColor: isDark ? '#2E2E33' : '#E5E7EB',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderRadius: 8,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {config.yKeys.map((key, idx) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={listColors[idx % listColors.length]} 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {config.yKeys.map((key, idx) => (
                  <linearGradient key={`grad-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={listColors[idx % listColors.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={listColors[idx % listColors.length]} stopOpacity={0.0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222222' : '#E5E5E5'} />
              <XAxis dataKey={labelKey} stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <YAxis stroke={isDark ? '#888888' : '#666666'} style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#141416' : '#FFFFFF', 
                  borderColor: isDark ? '#2E2E33' : '#E5E7EB',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderRadius: 8,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {config.yKeys.map((key, idx) => (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={listColors[idx % listColors.length]} 
                  fillOpacity={1} 
                  fill={`url(#gradient-${key})`} 
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey={valueKey}
                nameKey={labelKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={listColors[index % listColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#141416' : '#FFFFFF', 
                  borderColor: isDark ? '#2E2E33' : '#E5E7EB',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className={`p-3 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed cursor-default ${
        isDark ? 'bg-neutral-900/50 text-neutral-400' : 'bg-neutral-100/50 text-neutral-600'
      }`}>
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 filter-none mt-0.5" />
        <span>Generated interactively according to data snapshot parameters. Tap another chart type above to toggle viewport visualization layouts.</span>
      </div>
    </div>
  );
}
