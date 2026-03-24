import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, limit, deleteDoc, doc } from 'firebase/firestore';
import { Shield, XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface TestResult {
  collection: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  error?: string;
}

export const FirestorePermissionTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Collections to test
  const testCollections = ['patients', 'patients_backup', 'db_test', 'connection_test'];

  const runPermissionTest = async () => {
    setLoading(true);
    setResults([]);
    
    for (const collectionName of testCollections) {
      const result: TestResult = {
        collection: collectionName,
        read: false,
        write: false,
        delete: false
      };
      
      try {
        // Test READ
        try {
          const querySnapshot = await getDocs(query(collection(db, collectionName), limit(1)));
          result.read = true;
          console.log(`Read test for ${collectionName}: Success`);
        } catch (readError: any) {
          console.error(`Read test for ${collectionName}: Failed`, readError);
          result.error = `Read error: ${readError.code || readError.message}`;
        }
        
        // Test WRITE
        let docId = '';
        try {
          const docRef = await addDoc(collection(db, collectionName), {
            test: true,
            timestamp: new Date().toISOString(),
            description: 'Permission test document'
          });
          docId = docRef.id;
          result.write = true;
          console.log(`Write test for ${collectionName}: Success, docId: ${docId}`);
          
          // Test DELETE (only if write succeeded)
          try {
            await deleteDoc(doc(db, collectionName, docId));
            result.delete = true;
            console.log(`Delete test for ${collectionName}: Success`);
          } catch (deleteError: any) {
            console.error(`Delete test for ${collectionName}: Failed`, deleteError);
            if (!result.error) {
              result.error = `Delete error: ${deleteError.code || deleteError.message}`;
            }
          }
        } catch (writeError: any) {
          console.error(`Write test for ${collectionName}: Failed`, writeError);
          if (!result.error) {
            result.error = `Write error: ${writeError.code || writeError.message}`;
          }
        }
      } catch (error: any) {
        console.error(`Test for ${collectionName} failed with error:`, error);
        if (!result.error) {
          result.error = error.message;
        }
      }
      
      setResults(prev => [...prev, result]);
    }
    
    setLoading(false);
  };

  const attemptDirectBypass = async () => {
    setLoading(true);
    console.log('[BYPASS] Attempting direct Firestore operations bypassing middleware');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      attempts: []
    };
    
    // Try every possible collection with minimal data
    const testCollections = [
      'patients',
      'patients_backup',
      'patients_emergency',
      'emergency_saves',
      'direct_patients',
      'last_resort',
      'test_collection'
    ];
    
    for (const collName of testCollections) {
      const result = {
        collection: collName,
        success: false,
        error: null
      };
      
      try {
        // Use absolute minimal data
        const testDocRef = await addDoc(collection(db, collName), {
          test: true,
          timestamp: Date.now(),
          bypass: true
        });
        
        result.success = true;
        console.log(`[BYPASS] Successfully wrote to ${collName}: ${testDocRef.id}`);
        
        // Try to immediately delete it
        try {
          await deleteDoc(doc(db, collName, testDocRef.id));
          console.log(`[BYPASS] Successfully deleted from ${collName}`);
        } catch (delErr) {
          console.error(`[BYPASS] Failed to delete from ${collName}:`, delErr);
        }
      } catch (err: any) {
        result.success = false;
        result.error = err.message || 'Unknown error';
        console.error(`[BYPASS] Failed to write to ${collName}:`, err);
      }
      
      results.attempts.push(result);
    }
    
    // Show a summary
    const successCount = results.attempts.filter((a: any) => a.success).length;
    results.summary = `${successCount} out of ${testCollections.length} collections worked`;
    
    console.log('[BYPASS] Results:', results);
    alert(JSON.stringify(results, null, 2));
    
    setLoading(false);
    return results;
  };

  const getOverallStatus = () => {
    if (results.length === 0) return 'unknown';
    
    // Check if any collection has full permissions
    const hasFullAccess = results.some(r => r.read && r.write && r.delete);
    
    // Check if any collection has at least read and write
    const hasBasicAccess = results.some(r => r.read && r.write);
    
    if (hasFullAccess) return 'success';
    if (hasBasicAccess) return 'partial';
    return 'error';
  };

  return (
    <div className="mb-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium">Firestore Permissions Test</h3>
        </div>
        <div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        </div>
      </div>
      
      <div className="mb-3 flex gap-2">
        <button
          onClick={runPermissionTest}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 inline animate-spin" />
              Testing...
            </>
          ) : (
            'Test Firestore Permissions'
          )}
        </button>
        
        <button
          onClick={attemptDirectBypass}
          disabled={loading}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 inline animate-spin" />
              Bypassing...
            </>
          ) : (
            'Bypass Security Rules'
          )}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium mr-2">Overall status:</span>
            {getOverallStatus() === 'success' ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Full access
              </span>
            ) : getOverallStatus() === 'partial' ? (
              <span className="flex items-center text-yellow-600">
                <Shield className="h-4 w-4 mr-1" />
                Partial access
              </span>
            ) : (
              <span className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                Access issues
              </span>
            )}
          </div>
          
          {expanded && (
            <div className="mt-2 text-xs">
              <table className="min-w-full border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-1 px-2 border text-left">Collection</th>
                    <th className="py-1 px-2 border text-center">Read</th>
                    <th className="py-1 px-2 border text-center">Write</th>
                    <th className="py-1 px-2 border text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="even:bg-gray-50 dark:even:bg-gray-600">
                      <td className="py-1 px-2 border">{result.collection}</td>
                      <td className="py-1 px-2 border text-center">
                        {result.read ? (
                          <CheckCircle className="h-4 w-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 inline" />
                        )}
                      </td>
                      <td className="py-1 px-2 border text-center">
                        {result.write ? (
                          <CheckCircle className="h-4 w-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 inline" />
                        )}
                      </td>
                      <td className="py-1 px-2 border text-center">
                        {result.delete ? (
                          <CheckCircle className="h-4 w-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {results.filter(r => r.error).length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium">Errors:</h4>
                  <ul className="mt-1 space-y-1 text-red-600">
                    {results.filter(r => r.error).map((result, index) => (
                      <li key={index}>
                        <strong>{result.collection}:</strong> {result.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Add a section about security rules */}
      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Troubleshooting Security Issues</h3>
        <p className="text-xs mb-2">
          If you're seeing permission errors, you may need to update your Firestore security rules.
          The default rules are often too restrictive for development.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono mb-2 overflow-x-auto">
          {`// Example of more permissive development rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
        </div>
        
        <div className="text-xs">
          <strong>Warning:</strong> These rules allow all read/write operations. 
          Only use for development and testing. Configure proper authentication 
          rules before deploying to production.
        </div>
      </div>
    </div>
  );
}; 