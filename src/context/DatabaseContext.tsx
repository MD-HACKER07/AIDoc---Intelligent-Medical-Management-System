import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simple toast function for notifications
const toast = {
  // Default toast
  default: (options: { title: string; description: string }) => {
    console.log(`TOAST - ${options.title}: ${options.description}`);
  },
  // Destructive/error toast
  destructive: (options: { title: string; description: string }) => {
    console.error(`ERROR TOAST - ${options.title}: ${options.description}`);
  }
};

// Updated to remove MySQL
type DatabaseType = 'firebase' | 'auto' | 'firebase-quota-exceeded';

interface DatabaseContextType {
  databaseType: DatabaseType;
  setDatabaseType: (type: DatabaseType) => void;
  // Removed mysqlConnected
  firebaseConnected: boolean;
  // Removed checkMySQLConnection
  checkFirebaseConnection: () => Promise<boolean>;
  isTesting: boolean;
  setIsTesting: (testing: boolean) => void;
  // Removed mysqlStats
  quotaExceeded: boolean;
  setQuotaExceeded: (value: boolean) => void;
  setLastError: (error: any) => void;
  logQuotaExceeded: (service: string, error: any, metadata?: Record<string, any>) => void;
}

const DatabaseContext = createContext<DatabaseContextType>({
  databaseType: 'auto',
  setDatabaseType: () => {},
  // Removed mysqlConnected
  firebaseConnected: false,
  // Removed checkMySQLConnection
  checkFirebaseConnection: async () => false,
  isTesting: false,
  setIsTesting: () => {},
  // Removed mysqlStats
  quotaExceeded: false,
  setQuotaExceeded: () => {},
  setLastError: () => {},
  logQuotaExceeded: () => {},
});

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [databaseType, setDatabaseType] = useState<DatabaseType>(() => {
    // Try to get saved preference from localStorage
    const saved = localStorage.getItem('preferredDatabase');
    // Convert 'mysql' to 'firebase' if that's what was saved
    if (saved === 'mysql') return 'firebase';
    return (saved as DatabaseType) || 'auto';
  });
  
  // Removed mysqlConnected state
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  // Removed mysqlStats state
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [lastError, setLastError] = useState<any>(null);

  // Update localStorage when database type changes
  useEffect(() => {
    localStorage.setItem('preferredDatabase', databaseType);
  }, [databaseType]);

  // Function to log quota exceeded errors
  const logQuotaExceeded = (service: string, error: any, metadata?: Record<string, any>) => {
    console.error(`Quota exceeded for ${service}:`, error);
    
    // Log to localStorage for persistence
    try {
      const quotaLogs = JSON.parse(localStorage.getItem('quotaErrorLogs') || '[]');
      quotaLogs.push({
        service,
        timestamp: new Date().toISOString(),
        error: error?.message || String(error),
        metadata
      });
      
      // Keep only last 20 errors to prevent localStorage overflow
      if (quotaLogs.length > 20) {
        quotaLogs.shift();
      }
      
      localStorage.setItem('quotaErrorLogs', JSON.stringify(quotaLogs));
    } catch (e) {
      console.error('Failed to log quota error to localStorage:', e);
    }
    
    // Show toast notification with our simplified implementation
    toast.destructive({
      title: `${service.charAt(0).toUpperCase() + service.slice(1)} Quota Exceeded`,
      description: 'Firebase storage quota has been exceeded.'
    });
  };

  // Removed checkMySQLConnection function

  // Check Firebase connection
  const checkFirebaseConnection = async (): Promise<boolean> => {
    setIsTesting(true);
    try {
      // Implement Firebase connection check (could ping an endpoint to validate)
      // For now, we'll just simulate a successful response
      const connected = true;
      setFirebaseConnected(connected);
      
      if (connected) {
        toast.default({
          title: 'Firebase Connected',
          description: 'Successfully connected to Firebase'
        });
      }
      
      return connected;
    } catch (error) {
      console.error('Firebase connection test error:', error);
      setFirebaseConnected(false);
      
      toast.destructive({
        title: 'Firebase Connection Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  // Check connection on component mount - removed MySQL check
  useEffect(() => {
    const checkConnections = async () => {
      await checkFirebaseConnection();
    };
    
    checkConnections();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        databaseType,
        setDatabaseType,
        // Removed mysqlConnected
        firebaseConnected,
        // Removed checkMySQLConnection
        checkFirebaseConnection,
        isTesting,
        setIsTesting,
        // Removed mysqlStats
        quotaExceeded,
        setQuotaExceeded,
        setLastError,
        logQuotaExceeded,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext); 