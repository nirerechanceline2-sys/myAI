import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calculator, Activity, HelpCircle, CheckCircle } from 'lucide-react';
import { Theme } from '../types';

interface MathSolverPanelProps {
  expression: string;
  result: string;
  steps: string[];
  plotPoints?: { x: number; y: number }[];
  theme: Theme;
}

export default function MathSolverPanel({ expression, result, steps, plotPoints, theme }: MathSolverPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<boolean[]>(steps.map((_, i) => i === 0)); // expand first step by default
  const isDark = theme === 'dark';

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // SVG dimensions for 2D graphing coordinate system
  const width = 300;
  const height = 180;
  const padding = 20;

  // Find min/max values to fit the points beautifully in SVG coordinate limits
  let minX = -5, maxX = 5, minY = -5, maxY = 5;
  if (plotPoints && plotPoints.length > 0) {
    const xs = plotPoints.map(p => p.x);
    const ys = plotPoints.map(p => p.y);
    minX = Math.min(...xs, -1);
    maxX = Math.max(...xs, 1);
    minY = Math.min(...ys, -1);
    maxY = Math.max(...ys, 1);
    
    // Add 10% breathing padding
    const dx = maxX - minX || 2;
    const dy = maxY - minY || 2;
    minX -= dx * 0.1;
    maxX += dx * 0.1;
    minY -= dy * 0.1;
    maxY += dy * 0.1;
  }

  // Linear scaling adapters to transpose coordinates into SVG space
  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding);

  // Derive center axes
  const originX = scaleX(0);
  const originY = scaleY(0);

  // Render plot path lines
  const dPath = plotPoints && plotPoints.length > 1
    ? plotPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`)
        .join(' ')
    : '';

  return (
    <div 
      className={`my-4 p-5 rounded-2xl border flex flex-col gap-4 shadow-sm select-none ${
        isDark 
          ? 'bg-[#0F0F10] border-[#1F1F1F] text-neutral-200' 
          : 'bg-white border-neutral-200 text-neutral-800'
      }`}
      id="math-solver-container"
    >
      {/* Title block */}
      <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
        <div id="math-header-indicator">
          <h4 className="text-sm font-semibold tracking-tight uppercase flex items-center gap-1.5 text-blue-500">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Advanced Mathematical Solver</span>
          </h4>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Algebra / Graphing Module</span>
        </div>
        <div className={`p-1.5 px-3 rounded-full text-xs font-semibold ${isDark ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
          Verified Solved
        </div>
      </div>

      {/* Equation display panel */}
      <div className={`flex flex-col gap-1.5 p-4 rounded-xl border ${isDark ? 'bg-[#151517] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-150'}`}>
        <span className="text-[10px] text-neutral-500 uppercase font-mono font-semibold">Equation / Expression</span>
        <div className="text-lg font-mono tracking-tight font-medium overflow-x-auto text-blue-600 dark:text-blue-300">
          {expression}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold select-text text-neutral-900 dark:text-neutral-50 font-sans">
            Result: <span className="font-mono">{result}</span>
          </span>
        </div>
      </div>

      {/* Grid: Graph and Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step-by-step Accordion */}
        <div className="flex flex-col gap-1.5 order-2 md:order-1">
          <span className="text-[10px] text-neutral-500 uppercase font-mono font-semibold mb-1">Step-by-Step Simplification</span>
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {steps.map((step, idx) => {
              const isExpanded = expandedSteps[idx];
              const parts = step.split(':');
              const stepTitle = parts[0] || `Step ${idx + 1}`;
              const stepDetails = parts.slice(1).join(':').trim();

              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                    isExpanded 
                      ? isDark 
                        ? 'border-[#2D2D33] bg-[#141416]/50' 
                        : 'border-neutral-300 bg-neutral-50/50'
                      : isDark
                        ? 'border-[#1E1E22] hover:border-[#2A2A30] bg-[#101011]'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleStep(idx)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-semibold hover:opacity-90 select-none focus:outline-none cursor-pointer"
                  >
                    <span className={isExpanded ? 'text-blue-500 dark:text-blue-400' : ''}>{stepTitle}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                  </button>
                  
                  {isExpanded && stepDetails && (
                    <div className="px-3 pb-3 pt-0.5 text-neutral-500 text-xs font-sans leading-relaxed select-text">
                      {stepDetails}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2D Coordinates Function Plotter */}
        {plotPoints && plotPoints.length > 0 ? (
          <div className="flex flex-col gap-1.5 order-1 md:order-2">
            <span className="text-[10px] text-neutral-500 uppercase font-mono font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mathematical Graphing Canvas</span>
            </span>
            <div className={`rounded-xl border flex items-center justify-center p-2 h-[180px] bg-neutral-950 dark:bg-[#080809] border-neutral-200 dark:border-[#1F1F1F]`}>
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full max-w-[300px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Axes background gridlines */}
                {[minX, 0, maxX].map((xVal, _i) => {
                  const sX = scaleX(xVal);
                  return (
                    sX >= padding && sX <= width - padding && (
                      <line 
                        key={`grid-x-${_i}`}
                        x1={sX} y1={padding} x2={sX} y2={height - padding}
                        stroke="#222" strokeDasharray="2 2" strokeWidth={1}
                      />
                    )
                  );
                })}
                {[minY, 0, maxY].map((yVal, _i) => {
                  const sY = scaleY(yVal);
                  return (
                    sY >= padding && sY <= height - padding && (
                      <line 
                        key={`grid-y-${_i}`}
                        x1={padding} y1={sY} x2={width - padding} y2={sY}
                        stroke="#222" strokeDasharray="2 2" strokeWidth={1}
                      />
                    )
                  );
                })}

                {/* X Axis labels */}
                <line x1={padding} y1={originY} x2={width - padding} y2={originY} stroke="#555" strokeWidth={1.5} />
                <polygon points={`${width - padding},${originY - 3} ${width - padding + 5},${originY} ${width - padding},${originY + 3}`} fill="#555" />
                <text x={width - padding - 2} y={originY + 12} fontSize="8" fill="#888" fontFamily="monospace">x</text>

                {/* Y Axis labels */}
                <line x1={originX} y1={padding} x2={originX} y2={height - padding} stroke="#555" strokeWidth={1.5} />
                <polygon points={`${originX - 3},${padding} ${originX},${padding - 5} ${originX + 3},${padding}`} fill="#555" />
                <text x={originX + 6} y={padding + 8} fontSize="8" fill="#888" fontFamily="monospace">y</text>

                {/* Main plot line path fitting */}
                {dPath && (
                  <path 
                    d={dPath} 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth={2.5} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Interactive markers dots */}
                {plotPoints.map((p, idx) => (
                  <circle 
                    key={idx} 
                    cx={scaleX(p.x)} 
                    cy={scaleY(p.y)} 
                    r={3} 
                    fill="#3B82F6" 
                    stroke="#000" 
                    strokeWidth={1}
                    className="hover:r-4 transition-all"
                  >
                    <title>{`(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}</title>
                  </circle>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl border flex flex-col items-center justify-center p-6 h-[180px] text-neutral-500 text-xs ${
            isDark ? 'bg-[#151517] border-[#1F1F1F]' : 'bg-neutral-50 border-neutral-150'
          }`}>
            <HelpCircle className="w-8 h-8 text-neutral-600 mb-1" />
            <span>No variable parameters detected to generate interactive curve lines plot.</span>
          </div>
        )}
      </div>
    </div>
  );
}
