import React, { useEffect, useRef, useState } from 'react';
import { Image, Download, Sparkles, RefreshCw, RefreshCw as IconRegen, HelpCircle, Eye } from 'lucide-react';
import { Theme } from '../types';

interface ImageGeneratorResultProps {
  prompt: string;
  imageUrl?: string;
  isError?: boolean;
  theme: Theme;
}

export default function ImageGeneratorResult({ prompt, imageUrl, isError, theme }: ImageGeneratorResultProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'creative' | 'prompt'>('creative');
  const isDark = theme === 'dark';

  // Procedural Generative Art Fallback
  useEffect(() => {
    // If we have a server base64 string, we use it and ignore canvas generator
    if (imageUrl) {
      setDownloadUrl(imageUrl);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set stable width and height matching device pixel ratios
    canvas.width = 400;
    canvas.height = 400;
    const w = canvas.width;
    const h = canvas.height;

    // Build some procedural patterns based on keyword seeds in the prompt
    const promptLower = prompt.toLowerCase();
    
    // Choose theme background gradients and elements
    let color1 = '#1E3A8A'; // Deep blue
    let color2 = '#0D9488'; // Teal
    let type: 'fractal' | 'neon' | 'matrix' | 'sunset' = 'fractal';

    if (promptLower.includes('sunset') || promptLower.includes('sun') || promptLower.includes('beach') || promptLower.includes('warm')) {
      color1 = '#F43F5E'; // Rose
      color2 = '#F59E0B'; // Amber
      type = 'sunset';
    } else if (promptLower.includes('cyberpunk') || promptLower.includes('city') || promptLower.includes('neon') || promptLower.includes('robot')) {
      color1 = '#EC4899'; // Fuchsia
      color2 = '#06B6D4'; // Cyan
      type = 'neon';
    } else if (promptLower.includes('code') || promptLower.includes('matrix') || promptLower.includes('digital') || promptLower.includes('hacker')) {
      color1 = '#065F46'; // Forest green
      color2 = '#10B981'; // Emerald
      type = 'matrix';
    }

    // Draw the generator background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Apply procedural lines and math coordinates
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    if (type === 'sunset') {
      // Draw a solar sphere and horizontal reflection
      const sunGrad = ctx.createRadialGradient(w/2, h/2 - 20, 10, w/2, h/2 - 20, 80);
      sunGrad.addColorStop(0, '#FFFBEB');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w/2, h/2 - 20, 80, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal sea lines
      for (let y = h/2; y < h - 40; y += 8) {
        ctx.strokeStyle = `rgba(255, 251, 235, ${(y - h/2)/w * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 30, y);
        ctx.stroke();
      }
    } else if (type === 'neon') {
      // Hexagonal digital perspective grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      const horizonY = h/2;
      for (let x = -100; x < w + 200; x += 30) {
        ctx.beginPath();
        ctx.moveTo(w/2, horizonY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = horizonY; y < h; y += (y - horizonY + 10) * 0.3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    } else if (type === 'matrix') {
      // Digits matrix layout falling streams
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = color2;
      ctx.font = '10px monospace';
      for (let x = 10; x < w; x += 15) {
        const fallY = Math.random() * h;
        for (let y = 10; y < fallY; y += 15) {
          const randChar = String.fromCharCode(33 + Math.floor(Math.random() * 93));
          ctx.fillText(randChar, x, y);
        }
      }
    } else {
      // Default: Fractal geometric Spirograph lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      const points = 120;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 18;
        const radius = 50 + Math.sin(theta * 1.5) * 80;
        const xPos = w/2 + Math.cos(theta) * radius;
        const yPos = h/2 + Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }
      ctx.stroke();
    }

    // Overlay premium lens flare particle rings
    const overlayGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, 190);
    overlayGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic label signature stamp in margin
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '9px monospace';
    ctx.fillText('MANUS AI • SVF PROCEDURAL ENGINE', w - 195, h - 20);

    // Save as local image download trigger
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setDownloadUrl(dataUrl);
    } catch (e) {
      console.error(e);
    }
  }, [prompt, imageUrl]);

  return (
    <div 
      className={`my-4 rounded-2xl border overflow-hidden shadow-sm flex flex-col ${
        isDark ? 'bg-[#0F0F10] border-[#1F1F1F]' : 'bg-white border-neutral-200'
      }`}
      id="img-generator-result-card"
    >
      {/* Header bar controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800" id="img-card-header">
        <div className="flex items-center gap-1.5">
          <Image className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-tight text-neutral-800 dark:text-neutral-200">
            {imageUrl ? 'Symmetric Synth Render' : 'SVF Generative Canvas'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a 
              href={downloadUrl} 
              download={`manus_synthesized_${Date.now()}.png`}
              className={`p-1.5 px-3 rounded-lg flex items-center gap-1 transition-all text-[11px] font-sans font-semibold focus:outline-none ${
                isDark 
                  ? 'bg-neutral-900 border border-[#222] hover:bg-neutral-800 text-neutral-300 hover:text-white' 
                  : 'bg-neutral-100 border border-neutral-250 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900'
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Download PNG</span>
            </a>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col items-center gap-4">
        {/* Render base64 image or fallback canvas */}
        <div className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-[#1F1F1F] shadow-inner">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={prompt} 
              className="w-full h-full object-cover text-xs text-center" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <canvas ref={canvasRef} className="w-full h-full block" />
          )}

          {!imageUrl && (
            <div className="absolute top-2 left-2 bg-black/75 px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              <span>Free Procedural Asset fallback</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="w-full text-left font-sans text-xs flex flex-col gap-1 select-text">
          <span className="text-[10px] text-neutral-500 uppercase font-mono font-semibold">Prompt instruction schema</span>
          <p className={`p-2.5 rounded-xl border italic ${
            isDark ? 'bg-[#151517] border-[#1F1F1F] text-neutral-400' : 'bg-neutral-55 border-neutral-150 text-neutral-600'
          }`}>
            "{prompt}"
          </p>
          {!imageUrl && (
            <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-medium select-none mt-1">
              * Note: Server-side Imagen models may require an active paid token tier. An interactive procedural render is constructed based on your prompt's artistic descriptors.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
