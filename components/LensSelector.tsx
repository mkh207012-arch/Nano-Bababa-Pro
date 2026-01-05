import React from 'react';
import { LENSES } from '../constants';
import { Camera } from 'lucide-react';

interface LensSelectorProps {
  selectedLensId: string;
  onSelect: (id: string) => void;
}

export const LensSelector: React.FC<LensSelectorProps> = ({ selectedLensId, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2">
        <Camera size={20} />
        <h3>렌즈 선택 (Canon L 시리즈)</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {LENSES.map((lens) => {
          const isSelected = lens.id === selectedLensId;
          return (
            <button
              key={lens.id}
              onClick={() => onSelect(lens.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group
                ${isSelected 
                  ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500' 
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold text-lg ${isSelected ? 'text-rose-400' : 'text-gray-200'}`}>
                  {lens.focalLength}
                </span>
                <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-gray-400">
                  {lens.aperture}
                </span>
              </div>
              <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-500'} font-medium mb-1`}>
                {lens.name}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2">
                {lens.description}
              </p>
              
              {/* Active Indicator */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};