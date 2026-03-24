// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp, getApp, deleteApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj0x4fYqVXXLle2eFUYnA0fubaoNLn-3o",
  authDomain: "aidoc-f3022.firebaseapp.com",
  projectId: "aidoc-f3022",
  storageBucket: "aidoc-f3022.appspot.com",
  messagingSenderId: "31450972279",
  appId: "1:31450972279:web:d75e408802a975f04e4672",
  databaseURL: "https://aidoc-f3022-default-rtdb.firebaseio.com" // Realtime Database URL
};

// Export the config for reuse
export const FIREBASE_CONFIG = firebaseConfig;

// Create a safe Firebase app getter that handles app-deleted errors
export const getSafeApp = (): FirebaseApp => {
  try {
    // Check for existing apps first
    const apps = getApps();
    
    if (apps.length === 0) {
      // No apps exist, initialize a new one
      console.log("No Firebase apps exist, initializing new app");
      return initializeApp(firebaseConfig);
    }
    
    // Try to get the default app
    try {
      return getApp();
    } catch (err) {
      // Handle app-deleted error
      if (err instanceof Error && err.message.includes('app-deleted')) {
        console.log("Default Firebase app was deleted, initializing new app");
        return initializeApp(firebaseConfig);
      }
      
      // Other error with getApp, use first app in the list
      console.warn("Error getting default app:", err);
      if (apps.length > 0) {
        return apps[0];
      }
    }
    
    // Fallback to creating a new app with unique name
    console.log("Creating a new Firebase app with unique name");
    return initializeApp(firebaseConfig, `app-${Date.now()}`);
  } catch (error) {
    console.error("All Firebase app initialization methods failed:", error);
    
    // Last resort - try with minimal config
    try {
      const minimalConfig = {
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        appId: firebaseConfig.appId
      };
      return initializeApp(minimalConfig, `emergency-${Date.now()}`);
    } catch (e) {
      console.error("Even minimal config failed:", e);
      // Return empty object as last resort (this will likely fail in usage)
      return {} as FirebaseApp;
    }
  }
};

// Initialize Firebase with better error handling
let app: FirebaseApp;
let firebaseInitialized = false;

try {
  if (getApps().length === 0) {
    console.log("Initializing Firebase...");
    app = initializeApp(firebaseConfig);
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
  } else {
    console.log("Firebase already initialized, reusing existing app");
    try {
      app = getApp();
    } catch (appError) {
      // Handle app-deleted error specifically
      if (appError instanceof Error && appError.message.includes('app-deleted')) {
        console.log("App was deleted, reinitializing");
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }
    }
    firebaseInitialized = true;
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  firebaseInitialized = false;
  
  // Attempt re-initialization with minimal config
  try {
    console.log("Attempting fallback initialization...");
    const minimalConfig = {
      apiKey: firebaseConfig.apiKey,
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId
    };
    app = initializeApp(minimalConfig);
    firebaseInitialized = true;
    console.log("Firebase initialized with minimal config");
  } catch (fallbackError) {
    console.error("Fallback initialization also failed:", fallbackError);
    
    // Create a mock app as last resort
    app = {} as FirebaseApp;
  }
}

// Initialize Firebase services with error handling
export const auth = (() => {
  try {
    // Use getSafeApp to ensure we have a valid app
    const safeApp = getSafeApp();
    const authInstance = getAuth(safeApp);
    console.log("Auth initialized");
    return authInstance;
  } catch (error) {
    console.error("Error initializing Auth:", error);
    return null;
  }
})();

export const googleProvider = new GoogleAuthProvider();

export const db = (() => {
  try {
    // Use getSafeApp to ensure we have a valid app
    const safeApp = getSafeApp();
    const firestoreInstance = getFirestore(safeApp);
    console.log("Firestore initialized");
    
    try {
      // Test connection by accessing the type property
      console.log("Firestore type:", (firestoreInstance as any)._databaseId?.projectId);
    } catch (e) {
      console.warn("Could not verify Firestore connection details:", e);
    }
  
    return firestoreInstance;
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    return null;
  }
})();

export const storage = (() => {
  try {
    // Use getSafeApp to ensure we have a valid app
    const safeApp = getSafeApp();
    const storageInstance = getStorage(safeApp);
    console.log("Storage initialized");
    return storageInstance;
  } catch (error) {
    console.error("Error initializing Storage:", error);
    return null;
  }
})();

export const rtdb = (() => {
  try {
    // Use getSafeApp to ensure we have a valid app
    const safeApp = getSafeApp();
    const dbInstance = getDatabase(safeApp);
    console.log("Realtime Database initialized");
    return dbInstance;
  } catch (error) {
    console.error("Error initializing Realtime Database:", error);
    return null;
  }
})();

// Helper function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  try {
    // Check if any apps exist
    const apps = getApps();
    if (apps.length === 0) return false;
    
    // Try to get a default app
    try {
      const app = getApp();
      return !!app;
    } catch (err) {
      // App was deleted
      if (err instanceof Error && err.message.includes('app-deleted')) {
        return false;
      }
      
      // Other error, but we have apps
      return apps.length > 0;
    }
  } catch (e) {
    console.error("Error checking Firebase initialization:", e);
    return false;
  }
};

// Enhanced Firestore access check with recovery
export const checkFirestoreAccess = async () => {
  try {
    // Get safe Firestore instance
    const safeApp = getSafeApp();
    const safeDb = getFirestore(safeApp);
    
    // Try accessing Firestore
    const test = safeDb.type;
    return { success: true, details: { type: test } };
  } catch (error) {
    console.error("Error checking Firestore access:", error);
    return { success: false, error: (error instanceof Error) ? error.message : "Unknown error" };
  }
};

// Function to completely reset Firebase
export const resetFirebase = async () => {
  try {
    // Delete all existing apps
    const apps = getApps();
    console.log(`Attempting to delete ${apps.length} Firebase apps`);
    
    for (const app of apps) {
      try {
        await deleteApp(app);
        console.log(`Successfully deleted app: ${app.name}`);
      } catch (err) {
        console.error(`Failed to delete app ${app.name}:`, err);
      }
    }
    
    // Initialize a fresh app
    const freshApp = initializeApp(firebaseConfig, `reset-${Date.now()}`);
    console.log(`Created fresh Firebase app: ${freshApp.name}`);
    
    // Return the new app
    return { success: true, app: freshApp };
  } catch (error) {
    console.error("Error resetting Firebase:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export default app; 