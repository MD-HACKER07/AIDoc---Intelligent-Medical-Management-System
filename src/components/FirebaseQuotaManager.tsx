import React, { useState } from 'react';
import { Database, DollarSign, HardDrive, ServerOff, AlertTriangle, BarChart } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

interface FirebaseQuotaManagerProps {
  patientData?: any;
  onMySQLSave?: (id: string) => void;
}

export const FirebaseQuotaManager: React.FC<FirebaseQuotaManagerProps> = () => {
  const { 
    databaseType, 
    setDatabaseType, 
    isFirebaseAvailable, 
    isMySQLAvailable,
    quotaExceeded,
    statusMessage
  } = useDatabase();
  
  const [showSettings, setShowSettings] = useState(false);
  
  // Database type options
  const databaseOptions = [
    { value: 'auto', label: 'Auto (Prefer Firebase)', icon: Database },
    { value: 'firebase', label: 'Firebase Only', icon: HardDrive },
    { value: 'mysql', label: 'MySQL Only', icon: ServerOff }
  ];
  
  const handleDatabaseChange = (type: 'firebase' | 'mysql' | 'auto') => {
    setDatabaseType(type);
  };
  
  return (
    <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Database Configuration
          </h3>
        </div>
        
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40"
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>
      
      {showSettings && (
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* Database Status */}
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center px-3 py-1 rounded-full text-xs ${
                isFirebaseAvailable ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 
                'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                <div className={`h-2 w-2 rounded-full mr-1.5 ${
                  isFirebaseAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                Firebase: {isFirebaseAvailable ? 'Available' : 'Unavailable'}
              </div>
              
              <div className={`flex items-center px-3 py-1 rounded-full text-xs ${
                isMySQLAvailable ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 
                'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                <div className={`h-2 w-2 rounded-full mr-1.5 ${
                  isMySQLAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                MySQL: {isMySQLAvailable ? 'Available' : 'Unavailable'}
              </div>
              
              {quotaExceeded && (
                <div className="flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Firebase Quota Exceeded
                </div>
              )}
            </div>
            
            {/* Database Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Database
              </label>
              <div className="grid grid-cols-3 gap-2">
                {databaseOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDatabaseChange(option.value as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border ${
                      databaseType === option.value 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <option.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status Message */}
            {statusMessage && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                {statusMessage}
              </div>
            )}
            
            {/* Firebase Quota Info */}
            {quotaExceeded && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      Firebase Quota Exceeded
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                      Your Firebase free tier quota has been exceeded. Consider the following options:
                    </p>
                    <div className="space-y-2">
                      <a 
                        href="https://console.firebase.google.com/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        Upgrade Firebase Plan
                      </a>
                      <a 
                        href="https://firebase.google.com/docs/firestore/quotas" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <BarChart className="h-3.5 w-3.5 mr-1" />
                        Check Firebase Quotas
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* MySQL Fallback Message */}
            {quotaExceeded && databaseType === 'mysql' && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                <p>
                  <span className="font-medium">✓</span> MySQL database is currently being used as a fallback.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Quick Alert When Quota Exceeded but Panel Closed */}
      {!showSettings && quotaExceeded && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-xs flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
          Firebase quota exceeded. Currently using {databaseType === 'mysql' ? 'MySQL' : 'Firebase with limitations'}.
          <button 
            onClick={() => setShowSettings(true)}
            className="ml-auto underline hover:text-yellow-600 dark:hover:text-yellow-200"
          >
            Manage
          </button>
        </div>
      )}
    </div>
  );
}; 