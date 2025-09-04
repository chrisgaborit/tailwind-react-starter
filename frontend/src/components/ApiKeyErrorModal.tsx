
import React from 'react';

const ApiKeyErrorModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-red-500">
        <div className="flex items-center mb-4">
          <svg className="h-8 w-8 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-300">Configuration Error</h2>
        </div>
        <p className="text-slate-300 mb-2">
          The application cannot connect to the AI service.
        </p>
        <p className="text-slate-400 text-sm">
          The <strong>API_KEY</strong> environment variable is missing or not configured correctly in the application's environment. This key is required for AI features to function.
        </p>
        <p className="text-slate-400 text-sm mt-3">
          Please ensure the API key is properly set up by the application administrator or in your local development environment. This application does not allow entering the API key directly for security reasons.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyErrorModal;