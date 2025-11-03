// frontend/src/components/interactions/ClickToReveal.tsx
import { useState, useCallback } from 'react';
import { ClickToRevealProps } from '../../types/interactionTypes';

/**
 * ClickToReveal Component
 * 
 * Progressive disclosure interaction where learners click/tap cards to reveal content.
 * Fully accessible with keyboard navigation and ARIA support.
 */
export default function ClickToReveal({ concepts, columns = 3 }: ClickToRevealProps) {
  const [revealedConcepts, setRevealedConcepts] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const toggleReveal = useCallback((conceptId: string) => {
    setRevealedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      return newSet;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, conceptId: string, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleReveal(conceptId);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(Math.min(index + 1, concepts.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(Math.max(index - 1, 0));
        break;
      case 'Escape':
        e.preventDefault();
        if (revealedConcepts.has(conceptId)) {
          toggleReveal(conceptId);
        }
        break;
    }
  }, [concepts.length, revealedConcepts, toggleReveal]);

  // Handle empty or invalid data
  if (!concepts || concepts.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">No concepts available to reveal.</p>
      </div>
    );
  }

  const allRevealed = concepts.every(c => revealedConcepts.has(c.id));
  const gridCols = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 
                   columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                   'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="space-y-4 my-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Instructions:</strong> Click or tap each card to reveal detailed information. 
          Use Tab to navigate, Enter or Space to reveal, Escape to close.
        </p>
      </div>

      {/* Concept Cards Grid */}
      <div className={`grid ${gridCols} gap-4`}>
        {concepts.map((concept, index) => {
          const isRevealed = revealedConcepts.has(concept.id);
          const isFocused = focusedIndex === index;

          return (
            <div
              key={concept.id}
              className={`
                relative overflow-hidden rounded-lg border-2 transition-all duration-200
                ${isRevealed ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}
                ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                cursor-pointer shadow-sm hover:shadow-md
              `}
              onClick={() => toggleReveal(concept.id)}
              onKeyDown={(e) => handleKeyDown(e, concept.id, index)}
              role="button"
              tabIndex={0}
              aria-expanded={isRevealed}
              aria-label={`${concept.title}. ${isRevealed ? 'Click to hide' : 'Click to reveal'} details.`}
            >
              {/* Card Header */}
              <div className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {concept.order}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                      {concept.title}
                    </h3>
                  </div>
                </div>
                
                {/* Expand/Collapse Icon */}
                <div className={`flex-shrink-0 ml-2 transform transition-transform duration-200 ${isRevealed ? 'rotate-180' : ''}`}>
                  <svg 
                    className="w-5 h-5 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Revealed Content */}
              {isRevealed && (
                <div className="px-4 pb-4 border-t border-blue-200 pt-3 animate-fadeIn">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {concept.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className={`p-3 rounded-lg ${allRevealed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Progress: {revealedConcepts.size} of {concepts.length} concepts explored
          </span>
          {allRevealed && (
            <span className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Complete!
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${allRevealed ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${(revealedConcepts.size / concepts.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Accessibility Note (Hidden but read by screen readers) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {revealedConcepts.size} of {concepts.length} concepts revealed. 
        {allRevealed && ' All concepts explored!'}
      </div>
    </div>
  );
}


