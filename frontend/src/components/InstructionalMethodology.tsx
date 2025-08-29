// src/components/InstructionalMethodology.tsx

import React, { useState, useEffect } from 'react';

// Define a type for the data this component will manage
export interface MethodologyData {
  primaryLearningMode: string;
  secondaryTechniques: string[];
  interactionFrequency: string;
  specificCreativeInstructions: string;
}

// Define the component's props, including a function to pass data up to the parent form
interface Props {
  onDataChange: (data: MethodologyData) => void;
}

const InstructionalMethodology: React.FC<Props> = ({ onDataChange }) => {
  // --- STATE MANAGEMENT ---
  const [primaryLearningMode, setPrimaryLearningMode] = useState('Compliance');
  const [secondaryTechniques, setSecondaryTechniques] = useState<string[]>([]);
  const [interactionFrequency, setInteractionFrequency] = useState('Let AI Decide');
  const [specificCreativeInstructions, setSpecificCreativeInstructions] = useState('');

  // --- DATA CHANGE HANDLER ---
  // Whenever any piece of state changes, bundle it all up and send it to the parent component.
  useEffect(() => {
    onDataChange({
      primaryLearningMode,
      secondaryTechniques,
      interactionFrequency,
      specificCreativeInstructions,
    });
  }, [
    primaryLearningMode,
    secondaryTechniques,
    interactionFrequency,
    specificCreativeInstructions,
    onDataChange,
  ]);
  
  // Handler for the checkboxes to manage the string array state
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSecondaryTechniques((prev) =>
      checked ? [...prev, value] : prev.filter((tech) => tech !== value)
    );
  };

  // --- JSX (The HTML structure with Tailwind CSS classes) ---
  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-blue-400 border-b border-gray-700 pb-2">
        5. Instructional Methodology
      </h2>

      {/* Component 1: Primary Learning Goal */}
      <div className="form-group">
        <label htmlFor="primaryLearningMode" className="block mb-2 text-sm font-medium text-gray-300">
          Primary Learning Goal (Select one)
        </label>
        <select
          id="primaryLearningMode"
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={primaryLearningMode}
          onChange={(e) => setPrimaryLearningMode(e.target.value)}
        >
          <option value="Compliance">Compliance (formal tone, rules)</option>
          <option value="Scenario-Based">Scenario-Based (role plays, simulations)</option>
          <option value="Soft Skills">Soft Skills (empathy, communication)</option>
          <option value="Explainer">Explainer (metaphors, diagrams)</option>
        </select>
      </div>

      {/* Component 2: Secondary Teaching Techniques */}
      <div className="form-group">
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Secondary Teaching Techniques (Select all that apply)
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="tech-explainer" value="Explainer" onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
            <label htmlFor="tech-explainer" className="text-gray-300">Explainer (use diagrams & metaphors)</label>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="tech-scenario" value="Scenario-Based" onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
            <label htmlFor="tech-scenario" className="text-gray-300">Scenario-Based (use branching choices)</label>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="tech-softskills" value="Soft Skills" onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
            <label htmlFor="tech-softskills" className="text-gray-300">Soft Skills (focus on empathy)</label>
          </div>
        </div>
      </div>
      
      {/* Component 3: Interaction Frequency */}
      <div className="form-group">
        <label htmlFor="interactionFrequency" className="block mb-2 text-sm font-medium text-gray-300">
          Interaction Frequency (Optional)
        </label>
        <select
          id="interactionFrequency"
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={interactionFrequency}
          onChange={(e) => setInteractionFrequency(e.target.value)}
        >
          <option value="Let AI Decide">Let AI Decide (Recommended)</option>
          <option value="Low">Low (Fewer interactions)</option>
          <option value="Medium">Medium (Approx. every 3-4 pages)</option>
          <option value="High">High (More frequent interactions)</option>
        </select>
      </div>

      {/* Component 4: Specific Creative Instructions */}
      <div className="form-group">
        <label htmlFor="specificCreativeInstructions" className="block mb-2 text-sm font-medium text-gray-300">
          Specific Creative Instructions (Optional)
        </label>
        <textarea
          id="specificCreativeInstructions"
          rows={3}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={specificCreativeInstructions}
          onChange={(e) => setSpecificCreativeInstructions(e.target.value)}
          placeholder="e.g., 'For the section on data privacy, please ensure you use a branching scenario. For all definitions, use a simple click-to-reveal.'"
        />
      </div>
    </div>
  );
};

export default InstructionalMethodology;