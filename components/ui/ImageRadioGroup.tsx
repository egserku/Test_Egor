
import React from 'react';

interface Option {
  id: string;
  label: string;
  image: string;
}

interface ImageRadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ImageRadioGroup: React.FC<ImageRadioGroupProps> = ({ options, value, onChange, label }) => {
  return (
    <div className="animate-in slide-in-from-left-4 duration-400">
      {label && (
        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
          {label}
        </label>
      )}
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
              value === option.id
                ? 'border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600'
                : 'border-gray-100 bg-white hover:border-indigo-200'
            }`}
          >
            <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
              <img
                src={option.image}
                alt={option.label}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=' + encodeURIComponent(option.label);
                }}
              />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest text-center ${
              value === option.id ? 'text-indigo-700' : 'text-gray-400'
            }`}>
              {option.label}
            </span>
            {value === option.id && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
