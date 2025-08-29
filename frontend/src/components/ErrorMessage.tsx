
import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div 
      className="bg-red-700 bg-opacity-30 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative max-w-xl w-full mx-auto shadow-lg" 
      role="alert"
    >
      <strong className="font-bold block mb-1">Error!</strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorMessage;