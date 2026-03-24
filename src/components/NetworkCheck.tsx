import React, { useState, useEffect } from 'react';
import { getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { CheckCircle, XCircle, Wifi, Globe, Database, RefreshCw, Clock, AlertOctagon } from 'lucide-react';

// Timeout constants
const CONNECTION_CHECK_TIMEOUT = 5000;

// Firebase project IP addresses for ping tests (approximate)
const FIREBASE_ENDPOINTS = [
  'https://firestore.googleapis.com',
  'https://firebase.googleapis.com'
];

export const NetworkCheck: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [showNetworkTest, setShowNetworkTest] = useState<boolean>(false);
  
  // Add timeout state
  const [checkTimedOut, setCheckTimedOut] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set a timeout to prevent the check from hanging indefinitely
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Network check timed out');
        setCheckTimedOut(true);
        setIsLoading(false);
        setError('Connection check timed out. Click "Test Now" to try again.');
        setShowDetails(true);
      }
    }, CONNECTION_CHECK_TIMEOUT);

    checkFirebaseConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  // Network latency test function
  const checkNetworkLatency = async () => {
    setShowNetworkTest(true);
    setDetails(prev => [...prev, 'Starting network latency test...']);
    
    try {
      const fetchWithTimeout = async (url: string, timeoutMs: number = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const start = performance.now();
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-store',
            mode: 'no-cors' // CORS won't interfere
          });
          const end = performance.now();
          clearTimeout(timeoutId);
          return { latency: end - start, success: true };
        } catch (err) {
          clearTimeout(timeoutId);
          return { latency: null, success: false, error: err };
        }
      };
      
      let totalLatency = 0;
      let successCount = 0;
      
      // Check general internet access first
      setDetails(prev => [...prev, 'Testing general internet connectivity...']);
      const generalTests = [
        { url: 'https://www.google.com', name: 'Google' },
        { url: 'https://www.cloudflare.com', name: 'Cloudflare' }
      ];
      
      for (const test of generalTests) {
        const result = await fetchWithTimeout(test.url);
        if (result.success && result.latency) {
          setDetails(prev => [...prev, `${test.name} latency: ${Math.round(result.latency)}ms`]);
          totalLatency += result.latency;
          successCount++;
        } else {
          setDetails(prev => [...prev, `${test.name} connection failed`]);
        }
      }
      
      // Now check Firebase specific endpoints
      setDetails(prev => [...prev, 'Testing Firebase specific endpoints...']);
      for (const endpoint of FIREBASE_ENDPOINTS) {
        const result = await fetchWithTimeout(endpoint);
        if (result.success && result.latency) {
          setDetails(prev => [...prev, `Firebase endpoint (${endpoint}) latency: ${Math.round(result.latency)}ms`]);
          totalLatency += result.latency;
          successCount++;
        } else {
          setDetails(prev => [...prev, `Firebase endpoint (${endpoint}) connection failed`]);
        }
      }
      
      // Calculate average latency if any tests succeeded
      if (successCount > 0) {
        const avgLatency = totalLatency / successCount;
        setNetworkLatency(Math.round(avgLatency));
        setDetails(prev => [...prev, `Average network latency: ${Math.round(avgLatency)}ms`]);
        
        // Provide guidance based on latency
        if (avgLatency < 200) {
          setDetails(prev => [...prev, 'Network latency is good']);
        } else if (avgLatency < 500) {
          setDetails(prev => [...prev, 'Network latency is acceptable but may cause delays']);
        } else {
          setDetails(prev => [...prev, 'Network latency is high, this may cause timeout issues']);
        }
      } else {
        setDetails(prev => [...prev, 'Could not measure network latency']);
      }
    } catch (err) {
      setDetails(prev => [...prev, `Error in latency test: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    }
  };

  const checkFirebaseConnectivity = async () => {
    setIsLoading(true);
    setError(null);
    setDetails([]);
    setCheckTimedOut(false);
    setNetworkLatency(null);
    setShowNetworkTest(false);
    
    try {
      // Basic connectivity check
      setDetails(prev => [...prev, `Internet connection: ${navigator.onLine ? 'Online' : 'Offline'}`]);
      
      if (!navigator.onLine) {
        setIsFirebaseConnected(false);
        setError('No internet connection. Please check your network.');
        setIsLoading(false);
        return;
      }

      // Check if Firebase is initialized
      const apps = getApps();
      setDetails(prev => [...prev, `Firebase initialization: ${apps.length > 0 ? 'Yes' : 'No'}`]);
      
      if (apps.length === 0) {
        setIsFirebaseConnected(false);
        setError('Firebase is not initialized. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Check for network latency issues
      await checkNetworkLatency();

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase connection test timed out')), 3000);
      });

      try {
        // Try to connect to Firestore with timeout
        const db = getFirestore(apps[0]);
        setDetails(prev => [...prev, 'Firestore instance created']);
        
        // Test with a small read operation
        const testQuery = query(collection(db, 'connection_test'), limit(1));
        
        // Race the query against a timeout
        await Promise.race([
          getDocs(testQuery).then(snapshot => {
            setDetails(prev => [...prev, `Firestore read test: Success (${snapshot.size} documents)`]);
            setIsFirebaseConnected(true);
          }), 
          timeoutPromise
        ]);
      } catch (err: any) {
        setDetails(prev => [...prev, `Firestore read test failed: ${err.message}`]);
        
        // Try a different collection as a fallback
        try {
          setDetails(prev => [...prev, 'Trying alternative collection...']);
          const db = getFirestore(apps[0]);
          const altQuery = query(collection(db, 'patients'), limit(1));
          
          await Promise.race([
            getDocs(altQuery).then(snapshot => {
              setDetails(prev => [...prev, `Alternative read test: Success (${snapshot.size} documents)`]);
              setIsFirebaseConnected(true);
            }),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Alternative test timed out')), 3000);
            })
          ]);
        } catch (fallbackErr: any) {
          setDetails(prev => [...prev, `All read tests failed: ${fallbackErr.message}`]);
          setIsFirebaseConnected(false);
          
          // Check for specific network-related issues
          if (fallbackErr.message.includes('network-request-failed')) {
            setError('Network request to Firebase failed. Check your connection or firewall settings.');
          } else if (fallbackErr.message.includes('timeout')) {
            setError('Connection to Firebase timed out. Your network may be slow or unstable.');
          } else if (fallbackErr.message.includes('permission-denied')) {
            setError('Permission denied accessing Firestore. You may not have the correct access rights.');
          } else if (fallbackErr.message.includes('unavailable')) {
            setError('Firebase service is currently unavailable. Try again later.');
          } else {
            setError(`Cannot connect to Firestore. ${fallbackErr.message.includes('permission-denied') ? 'You may not have permission to access this data.' : 'Please check your connection.'}`);
          }
        }
      }
    } catch (err: any) {
      setDetails(prev => [...prev, `Error: ${err.message}`]);
      setIsFirebaseConnected(false);
      setError(`Failed to check Firebase connectivity: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (error || !isFirebaseConnected) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (networkLatency && networkLatency > 500) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getLatencyColor = () => {
    if (!networkLatency) return 'text-gray-500';
    if (networkLatency < 200) return 'text-green-500';
    if (networkLatency < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`mb-4 p-4 rounded-md border ${getStatusColor()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {isLoading ? (
            <Database className="h-5 w-5 text-blue-500 mr-2 animate-pulse" />
          ) : isFirebaseConnected ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          
          <div>
            <div className="flex items-center">
              <h3 className={`text-sm font-medium ${
                isLoading ? 'text-blue-700 dark:text-blue-300' : 
                isFirebaseConnected ? 'text-green-700 dark:text-green-300' : 
                'text-red-700 dark:text-red-300'
              }`}>
                {isLoading 
                  ? 'Checking network connection...' 
                  : isFirebaseConnected 
                    ? 'Connected to Firebase' 
                    : error || 'Cannot connect to Firebase'}
              </h3>
              
              {networkLatency !== null && (
                <div className={`ml-2 flex items-center text-xs ${getLatencyColor()}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{networkLatency}ms</span>
                </div>
              )}
            </div>
            
            {showDetails && details.length > 0 && (
              <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                {details.map((detail, index) => (
                  <div 
                    key={index} 
                    className={
                      detail.includes('Success') ? 'text-green-600 dark:text-green-400' : 
                      detail.includes('failed') || detail.includes('Error') ? 'text-red-600 dark:text-red-400' : 
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
            onClick={checkFirebaseConnectivity}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Test connection"
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
      
      {/* Show network diagnostic section */}
      {networkLatency !== null && networkLatency > 300 && (
        <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          <div className="flex items-center">
            <AlertOctagon className="h-3 w-3 mr-1 text-yellow-500" />
            <span>High network latency detected ({networkLatency}ms)</span>
          </div>
          <p className="mt-1">
            Your connection to Firebase is experiencing delays. This may cause timeouts when saving data.
            Try connecting to a stronger network or consider using the "Emergency Direct Save" option with longer timeouts.
          </p>
        </div>
      )}
      
      {/* Show Fix button if we're stuck or there's an error */}
      {(error || checkTimedOut) && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={checkFirebaseConnectivity}
              disabled={isLoading}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Test Now
                </>
              )}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reload Page
            </button>
            
            <button
              onClick={checkNetworkLatency}
              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Globe className="h-3 w-3 mr-1" />
              Check Network Speed
            </button>
          </div>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            If the problem persists, try using the "Fix Connection" button above or
            the "Emergency Direct Save" option below with longer timeouts.
          </p>
        </div>
      )}
      
      {/* Force-show details if checking takes too long */}
      {isLoading && (
        <div className="mt-3">
          <button
            onClick={() => {
              setCheckTimedOut(true);
              setIsLoading(false);
              setError('Check manually aborted. Click "Test Now" to try again.');
              setShowDetails(true);
            }}
            className="flex items-center px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Cancel Check
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkCheck; 