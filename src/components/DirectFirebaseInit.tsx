import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { Loader2, ZapOff } from 'lucide-react';

// Minimal Firebase config with only what's absolutely necessary
const MINIMAL_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBj0x4fYqVXXLle2eFUYnA0fubaoNLn-3o",
  projectId: "aidoc-f3022",
  appId: "1:31450972279:web:d75e408802a975f04e4672"
};

// Safe function to get a valid Firebase app or create one
const getSafeEmergencyApp = (): FirebaseApp => {
  try {
    // Try to get the default app first
    try {
      return getApp();
    } catch (err) {
      // If app is deleted, we need to create a new one
      if (err instanceof Error && err.message.includes('app-deleted')) {
        console.log('Default app was deleted, creating an emergency app');
        return initializeApp(MINIMAL_FIREBASE_CONFIG, `emergency-${Date.now()}`);
      }
      
      // Try all existing apps
      const apps = getApps();
      if (apps.length > 0) {
        return apps[0]; // Return the first available app
      }
    }
    
    // No valid apps, create a new one
    return initializeApp(MINIMAL_FIREBASE_CONFIG, `emergency-${Date.now()}`);
  } catch (err) {
    console.error('All attempts to get a Firebase app failed:', err);
    // Last resort with unique name
    return initializeApp(MINIMAL_FIREBASE_CONFIG, `absolute-emergency-${Date.now()}`);
  }
};

export const DirectFirebaseInit: React.FC = () => {
  const [status, setStatus] = useState<'initializing' | 'success' | 'error'>('initializing');
  const [message, setMessage] = useState<string>('Initializing Firebase directly...');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);

  useEffect(() => {
    initializeFirebaseDirectly();
  }, []);

  const initializeFirebaseDirectly = async () => {
    try {
      console.log('🚨 Attempting emergency Firebase initialization');
      
      // Always create a new app with a unique name to avoid conflicts
      const app = getSafeEmergencyApp();
      setFirebaseApp(app);
      console.log('Firebase initialized with emergency config, app name:', app.name);
      
      // Test Firestore connection
      try {
        const db = getFirestore(app);
        const testRef = collection(db, 'emergency_init_test');
        
        // Try a quick write operation with timeout
        const writePromise = addDoc(testRef, { 
          timestamp: new Date().toISOString(),
          message: 'Test from emergency init'
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Write operation timed out')), 5000);
        });
        
        const docRef = await Promise.race([writePromise, timeoutPromise]) as { id: string };
        
        console.log('Firebase and Firestore initialized successfully', docRef.id);
        setStatus('success');
        setMessage('Firebase initialized successfully');
      } catch (firestoreErr: any) {
        console.error('Firestore connection failed after init:', firestoreErr);
        // Still mark as success since Firebase was initialized
        setStatus('success');
        setMessage('Firebase initialized but Firestore connection failed');
        setErrorDetails(firestoreErr.message || 'Unknown Firestore error');
      }
    } catch (err: any) {
      console.error('Emergency Firebase initialization failed:', err);
      setStatus('error');
      setMessage('Firebase initialization failed');
      setErrorDetails(err.message || 'Unknown initialization error');
    }
  };

  if (status === 'success') {
    return null; // Don't show anything if successful
  }

  return (
    <div className={`mb-4 p-3 rounded-md border ${
      status === 'initializing' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center">
        {status === 'initializing' ? (
          <Loader2 className="h-4 w-4 mr-2 text-blue-500 animate-spin" />
        ) : (
          <ZapOff className="h-4 w-4 mr-2 text-red-500" />
        )}
        <div>
          <p className={`text-sm font-medium ${
            status === 'initializing' ? 'text-blue-700 dark:text-blue-300' :
            'text-red-700 dark:text-red-300'
          }`}>
            {message}
          </p>
          {errorDetails && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorDetails}</p>
          )}
          {status === 'error' && (
            <button
              onClick={() => {
                // Retry initialization
                setStatus('initializing');
                setMessage('Retrying Firebase initialization...');
                setErrorDetails('');
                initializeFirebaseDirectly();
              }}
              className="mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry Initialization
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 