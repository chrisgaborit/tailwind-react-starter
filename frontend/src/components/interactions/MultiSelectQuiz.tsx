// frontend/src/components/interactions/MultiSelectQuiz.tsx
import { useState, useCallback } from 'react';
import { MultiSelectQuizProps } from '../../types/interactionTypes';

/**
 * MultiSelectQuiz Component
 * 
 * Knowledge check with multiple correct answers.
 * Fully accessible with keyboard navigation.
 */
export default function MultiSelectQuiz({ 
  questions, 
  requireAllCorrect = true,
  allowRetry = true,
  maxAttempts = 2 
}: MultiSelectQuizProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const toggleOption = useCallback((optionId: string) => {
    if (submitted) return;
    
    setSelectedOptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setAttempts(prev => prev + 1);
    setShowExplanation(true);
  }, []);

  const handleRetry = useCallback(() => {
    setSelectedOptions(new Set());
    setSubmitted(false);
    setShowExplanation(false);
  }, []);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">No quiz questions available.</p>
      </div>
    );
  }

  const question = questions[0]; // Single question for now
  const correctOptions = new Set(question.options.filter(opt => opt.correct).map(opt => opt.id));
  const isCorrect = submitted && 
    selectedOptions.size === correctOptions.size &&
    Array.from(selectedOptions).every(id => correctOptions.has(id));
  
  const canRetry = allowRetry && !isCorrect && attempts < maxAttempts;

  return (
    <div className="space-y-4 my-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Instructions:</strong> Select <strong>all</strong> correct answers. 
          Use Tab to navigate and Space to select/deselect options.
        </p>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {question.text}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedOptions.has(option.id);
            const showCorrect = submitted && option.correct;
            const showIncorrect = submitted && isSelected && !option.correct;

            return (
              <div
                key={option.id}
                className={`
                  relative p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected && !submitted ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                  ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                  ${showIncorrect ? 'border-red-500 bg-red-50' : ''}
                  ${!submitted ? 'hover:border-blue-400' : 'cursor-default'}
                `}
                onClick={() => toggleOption(option.id)}
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={submitted}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleOption(option.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={`
                    flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                    ${isSelected && !submitted ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}
                    ${showCorrect ? 'bg-green-500 border-green-500' : ''}
                    ${showIncorrect ? 'bg-red-500 border-red-500' : ''}
                  `}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Option Text */}
                  <span className="flex-1 text-gray-900">
                    {option.text}
                  </span>

                  {/* Status Icon */}
                  {showCorrect && (
                    <svg className="flex-shrink-0 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showIncorrect && (
                    <svg className="flex-shrink-0 w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit/Retry Button */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOptions.size === 0}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors w-full"
          >
            Submit Answer
          </button>
        ) : (
          <>
            {/* Feedback */}
            <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <svg className="flex-shrink-0 w-6 h-6 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="flex-shrink-0 w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`font-medium ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                  {isCorrect ? 'Excellent! You\'ve identified all correct answers.' : 'Some selections need adjustment.'}
                </p>
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && question.explanation && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}

            {/* Retry Button */}
            {canRetry && (
              <button
                onClick={handleRetry}
                className="mt-4 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors w-full"
              >
                Try Again ({maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* Accessibility Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {submitted && (isCorrect ? 'Correct answer!' : 'Incorrect answer. Review the feedback.')}
      </div>
    </div>
  );
}


