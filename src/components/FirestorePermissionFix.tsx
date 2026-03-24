import React, { useState, useEffect } from 'react';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, limit, query, DocumentReference } from 'firebase/firestore';
import { Loader2, LockKeyhole, UnlockKeyhole, RefreshCw, Check, X } from 'lucide-react';

// Common collections to test
const TEST_COLLECTIONS = [
  'patients',
  'users',
  'emergency_data',
  'test_collection',
  'permissions_test',
  'connection_test',
  'public_data'
];

export const FirestorePermissionFix: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, {read: boolean; write: boolean; error?: string}>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [hasWritableCollection, setHasWritableCollection] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const getSafeFirebaseApp = () => {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        try {
          return getApp();
        } catch (err) {
          return apps[0];
        }
      }
      
      // No apps available, this is more for type safety - the component shouldn't render in this case
      console.error('No Firebase apps available');
      return null;
    } catch (err) {
      console.error('Error getting Firebase app:', err);
      return null;
    }
  };

  const checkPermissions = async () => {
    setIsLoading(true);
    setResults({});
    
    const app = getSafeFirebaseApp();
    if (!app) {
      setIsLoading(false);
      return;
    }
    
    const db = getFirestore(app);
    let foundWritable = false;
    
    const newResults: Record<string, {read: boolean; write: boolean; error?: string}> = {};
    
    for (const collName of TEST_COLLECTIONS) {
      try {
        newResults[collName] = { read: false, write: false };
        
        // Test read
        try {
          const querySnapshot = await getDocs(query(collection(db, collName), limit(1)));
          newResults[collName].read = true;
        } catch (readErr: any) {
          newResults[collName].read = false;
          if (readErr.message.includes('permission-denied')) {
            newResults[collName].error = 'Permission denied for read';
          }
        }
        
        // Test write
        try {
          const docRef = await addDoc(collection(db, collName), {
            test: true,
            timestamp: new Date().toISOString(),
            device: navigator.userAgent.substring(0, 50)
          });
          
          newResults[collName].write = true;
          foundWritable = true;
          
          // Try to clean up by deleting the test document
          try {
            // We're not awaiting this to avoid blocking the UI
            // Also, if delete fails, it's not critical
            // deleteDoc(doc(db, collName, docRef.id));
          } catch (cleanupErr) {
            console.warn(`Couldn't clean up test document in ${collName}`, cleanupErr);
          }
        } catch (writeErr: any) {
          newResults[collName].write = false;
          if (writeErr.message.includes('permission-denied')) {
            newResults[collName].error = 'Permission denied for write';
          } else if (writeErr.message.includes('network-request-failed')) {
            newResults[collName].error = 'Network error during write';
          } else if (writeErr.message.includes('timeout')) {
            newResults[collName].error = 'Write operation timed out';
          } else {
            newResults[collName].error = writeErr.message.substring(0, 100);
          }
        }
      } catch (err: any) {
        newResults[collName] = { 
          read: false, 
          write: false, 
          error: err.message || 'Unknown error'
        };
      }
    }
    
    setResults(newResults);
    setHasWritableCollection(foundWritable);
    setIsLoading(false);
  };

  // Handle case where there are no Firebase apps
  if (getApps().length === 0) {
    return (
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="flex items-center">
          <LockKeyhole className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Cannot check Firestore permissions - Firebase is not initialized
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Find a collection with write permission if one exists
  const getWritableCollection = () => {
    return Object.entries(results).find(([_, perms]) => perms.write)?.[0];
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (hasWritableCollection === true) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (hasWritableCollection === false) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  return (
    <div className={`mb-4 p-4 rounded-md border ${getStatusColor()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
          ) : hasWritableCollection ? (
            <UnlockKeyhole className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <LockKeyhole className="h-5 w-5 text-red-500 mr-2" />
          )}
          
          <div>
            <h3 className={`text-sm font-medium ${
              isLoading ? 'text-blue-700 dark:text-blue-300' : 
              hasWritableCollection ? 'text-green-700 dark:text-green-300' : 
              'text-red-700 dark:text-red-300'
            }`}>
              {isLoading
                ? 'Checking Firestore permissions...'
                : hasWritableCollection
                  ? `Firestore write access: ${getWritableCollection()}`
                  : 'No writable Firestore collections found'}
            </h3>
            
            {hasWritableCollection === false && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                You don't have permission to write to any tested collections.
                This is likely why patient data isn't being saved.
              </p>
            )}
            
            {showDetails && (
              <div className="mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-1">Collection</th>
                      <th className="text-center py-1">Read</th>
                      <th className="text-center py-1">Write</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results).map(([collection, perms]) => (
                      <tr key={collection} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1">{collection}</td>
                        <td className="text-center py-1">
                          {perms.read ? (
                            <Check className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 inline" />
                          )}
                        </td>
                        <td className="text-center py-1">
                          {perms.write ? (
                            <Check className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-2 space-y-1">
                  {Object.entries(results)
                    .filter(([_, perms]) => perms.error)
                    .map(([collection, perms]) => (
                      <p key={collection} className="text-xs text-red-600 dark:text-red-400">
                        {collection}: {perms.error}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkPermissions}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Check permissions"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showDetails ? (
              <span className="text-xs">Hide</span>
            ) : (
              <span className="text-xs">Details</span>
            )}
          </button>
        </div>
      </div>
      
      {hasWritableCollection === false && (
        <div className="mt-3">
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
            Permission issue detected. Here are some possible solutions:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
            <li>Check that you're signed in with the correct account</li>
            <li>Make sure your Firebase security rules allow write access</li>
            <li>Try using the "Emergency Direct Save" option to use alternative collections</li>
            <li>Contact the app administrator for help with permissions</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FirestorePermissionFix; 