
import React from 'react';
import { ProductType, HoodieType } from '../types';
import { COLORS } from '../constants';

interface ProductPreviewProps {
  productType: ProductType;
  color: string;
  hoodieType?: HoodieType;
  printImages: Record<string, string>;
  gender?: string;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  productType, 
  color, 
  hoodieType, 
  printImages,
  gender 
}) => {
  // Extremely robust color matching
  const selectedColor = React.useMemo(() => {
    const input = (color || '').trim();
    if (!input) return COLORS[0];

    // 1. Try exact match by name or hex
    const exact = COLORS.find(c => c.name === input || c.hex.toLowerCase() === input.toLowerCase());
    if (exact) return exact;

    // 2. Try normalized match
    const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-z0-9а-яе]/gi, '').trim();
    const target = normalize(input);
    const normalized = COLORS.find(c => normalize(c.name) === target);
    if (normalized) return normalized;

    // 3. Try partial match
    const partial = COLORS.find(c => normalize(c.name).includes(target) || target.includes(normalize(c.name)));
    if (partial) return partial;

    return COLORS[0];
  }, [color]);

  const hex = selectedColor.hex.toUpperCase();
  const isBlack = hex === '#000000';
  const isNavy = hex === '#001F3F' || hex === '#001A35';
  const isDark = isBlack || isNavy || hex === '#004D00';
  
  const isTurquoise = hex === '#40E0D0';

  // Mockup color: slightly lighter for black/navy to show details (folds, shadows)
  // If we use pure #000000, it's just a black blob.
  const mockupFill = isBlack ? '#1C1C1C' : (isNavy ? '#002B59' : selectedColor.hex);

  // Simple SVG-based hoodie/t-shirt mockup
  const renderMockup = (side: 'front' | 'back') => {
    const isHoodie = productType === ProductType.HOODIE;
    const isTshirt = productType === ProductType.TSHIRT;
    const isTankTop = productType === ProductType.TANK_TOP;
    const isCap = productType === ProductType.CAP;

    const printKey = side === 'front' ? 'Спереди' : 'Сзади';
    const printImage = printImages[printKey];

    // Don't show back for caps
    if (isCap && side === 'back') return null;

    const printTopClass = isCap ? 'top-[45%]' : (side === 'front' ? 'top-[38%]' : 'top-[35%]');

    return (
      <div className="relative w-full aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center p-4 border border-gray-200 shadow-inner group">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full drop-shadow-2xl transition-all duration-500"
          >
            <defs>
              <radialGradient id={`lighting-${side}`} cx="50%" cy="40%" r="50%" fx="50%" fy="40%">
                <stop offset="0%" stopColor="white" stopOpacity={isDark ? "0.25" : "0.4"} />
                <stop offset="100%" stopColor="black" stopOpacity="0.2" />
              </radialGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Base Hoodie/T-shirt path with shading */}
            <g fill={mockupFill} stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.15)"} strokeWidth="0.8">
              {isHoodie && (
                <path d="M20,35 Q20,25 35,20 L65,20 Q80,25 80,35 L85,60 Q85,65 75,65 L70,90 Q70,95 30,90 L25,65 Q15,65 15,60 Z" />
              )}
              {isTshirt && (
                <path d="M20,30 L35,20 L65,20 L80,30 L85,50 L75,55 L75,90 L25,90 L25,55 L15,50 Z" />
              )}
              {isTankTop && (
                <path d="M30,20 L70,20 L75,40 L70,90 L30,90 L25,40 Z" />
              )}
              {isCap && (
                <path d="M25,60 Q25,30 50,30 Q75,30 75,60 L75,70 L25,70 Z M25,70 L75,70 L85,80 Q85,85 50,85 Q15,85 15,80 Z" />
              )}
            </g>

            {/* Lighting Overlay */}
            <g style={{ mixBlendMode: 'overlay', pointerEvents: 'none' }}>
               {isHoodie && <path d="M20,35 Q20,25 35,20 L65,20 Q80,25 80,35 L85,60 Q85,65 75,65 L70,90 Q70,95 30,90 L25,65 Q15,65 15,60 Z" fill={`url(#lighting-${side})`} />}
               {isTshirt && <path d="M20,30 L35,20 L65,20 L80,30 L85,50 L75,55 L75,90 L25,90 L25,55 L15,50 Z" fill={`url(#lighting-${side})`} />}
               {isTankTop && <path d="M30,20 L70,20 L75,40 L70,90 L30,90 L25,40 Z" fill={`url(#lighting-${side})`} />}
               {isCap && <path d="M25,60 Q25,30 50,30 Q75,30 75,60 L75,70 L25,70 Z" fill={`url(#lighting-${side})`} />}
            </g>
            
            {/* Shading/Highlights */}
            {!isCap && <path d="M20,35 Q20,25 35,20 L65,20 Q80,25 80,35" fill="none" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"} strokeWidth="1" />}
            {!isCap && <path d="M30,90 L70,90" fill="none" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"} strokeWidth="2" />}
            
            {/* Hoodie specific details */}
            {isHoodie && (
              <>
                <path d="M40,20 Q50,40 60,20" fill="none" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"} strokeWidth="1" />
                <path d="M35,65 L65,65 Q65,85 50,85 Q35,85 35,65" fill="none" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"} strokeWidth="1" /> {/* Pocket */}
              </>
            )}

            {/* Cap specific details */}
            {isCap && (
              <path d="M50,30 L50,70" fill="none" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"} strokeWidth="0.5" />
            )}
          </svg>
        </div>

        {/* Print Overlay */}
        {printImage && (
          <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none ${isCap ? 'w-[20%]' : 'w-[35%] aspect-square'} ${printTopClass}`}>
            <img 
              src={printImage} 
              alt="Print" 
              className="max-w-full max-h-full object-contain opacity-95 mix-blend-normal drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 border border-white/50 shadow-sm">
          {side === 'front' ? 'Вид спереди' : 'Вид сзади'}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Предпросмотр дизайна</h3>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: selectedColor.hex }}></div>
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedColor.name}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderMockup('front')}
        {productType !== ProductType.CAP && renderMockup('back')}
      </div>

      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-relaxed text-center">
          * Это схематичная визуализация. Реальный цвет и расположение могут незначительно отличаться.
        </p>
      </div>
    </div>
  );
};
