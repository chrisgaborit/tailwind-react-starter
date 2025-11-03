import React, { useState, useEffect } from 'react';

interface StoryboardProgressProps {
  isGenerating: boolean;
  className?: string;
}

const progressSteps = [
  "✍️ Scoping your project and learning goals",
  "🎭 Designing a compelling learning narrative", 
  "🧑‍🤝‍🧑 Creating relatable characters and scenarios",
  "📚 Adding worked examples and guided practice",
  "🎯 Building interactive choices and challenges",
  "🔎 Reviewing flow for clarity and engagement",
  "🌟 Final polish for award-level quality"
];

const StoryboardProgress: React.FC<StoryboardProgressProps> = ({ 
  isGenerating, 
  className = "" 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      // Reset when not generating
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Animate through steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % progressSteps.length);
    }, 3000); // Change step every 3 seconds

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + 0.5; // Increment by 0.5% every ~50ms
        return nextProgress >= 100 ? 0 : nextProgress; // Loop back to 0 when reaching 100%
      });
    }, 50);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Circular Progress Ring */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="text-slate-700"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress circle with gradient effect */}
          <path
            className="text-blue-500 transition-all duration-300 ease-out drop-shadow-lg"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        
        {/* Pulsing center dot with glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-80 h-2 bg-slate-700 rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Dynamic Status Message */}
      <div className="text-center max-w-md">
        <div 
          key={currentStep}
          className="text-lg font-medium text-blue-400 animate-fade-in"
        >
          {progressSteps[currentStep]}
        </div>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-1 mt-2">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 rounded-full bg-blue-500 animate-pulse`}
              style={{
                animationDelay: `${dot * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex space-x-2">
        {progressSteps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? 'bg-blue-500 scale-125' 
                : index < currentStep 
                  ? 'bg-green-500' 
                  : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StoryboardProgress;
