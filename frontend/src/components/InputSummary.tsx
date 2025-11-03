import React from 'react';
import type { StoryboardFormData } from '@/types';

interface InputSummaryProps {
  formData: StoryboardFormData;
  selectedFiles: File[];
  imageFiles: File[];
  className?: string;
}

const InputSummary: React.FC<InputSummaryProps> = ({ 
  formData, 
  selectedFiles, 
  imageFiles, 
  className = "" 
}) => {
  const formatDuration = (mins?: number) => {
    if (!mins) return "Not specified";
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const formatFileList = (files: File[]) => {
    if (files.length === 0) return "None";
    return files.map(f => f.name).join(", ");
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-400">Project Summary</h2>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Module Title
            </label>
            <div className="text-white font-medium">
              {formData.moduleName || "Untitled Module"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Module Type
            </label>
            <div className="text-white">
              {formData.moduleType || "Not specified"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Complexity Level
            </label>
            <div className="text-white">
              {formData.complexityLevel || "Not specified"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Duration
            </label>
            <div className="text-white">
              {formatDuration(formData.durationMins)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tone
            </label>
            <div className="text-white">
              {formData.tone || "Not specified"}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Target Audience
            </label>
            <div className="text-white">
              {formData.targetAudience || "Not specified"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Learning Objectives
            </label>
            <div className="text-white whitespace-pre-wrap">
              {formData.learningObjectives || "Not specified"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Content Files
            </label>
            <div className="text-white text-sm">
              {formatFileList(selectedFiles)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Image Files
            </label>
            <div className="text-white text-sm">
              {formatFileList(imageFiles)}
            </div>
          </div>

          {formData.businessImpact && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Business Impact
              </label>
              <div className="text-white text-sm">
                {typeof formData.businessImpact === 'string' 
                  ? formData.businessImpact 
                  : JSON.stringify(formData.businessImpact, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview */}
      {formData.content && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Content Preview
          </label>
          <div className="bg-slate-900/50 rounded-md p-4 max-h-32 overflow-y-auto">
            <div className="text-slate-300 text-sm whitespace-pre-wrap">
              {formData.content.length > 500 
                ? `${formData.content.substring(0, 500)}...` 
                : formData.content}
            </div>
          </div>
        </div>
      )}

      {/* Innovation Strategies */}
      {formData.innovationStrategies && formData.innovationStrategies.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Innovation Strategies
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.innovationStrategies.map((strategy, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
              >
                {strategy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Measurement Approaches */}
      {formData.measurementApproaches && formData.measurementApproaches.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Measurement Approaches
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.measurementApproaches.map((approach, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-sm"
              >
                {approach}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InputSummary;



















