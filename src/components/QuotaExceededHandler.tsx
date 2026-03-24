import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, ReceiptText, RefreshCw } from 'lucide-react';

interface QuotaExceededHandlerProps {
  error?: Error | null;
  message?: string;
  onClose?: () => void;
}

export const QuotaExceededHandler: React.FC<QuotaExceededHandlerProps> = ({ 
  error, 
  message,
  onClose 
}) => {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  useEffect(() => {
    // Check if the error or message indicates a quota exceeded issue
    const checkForQuotaError = () => {
      const quotaKeywords = [
        'quota exceeded',
        'exceeded no-cost limits',
        'exceeded quota',
        'resource exhausted',
        'limit exceeded',
        'billing required',
        'quota has been exhausted',
        'upgrade your plan'
      ];
      
      let errorText = '';
      
      if (error?.message) {
        errorText = error.message.toLowerCase();
      }
      
      if (message) {
        errorText += ' ' + message.toLowerCase();
      }
      
      // Check if the error contains any of the quota keywords
      const isQuotaError = quotaKeywords.some(keyword => errorText.includes(keyword));
      
      setIsQuotaExceeded(isQuotaError);
      setErrorDetails(error?.message || message || '');
    };
    
    checkForQuotaError();
  }, [error, message]);
  
  // If there's no quota exceeded error, don't render anything
  if (!isQuotaExceeded) {
    return null;
  }
  
  return (
    <div className="mb-4 p-4 rounded-md border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Firebase Quota Exceeded
          </h3>
          
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Your Firebase project has reached its free tier limits. This is why patients 
            are not being saved to the database. You need to upgrade to the paid plan 
            to continue using the application.
          </p>
          
          {errorDetails && (
            <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded text-xs text-yellow-800 dark:text-yellow-200 font-mono overflow-auto">
              {errorDetails}
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
              Here's what you can do:
            </h4>
            
            <ol className="text-xs text-yellow-700 dark:text-yellow-300 list-decimal pl-5 space-y-1">
              <li>
                <span className="font-medium">Upgrade Firebase Plan:</span> Go to the 
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mx-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Firebase Console
                </a>
                and upgrade to the Blaze (pay-as-you-go) plan.
              </li>
              <li>
                <span className="font-medium">Optimize Usage:</span> Reduce the frequency of 
                database operations to stay within the free limits.
              </li>
              <li>
                <span className="font-medium">Wait for Reset:</span> Wait until tomorrow 
                when the quota resets (Firebase quotas are daily).
              </li>
            </ol>
          </div>
          
          <div className="mt-3 flex space-x-2">
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Upgrade Firebase
            </a>
            
            <a
              href="https://firebase.google.com/docs/firestore/quotas"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 inline-flex items-center"
            >
              <ReceiptText className="h-3 w-3 mr-1" />
              Quota Info
            </a>
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 inline-flex items-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 