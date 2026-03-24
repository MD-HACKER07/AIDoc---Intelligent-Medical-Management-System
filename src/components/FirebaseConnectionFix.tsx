import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, deleteApp, FirebaseOptions, FirebaseApp, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, limit, query, DocumentReference, QuerySnapshot } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Database, RefreshCw, Zap } from 'lucide-react';
import { isFirebaseInitialized, checkFirestoreAccess } from '../config/firebase';

// Original firebase config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBj0x4fYqVXXLle2eFUYnA0fubaoNLn-3o",
  authDomain: "aidoc-f3022.firebaseapp.com",
  projectId: "aidoc-f3022",
  storageBucket: "aidoc-f3022.appspot.com",
  messagingSenderId: "31450972279",
  appId: "1:31450972279:web:d75e408802a975f04e4672",
  databaseURL: "https://aidoc-f3022-default-rtdb.firebaseio.com"
};

// Add timeout constant
const CHECK_TIMEOUT_MS = 5000; // 5 seconds timeout

// Safe function to get Firebase app without crashing
const getSafeFirebaseApp = (): FirebaseApp => {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      // No apps, initialize a new one
      return initializeApp(FIREBASE_CONFIG);
    }
    
    // Try to get the default app
    try {
      return getApp();
    } catch (err) {
      // If default app is deleted, initialize a new one
      if (err instanceof Error && err.message.includes('app-deleted')) {
        console.log('Default app was deleted, creating a new one');
        return initializeApp(FIREBASE_CONFIG);
      }
      throw err;
    }
  } catch (err) {
    console.error('Error getting Firebase app:', err);
    // Last resort - try with a named app
    return initializeApp(FIREBASE_CONFIG, `app-${Date.now()}`);
  }
};

export const FirebaseConnectionFix: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Checking Firebase connection...');
  const [details, setDetails] = useState<string[]>([]);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  // Add state for check timeout
  const [checkTimedOut, setCheckTimedOut] = useState<boolean>(false);
  
  useEffect(() => {
    // Set up a timeout to prevent hanging indefinitely
    const timeoutId = setTimeout(() => {
      if (status === 'checking') {
        console.log('Firebase connection check timed out');
        setCheckTimedOut(true);
        setStatus('error');
        setMessage('Firebase connection check timed out');
        setDetails(prev => [...prev, 'Connection check timed out after 5 seconds']);
        setIsExpanded(true);
      }
    }, CHECK_TIMEOUT_MS);
    
    // Use try-catch to prevent crashes from stopping the component
    try {
      checkConnection();
    } catch (err) {
      console.error('Error during connection check:', err);
      setStatus('error');
      setMessage('Connection check failed');
      setDetails(prev => [...prev, `Error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
      setIsExpanded(true);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  const checkConnection = async () => {
    setStatus('checking');
    setMessage('Checking Firebase connection...');
    setDetails([]);
    setCheckTimedOut(false);
    
    try {
      // Check if Firebase is initialized
      setDetails(prev => [...prev, 'Checking Firebase initialization...']);
      
      // Use our safe function instead
      let firebaseApp: FirebaseApp;
      try {
        firebaseApp = getSafeFirebaseApp();
        setDetails(prev => [...prev, `Firebase app obtained: ${firebaseApp.name}`]);
      } catch (initErr) {
        setDetails(prev => [...prev, `Firebase initialization error: ${initErr instanceof Error ? initErr.message : 'Unknown error'}`]);
        setStatus('error');
        setMessage('Firebase initialization failed');
        return;
      }
      
      // Create a timeout promise to race against
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore access check timed out')), 3000);
      });
      
      // Check Firestore access with timeout
      try {
        setDetails(prev => [...prev, 'Checking Firestore access...']);
        // Try direct Firestore access instead of using the shared function
        const db = getFirestore(firebaseApp);
        
        // Check for permission issues by trying different collections
        const collectionsToTry = ['connection_test', 'patients', 'users', 'debug_write_test'];
        let writeSuccess = false;
        
        for (const collectionName of collectionsToTry) {
          if (writeSuccess) break;
          
          try {
            setDetails(prev => [...prev, `Trying to write to collection: ${collectionName}...`]);
            const testCollection = collection(db, collectionName);
            
            // Use proper type assertion for DocumentReference with longer timeout
            const testDoc = await Promise.race([
              addDoc(testCollection, {
                timestamp: new Date().toISOString(),
                test: true,
                device: navigator.userAgent,
                testId: `test-${Date.now()}`
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error(`Write to ${collectionName} timed out`)), 6000))
            ]) as DocumentReference;
            
            setDetails(prev => [...prev, `Test write successful to ${collectionName}: ${testDoc.id}`]);
            writeSuccess = true;
            
            // Try reading from Firestore with timeout
            try {
              const readPromise = getDocs(query(testCollection, limit(1)));
              
              // Use proper type assertion for QuerySnapshot
              const querySnapshot = await Promise.race([
                readPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Read operation timed out')), 3000))
              ]) as QuerySnapshot;
              
              setDetails(prev => [...prev, `Test read successful: ${querySnapshot.size} documents`]);
            } catch (readErr) {
              setDetails(prev => [...prev, `Read test failed but write succeeded: ${readErr instanceof Error ? readErr.message : 'Unknown error'}`]);
              // Continue since write was successful
            }
          } catch (collErr) {
            setDetails(prev => [...prev, `Failed write to ${collectionName}: ${collErr instanceof Error ? collErr.message : 'Unknown error'}`]);
            
            // Check for permission errors specifically
            if (collErr instanceof Error && collErr.message.includes('permission-denied')) {
              setDetails(prev => [...prev, `Permission denied for ${collectionName}. Trying next collection...`]);
            }
          }
        }
        
        // Check write success status
        if (writeSuccess) {
          // All tests passed
          setStatus('working');
          setMessage('Firebase connection is working properly');
        } else {
          throw new Error('All write attempts failed');
        }
      } catch (accessErr) {
        setDetails(prev => [...prev, `Firestore access error: ${accessErr instanceof Error ? accessErr.message : 'Unknown error'}`]);
        
        // Special handling for common error cases
        if (accessErr instanceof Error) {
          if (accessErr.message.includes('permission-denied')) {
            setMessage('Firebase permission denied error');
            setDetails(prev => [...prev, 'You may not have the right permissions to access Firestore. Check your security rules.']);
          } else if (accessErr.message.includes('unavailable')) {
            setMessage('Firebase service unavailable');
            setDetails(prev => [...prev, 'The Firebase service may be down or unreachable. Check your internet connection.']);
          } else if (accessErr.message.includes('network-request-failed')) {
            setMessage('Network error connecting to Firebase');
            setDetails(prev => [...prev, 'Check your internet connection and any firewalls or VPNs.']);
          } else {
            setMessage('Cannot access Firestore');
          }
        } else {
          setMessage('Cannot access Firestore');
        }
        
        setStatus('error');
        return;
      }
    } catch (error: any) {
      setDetails(prev => [...prev, `Error: ${error.message}`]);
      setStatus('error');
      setMessage('Error checking Firebase connection');
    }
  };
  
  const fixConnection = async () => {
    try {
      setIsFixing(true);
      setDetails(prev => [...prev, '---------------------']);
      setDetails(prev => [...prev, 'Starting connection repair...']);
      
      // Clear existing apps
      const existingApps = getApps();
      setDetails(prev => [...prev, `Found ${existingApps.length} existing Firebase apps`]);
      
      // Safe deletion of apps with error handling
      for (const app of existingApps) {
        try {
          setDetails(prev => [...prev, `Attempting to delete app: ${app.name}`]);
          await deleteApp(app);
          setDetails(prev => [...prev, `Successfully deleted app: ${app.name}`]);
        } catch (deleteError: any) {
          // Handle already deleted apps gracefully
          if (deleteError.message && deleteError.message.includes('app-deleted')) {
            setDetails(prev => [...prev, `App ${app.name} was already deleted`]);
          } else {
            setDetails(prev => [...prev, `Failed to delete app: ${deleteError.message}`]);
          }
        }
      }
      
      // Create a fresh app with a unique name to avoid conflicts
      setDetails(prev => [...prev, 'Initializing new Firebase app...']);
      const appName = `fixed-app-${Date.now()}`;
      let newApp: FirebaseApp;
      
      try {
        newApp = initializeApp(FIREBASE_CONFIG, appName);
        setDetails(prev => [...prev, `New Firebase app "${appName}" initialized successfully`]);
      } catch (initError: any) {
        setDetails(prev => [...prev, `Full config initialization failed: ${initError.message}`]);
        
        // Try minimal config
        const minimalConfig = {
          apiKey: FIREBASE_CONFIG.apiKey,
          projectId: FIREBASE_CONFIG.projectId,
          appId: FIREBASE_CONFIG.appId
        };
        
        setDetails(prev => [...prev, 'Trying minimal config...']);
        newApp = initializeApp(minimalConfig, `minimal-${Date.now()}`);
        setDetails(prev => [...prev, 'Minimal config initialization successful']);
      }
      
      // Test the new app
      const newDb = getFirestore(newApp);
      setDetails(prev => [...prev, 'New Firestore instance created']);
      
      // Test write with timeout
      try {
        const testRef = collection(newDb, 'fix_connection_test');
        
        const writePromise = addDoc(testRef, {
          timestamp: new Date().toISOString(),
          fixed: true
        });
        
        // Use proper type assertion for DocumentReference
        const docRef = await Promise.race([
          writePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test write timed out')), 5000))
        ]) as DocumentReference;
        
        setDetails(prev => [...prev, `Test write successful with new instance: ${docRef.id}`]);
        setStatus('working');
        setMessage('Firebase connection has been fixed!');
        
        // Force reload to use the new instance
        setDetails(prev => [...prev, 'Reloading page to apply changes...']);
        setTimeout(() => window.location.reload(), 2000);
      } catch (writeError: any) {
        setDetails(prev => [...prev, `Test write with new instance failed: ${writeError.message}`]);
        setStatus('error');
        setMessage('Failed to fix connection. See details for more information.');
      }
    } catch (error: any) {
      setDetails(prev => [...prev, `Error during fix: ${error.message}`]);
      setStatus('error');
      setMessage('Failed to fix Firebase connection');
    } finally {
      setIsFixing(false);
      setIsExpanded(true);
    }
  };
  
  // Force expanded details if in error state or timed out
  useEffect(() => {
    if (status === 'error' || checkTimedOut) {
      setIsExpanded(true);
    }
  }, [status, checkTimedOut]);
  
  return (
    <div className={`mb-4 p-4 rounded-md border ${
      status === 'checking' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 
      status === 'working' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {status === 'checking' ? (
            <Database className="h-5 w-5 text-blue-500 mr-2 animate-pulse" />
          ) : status === 'working' ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          
          <div>
            <h3 className={`text-sm font-medium ${
              status === 'checking' ? 'text-blue-700 dark:text-blue-300' : 
              status === 'working' ? 'text-green-700 dark:text-green-300' : 
              'text-red-700 dark:text-red-300'
            }`}>
              {message}
            </h3>
            
            {isExpanded && details.length > 0 && (
              <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                {details.map((detail, index) => (
                  <div 
                    key={index} 
                    className={
                      detail.includes('successful') ? 'text-green-600 dark:text-green-400' : 
                      detail.includes('error') || detail.includes('failed') || detail.includes('timed out') ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-600 dark:text-gray-400'
                    }
                  >
                    {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkConnection}
            disabled={isFixing}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Check connection"
          >
            <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? (
              <span className="text-xs">Hide</span>
            ) : (
              <span className="text-xs">Details</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Show fix button either on error or if the check has been running too long */}
      {(status === 'error' || checkTimedOut) && (
        <div className="mt-3">
          <button
            onClick={fixConnection}
            disabled={isFixing}
            className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Fix Connection
              </>
            )}
          </button>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This will attempt to reset and reinitialize the Firebase connection.
            The page will refresh if successful.
          </p>
        </div>
      )}
      
      {/* Force-show the Fix button if checking takes too long */}
      {status === 'checking' && (
        <div className="mt-3">
          <button
            onClick={() => {
              // Force error state to show fix button
              setStatus('error');
              setMessage('Manual intervention required');
              setDetails(prev => [...prev, 'User requested manual fix']);
              setIsExpanded(true);
            }}
            className="flex items-center px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            <Zap className="h-3 w-3 mr-1" />
            Skip Check &amp; Fix Now
          </button>
        </div>
      )}
    </div>
  );
}; 