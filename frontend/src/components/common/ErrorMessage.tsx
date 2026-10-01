import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
}) => {
  // Sanitize message to strip code tracebacks or stack frames
  const sanitizeMessage = (msg: string): string => {
    if (!msg) return 'An unexpected error occurred.';
    // Take only the first line before any traceback or file path details
    const cleanMsg = msg.split('\n')[0].split('    at ')[0].trim();
    return cleanMsg || 'An unexpected error occurred. Please try again.';
  };

  const cleanText = sanitizeMessage(message);

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 my-4" role="alert">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-rose-600 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="text-sm text-rose-700 mt-1">{cleanText}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-rose-300 text-xs font-medium rounded-md text-rose-800 bg-white hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
