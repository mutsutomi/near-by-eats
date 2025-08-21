import { useState } from 'react';
import { getAllGenres } from '@/utils/genre';

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenreChange: (genres: string[]) => void;
  maxSelections?: number;
  className?: string;
}

const GenreSelector = ({ 
  selectedGenres, 
  onGenreChange, 
  maxSelections = 3,
  className = ''
}: GenreSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const allGenres = getAllGenres();
  
  const handleGenreToggle = (genreType: string) => {
    const isSelected = selectedGenres.includes(genreType);
    
    if (isSelected) {
      onGenreChange(selectedGenres.filter(g => g !== genreType));
    } else {
      if (selectedGenres.length < maxSelections) {
        onGenreChange([...selectedGenres, genreType]);
      }
    }
  };

  const clearSelection = () => {
    onGenreChange([]);
  };

  const getDisplayText = () => {
    if (selectedGenres.length === 0) {
      return 'ジャンルを選択';
    }
    if (selectedGenres.length === 1) {
      return allGenres[selectedGenres[0]] || selectedGenres[0];
    }
    return `${selectedGenres.length}個のジャンル`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium text-left"
      >
        {getDisplayText()}
      </button>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  ジャンル選択 ({selectedGenres.length}/{maxSelections})
                </span>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    クリア
                  </button>
                )}
              </div>
              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedGenres.map(genreType => (
                    <span
                      key={genreType}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {allGenres[genreType]}
                      <button
                        onClick={() => handleGenreToggle(genreType)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2">
              {Object.entries(allGenres).map(([genreType, genreName]) => {
                const isSelected = selectedGenres.includes(genreType);
                const isDisabled = !isSelected && selectedGenres.length >= maxSelections;
                
                return (
                  <button
                    key={genreType}
                    onClick={() => !isDisabled && handleGenreToggle(genreType)}
                    disabled={isDisabled}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{genreName}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GenreSelector;