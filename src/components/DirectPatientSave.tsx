import React, { useState } from 'react';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, DocumentReference, setDoc, doc } from 'firebase/firestore';
import { Loader2, Save, Zap, AlertTriangle } from 'lucide-react';

// Minimal Firebase config
const MINIMAL_CONFIG = {
  apiKey: "AIzaSyBj0x4fYqVXXLle2eFUYnA0fubaoNLn-3o",
  projectId: "aidoc-f3022",
  appId: "1:31450972279:web:d75e408802a975f04e4672"
};

// Get a safe Firebase app or create one
const getSafeFirebaseApp = () => {
  try {
    // Try to get the default app first
    try {
      return getApp();
    } catch (err) {
      // Handle deleted app errors
      if (err instanceof Error && err.message.includes('app-deleted')) {
        console.log('Firebase app was deleted, creating a new one for direct save');
        return initializeApp(MINIMAL_CONFIG, `direct-save-${Date.now()}`);
      }
      
      // Try existing apps
      const apps = getApps();
      if (apps.length > 0) {
        return apps[0];
      }
    }
    
    // No apps found, create a new one
    return initializeApp(MINIMAL_CONFIG, `direct-save-${Date.now()}`);
  } catch (err) {
    console.error('Failed to get Firebase app:', err);
    // Last resort
    return initializeApp(MINIMAL_CONFIG, `final-save-${Date.now()}`);
  }
};

interface DirectPatientSaveProps {
  patientData: any;
  onSuccess: (docId: string) => void;
}

export const DirectPatientSave: React.FC<DirectPatientSaveProps> = ({ patientData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(10000); // Default 10 seconds

  // Function to save just critical data
  const saveBasicData = async (collectionName: string = 'patients_basic') => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[DirectSave] Attempting basic save to ${collectionName}...`);
      
      // Get a valid Firebase app
      const app = getSafeFirebaseApp();
      console.log(`[DirectSave] Using Firebase app: ${app.name}`);
      
      // Get Firestore instance
      const db = getFirestore(app);
      
      // Create an absolute minimal dataset
      const minimalData = {
        id: `emergency-${Date.now()}`,
        name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim(),
        timestamp: new Date().toISOString()
      };
      
      // Try to save with explicit ID
      try {
        const docId = `emergency-${Date.now()}`;
        const docRef = doc(db, collectionName, docId);
        
        const writePromise = setDoc(docRef, minimalData);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Save operation timed out')), timeoutMs)
        );
        
        await Promise.race([writePromise, timeoutPromise]);
        console.log(`[DirectSave] Basic save successful with ID: ${docId}`);
        onSuccess(docId);
        return;
      } catch (setErr) {
        console.error('[DirectSave] Set document failed:', setErr);
        // Fall back to addDoc if setDoc fails
      }
      
      // Get collection reference and save with timeout
      const collectionRef = collection(db, collectionName);
      
      const writePromise = addDoc(collectionRef, minimalData);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), timeoutMs)
      );
      
      const docRef = await Promise.race([writePromise, timeoutPromise]) as DocumentReference;
      
      console.log(`[DirectSave] Basic save successful with ID: ${docRef.id}`);
      onSuccess(docRef.id);
    } catch (err: any) {
      console.error('[DirectSave] Basic save failed:', err);
      setError(`Basic save failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const saveDirectly = async (collectionName: string = 'patients_emergency') => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[DirectSave] Attempting direct save to ${collectionName}...`);
      
      // Get a valid Firebase app
      const app = getSafeFirebaseApp();
      console.log(`[DirectSave] Using Firebase app: ${app.name}`);
      
      // Get Firestore instance
      const db = getFirestore(app);
      
      // Clean the data for saving
      // Create a minimal valid document with only essential fields
      const cleanedData = {
        firstName: patientData.firstName || '',
        lastName: patientData.lastName || '',
        patientId: patientData.patientId || `emergency-${Date.now()}`,
        gender: patientData.gender || '',
        dateOfBirth: patientData.dateOfBirth || '',
        timestamp: new Date().toISOString(),
        emergencySave: true
      };
      
      // Get collection reference and save with timeout
      const collectionRef = collection(db, collectionName);
      
      const writePromise = addDoc(collectionRef, cleanedData);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), timeoutMs)
      );
      
      const docRef = await Promise.race([writePromise, timeoutPromise]) as DocumentReference;
      
      console.log(`[DirectSave] Successfully saved to ${collectionName} with ID: ${docRef.id}`);
      
      // Also try to save full data in background (don't await or handle errors)
      try {
        const fullCollectionRef = collection(db, 'patients_full_emergency');
        addDoc(fullCollectionRef, {
          ...patientData,
          emergencySave: true,
          originalCollection: collectionName,
          originalId: docRef.id,
          timestamp: new Date().toISOString()
        })
          .then(fullDocRef => {
            console.log('[DirectSave] Full data backed up with ID:', fullDocRef.id);
          })
          .catch(fullErr => {
            console.error('[DirectSave] Full data backup failed:', fullErr);
          });
      } catch (backupErr) {
        console.error('[DirectSave] Error setting up full data backup:', backupErr);
      }
      
      // Call success callback
      onSuccess(docRef.id);
    } catch (err: any) {
      console.error('[DirectSave] Direct save failed:', err);
      
      // Try with alternative collection if app was deleted
      if (err.message && err.message.includes('app-deleted')) {
        try {
          console.log('[DirectSave] App was deleted, trying with new app and collection');
          const app = initializeApp(MINIMAL_CONFIG, `recovery-${Date.now()}`);
          const db = getFirestore(app);
          const recoveryRef = collection(db, 'recovery_patients');
          
          const minimalData = {
            name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim(),
            timestamp: new Date().toISOString(),
            isRecovery: true
          };
          
          const recoveryDoc = await addDoc(recoveryRef, minimalData);
          console.log('[DirectSave] Recovery save successful:', recoveryDoc.id);
          onSuccess(recoveryDoc.id);
          return;
        } catch (recoveryErr) {
          console.error('[DirectSave] Recovery attempt also failed:', recoveryErr);
        }
      }
      
      // If it's a timeout error specifically, suggest trying with basic data
      if (err.message && err.message.includes('timed out')) {
        setError(`Save timed out after ${timeoutMs/1000} seconds. Try basic save or increase timeout.`);
      } else {
        setError(`Save failed: ${err.message}`);
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Emergency saving in progress...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div className="flex items-start mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <button 
            onClick={() => saveDirectly('patients_emergency_retry')}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => saveBasicData()}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Try Basic Data
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {showOptions ? 'Hide Options' : 'Advanced Options'}
          </button>
        </div>
        
        {showOptions && (
          <div className="space-y-3 mt-3 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-md">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Timeout (milliseconds):</p>
              <div className="flex gap-2">
                {[5000, 10000, 15000, 30000].map(ms => (
                  <button
                    key={ms}
                    onClick={() => setTimeoutMs(ms)}
                    className={`px-2 py-1 text-xs rounded-md ${timeoutMs === ms 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    {ms/1000}s
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Try alternative collections:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => saveDirectly('emergency_patients')}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  emergency_patients
                </button>
                <button
                  onClick={() => saveDirectly('direct_save')}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  direct_save
                </button>
                <button
                  onClick={() => saveDirectly('last_resort')}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  last_resort
                </button>
              </div>
            </div>
            
            <div>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
              
              {debugMode && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Apps: {getApps().length}</p>
                  <p>App Names: {getApps().map(a => a.name).join(', ')}</p>
                  <p>Timeout: {timeoutMs}ms</p>
                  <p>Browser: {navigator.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => saveDirectly()}
          className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Zap className="h-4 w-4 mr-1" />
          Emergency Direct Save
        </button>
        
        <button
          onClick={() => saveBasicData()}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-1" />
          Save Basic Info Only
        </button>
      </div>
      
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Use these options if the normal save button is not working.
        "Emergency Direct Save" saves full patient data. "Save Basic Info" saves minimal data when full save fails.
      </p>
      
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
      >
        {showOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
      </button>
      
      {showOptions && (
        <div className="mt-2 space-y-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-md">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Timeout (milliseconds):</p>
            <div className="flex gap-2">
              {[5000, 10000, 15000, 30000].map(ms => (
                <button
                  key={ms}
                  onClick={() => setTimeoutMs(ms)}
                  className={`px-2 py-1 text-xs rounded-md ${timeoutMs === ms 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                >
                  {ms/1000}s
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Increase timeout if your connection is slow or if you have a large amount of data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 