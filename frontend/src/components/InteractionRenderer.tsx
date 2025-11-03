// frontend/src/components/InteractionRenderer.tsx
import { InteractionDetails } from '../types/interactionTypes';
import ClickToReveal from './interactions/ClickToReveal';
import MultiSelectQuiz from './interactions/MultiSelectQuiz';

/**
 * InteractionRenderer - Central Dispatcher
 * 
 * Routes scene.interactionDetails to the appropriate interaction component
 * based on the interaction type.
 * 
 * This is the bridge between backend-generated interaction content and
 * frontend React components.
 */

interface InteractionRendererProps {
  interactionDetails?: InteractionDetails;
}

export default function InteractionRenderer({ interactionDetails }: InteractionRendererProps) {
  // No interaction
  if (!interactionDetails || interactionDetails.type === 'none') {
    return null;
  }

  // Log for debugging (can be removed in production)
  console.log('🎨 Rendering interaction:', interactionDetails.type, interactionDetails.templateData);

  // Validate templateData exists
  if (!interactionDetails.templateData) {
    console.warn(`⚠️ No templateData provided for interaction type: ${interactionDetails.type}`);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
        <p className="text-yellow-800 text-sm">
          <strong>Interaction Error:</strong> No data available for this interaction type.
        </p>
      </div>
    );
  }

  // Route to appropriate component based on type
  switch (interactionDetails.type) {
    case 'click_to_reveal':
      return <ClickToReveal {...interactionDetails.templateData} />;

    case 'multi_select_quiz':
      return <MultiSelectQuiz {...interactionDetails.templateData} />;

    // Placeholder for other interaction types
    case 'drag_and_drop':
    case 'scenario_simulation':
    case 'single_select_quiz':
    case 'hotspot_exploration':
      return (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg my-4">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                {interactionDetails.title}
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                This <strong>{interactionDetails.type}</strong> interaction is coming soon!
              </p>
              {interactionDetails.interactionSteps && interactionDetails.interactionSteps.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-blue-700 font-medium mb-1">Planned Steps:</p>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {interactionDetails.interactionSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg my-4">
          <p className="text-gray-700 text-sm">
            <strong>Unknown interaction type:</strong> {interactionDetails.type}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(interactionDetails, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
  }
}


