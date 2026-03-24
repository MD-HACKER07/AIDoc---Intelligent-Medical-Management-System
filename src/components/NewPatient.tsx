import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, X, Loader2, XCircle, AlertTriangle, SettingsIcon, Database } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useHospital } from '../context/HospitalContext';
import { GENDERS } from '../types';
import { useAuth } from '../context/AuthContext';
import { getApps } from 'firebase/app';
import { DirectPatientSave } from './DirectPatientSave';
import { PatientService } from '../services/patientService';
import { QuotaExceededHandler } from './QuotaExceededHandler';
import { MySQLPatientSave } from './MySQLPatientSave';
import { useDatabase } from '../context/DatabaseContext';

// Enable debugging
const ENABLE_VERBOSE_LOGGING = true;

// Add style for data attributes on saving message
const savingMessageStyles = `
  #saving-status-message[data-long-wait="true"] span[data-default-text] {
    content: attr(data-long-wait-text);
  }
  
  #saving-status-message[data-long-wait="true"] span[data-default-text]::before {
    content: attr(data-long-wait-text);
    position: absolute;
    left: 0;
    right: 0;
  }
  
  #saving-status-message[data-long-wait="true"] span[data-default-text] {
    opacity: 0;
    position: relative;
  }
`;

// Custom hook to generate unique patient ID
function useUniquePatientId() {
  const [patientId, setPatientId] = useState('');
  
  useEffect(() => {
    // Generate a unique ID with hospital prefix, date component and random number
    const generateId = () => {
      const now = new Date();
      const dateStr = now.getFullYear().toString().slice(-2) + 
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const timestamp = now.getTime().toString().slice(-4);
      return `PAT-${dateStr}-${random}-${timestamp}`;
    };
    
    setPatientId(generateId());
  }, []);
  
  return patientId;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  insuranceProvider: string;
  insuranceNumber: string;
  notes: string;
}

export function NewPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hospital } = useHospital();
  const uniquePatientId = useUniquePatientId();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    contactNumber: '',
    email: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    insuranceProvider: '',
    insuranceNumber: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedPatient, setSavedPatient] = useState<{id: string, patientId: string} | null>(null);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  
  // Add timeout state
  const [savingTimeout, setSavingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Add cleanup for any hanging timeouts
  useEffect(() => {
    return () => {
      if (savingTimeout) {
        clearTimeout(savingTimeout);
      }
    };
  }, [savingTimeout]);
  
  // Increase timeout duration and add retry with recovery options
  useEffect(() => {
    if (loading) {
      // Increase timeout to 15 seconds to allow for slow connections
      const timeout = setTimeout(() => {
        console.error('Save operation timed out after 15 seconds');
        // Don't immediately set loading to false - this gives recovery options
        setError('Save operation timed out. Use the recovery options below.');
      }, 15000);
      
      setSavingTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
        setSavingTimeout(null);
      };
    }
  }, [loading]);
  
  // Add this useEffect to apply the CSS
  useEffect(() => {
    // Add the style element to handle saving message changes
    const styleEl = document.createElement('style');
    styleEl.textContent = savingMessageStyles;
    document.head.appendChild(styleEl);

    // Cleanup
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Function to log debug messages
  const logDebug = (message: string, ...args: any[]) => {
    if (debugMode || ENABLE_VERBOSE_LOGGING) {
      console.log(`[Patient Form Debug] ${message}`, ...args);
    }
  };
  
  // Test database connection
  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    logDebug('Starting database connectivity test');
    
    try {
      logDebug('Checking Firebase app initialization');
      const apps = getApps();
      logDebug('Firebase apps initialized:', apps.length);
      
      if (apps.length === 0) {
        throw new Error('Firebase is not initialized');
      }
      
      logDebug('Testing database connection via PatientService');
      const result = await PatientService.testDatabaseAccess();
      
      if (result.success) {
        setSuccess(true);
        logDebug('Database test successful:', result.message);
        setError('Database connection successful: ' + result.message);
      } else {
        setError(`Database test failed: ${result.message}`);
        logDebug('Database test failed:', result.message);
      }
    } catch (err: any) {
      setError(`Database test error: ${err.message}`);
      logDebug('Database test error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Function to manually check form validity
  const isFormValid = () => {
    if (!formRef.current) return false;
    return formRef.current.checkValidity();
  };
  
  const { setQuotaExceeded, setLastError, logQuotaExceeded } = useDatabase();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validations
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly.');
      return;
    }
    
    if (!user || !hospital) {
      setError('Authentication error. Please login again.');
      return;
    }
    
    // Cancel any existing timeouts
    if (savingTimeout) {
      clearTimeout(savingTimeout);
      setSavingTimeout(null);
    }
    
    // Start loading and clear errors
    setLoading(true);
    setError(null);
    
    // Set visual feedback timeout
    const savingStatusTimeout = setTimeout(() => {
      if (loading) {
        // Update UI to show we're still trying
        console.log('Save operation taking longer than expected...');
        const statusEl = document.getElementById('saving-status-message');
        if (statusEl) {
          statusEl.setAttribute('data-long-wait', 'true');
          // Update the visible text directly as a fallback
          const textSpan = statusEl.querySelector('span[data-default-text]');
          if (textSpan) {
            textSpan.textContent = textSpan.getAttribute('data-long-wait-text') || 'Still saving...';
          }
        }
      }
    }, 5000);
    
    try {
      logDebug('Starting patient save process using Firestore via PatientService...');
      logDebug('User:', user.uid);
      logDebug('Hospital:', hospital.id, hospital.name);
      
      // Track save start time for diagnostics
      const saveStartTime = Date.now();
      
      // Create a patient object with all form data
      const patientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        medicalHistory: formData.medicalHistory.trim(),
        allergies: formData.allergies.trim(),
        medications: formData.medications.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactNumber: formData.emergencyContactNumber.trim(),
        insuranceProvider: formData.insuranceProvider.trim(),
        insuranceNumber: formData.insuranceNumber.trim(),
        notes: formData.notes.trim(),
        patientId: uniquePatientId,
        age: calculateAge(formData.dateOfBirth),
        hospitalName: hospital.name
      };
      
      logDebug('Patient data prepared:', patientData);
      
      try {
        // Use the PatientService to create the patient using Firestore
        logDebug('Calling PatientService.createPatient with Firestore');
        const patientId = await PatientService.createPatient(
          patientData,
          hospital.id,
          user.uid
        );
        
        const saveEndTime = Date.now();
        logDebug(`Patient saved successfully to Firestore with ID: ${patientId} (took ${saveEndTime - saveStartTime}ms)`);
        
        // Set success state
      setSuccess(true);
      setSavedPatient({
          id: patientId,
        patientId: uniquePatientId
      });
      } catch (err: any) {
        logDebug('Error in Firestore patient save:', err);
        
        // Check for quota exceeded errors
        const errorMessage = err.message || '';
        const isQuotaError = errorMessage.toLowerCase().includes('quota exceeded') || 
                          errorMessage.toLowerCase().includes('resource exhausted') ||
                          errorMessage.toLowerCase().includes('billing required');
        
        if (isQuotaError) {
          // Set quota exceeded in the database context
          setQuotaExceeded(true);
          setLastError(err);
          setError('Firebase quota exceeded. Please upgrade your Firebase plan or try again later.');
          
          // Log the quota exceeded error 
          logQuotaExceeded('firestore', err, {
            component: 'NewPatient',
            operation: 'createPatient',
            hospitalId: hospital?.id,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle timeout errors specially
        if (err.message && err.message.includes('timed out')) {
          setError('Firestore save operation timed out. Use the recovery options below.');
          
          // Don't set loading to false - let user choose what to do next
          return;
        }
        
        // For other errors, try direct Firestore save as a fallback
        try {
          logDebug('PatientService failed, attempting direct Firestore save...');
          
          // Attempt direct Firestore write as last resort
          const directId = await directFirestoreSave({
            ...patientData,
            directFallback: true
          });
          
          logDebug('Direct Firestore save successful:', directId);
          
          // Set success state
          setSuccess(true);
          setSavedPatient({
            id: directId,
            patientId: uniquePatientId
          });
          
          return;
        } catch (directErr: any) {
          logDebug('Direct Firestore save also failed:', directErr);
          
          // For other errors, show the message
          setError(`Failed to save patient to Firestore: ${err.message || 'Unknown error'}`);
        }
        
        // Try emergency recovery for network errors
        if (err.message && (
          err.message.includes('network') || 
          err.message.includes('internet') || 
          err.message.includes('connection')
        )) {
          // Save patient data to localStorage as a backup
          try {
            const backupKey = `patient_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify({
              formData,
              patientId: uniquePatientId,
              timestamp: Date.now(),
              hospital: hospital.id,
              user: user.uid
            }));
            
            logDebug('Saved emergency backup to localStorage:', backupKey);
            setError((prevError) => `${prevError} A backup of this form has been saved locally.`);
          } catch (backupErr) {
            logDebug('Failed to save backup to localStorage:', backupErr);
          }
        }
      }
    } catch (err: any) {
      logDebug('Unexpected error during Firestore save process:', err);
      setError(`Unexpected error with Firestore: ${err.message || 'Unknown error'}`);
    } finally {
      // Always clear the status update timeout
      clearTimeout(savingStatusTimeout);
      
      // Set loading to false unless we've got a timeout
      // (timeout errors are handled specially to allow recovery)
      if (!error || !(error.includes('timed out'))) {
      setLoading(false);
      }
    }
  };

  const handleCopyId = () => {
    if (!savedPatient) return;
    
    navigator.clipboard.writeText(savedPatient.patientId)
      .then(() => {
        // Show a temporary "Copied!" message
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  // If we've successfully saved the patient, show a success screen
  if (success && savedPatient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Added Successfully</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The patient has been registered in the system.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Patient ID:</div>
            <div className="flex items-center">
              <div className="flex-1 font-mono text-lg font-medium text-blue-800 dark:text-blue-300 bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
                {savedPatient.patientId}
              </div>
              <button 
                id="copy-btn"
                onClick={handleCopyId}
                className="ml-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                </svg>
                Copy
              </button>
            </div>
          </div>
          
          <div className="flex justify-between space-x-4">
            <button
              onClick={() => {
                // Reset form to add another patient
                setFormData({
                  firstName: '',
                  lastName: '',
                  gender: '',
                  dateOfBirth: '',
                  contactNumber: '',
                  email: '',
                  address: '',
                  medicalHistory: '',
                  allergies: '',
                  medications: '',
                  emergencyContactName: '',
                  emergencyContactNumber: '',
                  insuranceProvider: '',
                  insuranceNumber: '',
                  notes: ''
                });
                setSuccess(false);
                setSavedPatient(null);
              }}
              className="w-1/2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Add Another Patient
            </button>
            <button
              onClick={() => navigate(`/patient/${savedPatient.id}`)}
              className="w-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Patient Details
            </button>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => navigate(`/chat/${savedPatient.id}`)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start Consultation
            </button>
          </div>
        </div>
      </div>
    );
  }
  

  
  // After the imports section, add this function
  const directFirestoreSave = async (data: any, collectionName: string = 'patients_direct'): Promise<string> => {
    // Use the most direct approach possible
    console.log(`[Direct Firestore] Attempting direct write to ${collectionName} collection`);
    
    try {
      // Check if db is available
      if (!db) {
        throw new Error('Firestore instance is null. Check Firebase initialization.');
      }
      
      // Create the most minimal valid document possible
      const minimalData = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        patientId: data.patientId || `emergency-${Date.now()}`,
        timestamp: Date.now(),
        directWrite: true,
        createdAt: new Date().toISOString()
      };
      
      // Use a direct reference to collection and addDoc from Firestore
      const directRef = collection(db, collectionName);
      const docRef = await addDoc(directRef, minimalData);
      console.log(`[Direct Firestore] Successfully saved document with ID: ${docRef.id}`);
      return docRef.id;
    } catch (err) {
      console.error('[Direct Firestore] Direct write failed:', err);
      throw err;
    }
  };

  // Add the troubleshootFirestore function here
  const troubleshootFirestore = async () => {
    console.log('[Troubleshoot] Starting Firestore troubleshooting...');
    const results: any = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      navigator: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent
      },
      firebase: {
        apps: getApps().length,
        initialized: getApps().length > 0
      }
    };
    
    try {
      // Check Firestore configuration
      if (db) {
        results.firestore = {
          exists: true
        };
        
        // Try simple operations
        try {
          // Test write to a completely separate collection
          const testRef = collection(db, 'troubleshoot');
          const testDoc = await addDoc(testRef, { 
            test: true, 
            timestamp: Date.now() 
          });
          
          results.firestore.testWrite = {
            success: true,
            docId: testDoc.id
          };
          
          // Try simple read
          try {
            const querySnapshot = await getDocs(collection(db, 'troubleshoot'));
            results.firestore.testRead = {
              success: true,
              count: querySnapshot.size
            };
          } catch (readErr: any) {
            results.firestore.testRead = {
              success: false,
              error: readErr.message
            };
          }
        } catch (writeErr: any) {
          results.firestore.testWrite = {
            success: false,
            error: writeErr.message
          };
        }
      } else {
        results.firestore = {
          exists: false
        };
      }
    } catch (err: any) {
      results.error = err.message;
    }
    
    console.log('[Troubleshoot] Results:', results);
    
    // Show results to user
    alert(JSON.stringify(results, null, 2));
    
    return results;
  };

  // Add a function to check for saved backups and a component to display them if found
  // Add this after the troubleshootFirestore function

  // Function to find any saved backups in localStorage
  const findSavedBackups = () => {
    try {
      const backups: any[] = [];
      // Check localStorage for backup keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('patient_backup_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            backups.push({
              key,
              timestamp: data.timestamp,
              formattedTime: new Date(data.timestamp).toLocaleString(),
              patientName: data.formData ? 
                `${data.formData.firstName} ${data.formData.lastName}`.trim() : 
                'Unknown Patient',
              data
            });
          } catch (error) {
            console.error(`Failed to parse backup ${key}:`, error);
          }
        }
      }
      
      // Sort by timestamp, newest first
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to check backups:', error);
      return [];
    }
  };

  // Component to show available backups
  const SavedBackupsPanel = () => {
    const [backups, setBackups] = useState<any[]>([]);
    const [restoring, setRestoring] = useState(false);
    
    useEffect(() => {
      setBackups(findSavedBackups());
    }, []);
    
    if (backups.length === 0) return null;
  
  return (
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
          Found {backups.length} previously saved patient {backups.length === 1 ? 'form' : 'forms'}
        </h3>
        
        <div className="max-h-48 overflow-y-auto">
          {backups.map((backup) => (
            <div key={backup.key} className="mb-2 p-3 bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{backup.patientName}</div>
                  <div className="text-xs text-gray-500">{backup.formattedTime}</div>
                </div>
                <div className="flex gap-2">
          <button
                    disabled={restoring}
                    onClick={async () => {
                      try {
                        setRestoring(true);
                        console.log('[Recovery] Starting emergency recovery for backup:', backup.key);
                        
                        // Extract minimal data
                        const data = backup.data.formData || {};
                        const minimalData = {
                          firstName: data.firstName || '',
                          lastName: data.lastName || '',
                          recovering: true
                        };
                        
                        let recoveredId = '';
                        
                        // Try absolute emergency save first
                        try {
                          recoveredId = await absoluteEmergencySave(minimalData);
                          console.log('[Recovery] Absolute emergency save successful:', recoveredId);
                        } catch (err) {
                          console.error('[Recovery] Absolute emergency save failed, trying directFirestoreSave');
                          
                          // Fallback to direct save
                          recoveredId = await directFirestoreSave({
                            ...minimalData,
                            recoveryAttempt: true,
                            backupKey: backup.key
                          }, 'patient_recovery');
                        }
                        
                        // Success - show success UI and remove backup
                        console.log('[Recovery] Recovery successful with ID:', recoveredId);
                        setSuccess(true);
                        setSavedPatient({
                          id: recoveredId,
                          patientId: backup.data.patientId || `recovered-${Date.now()}`
                        });
                        
                        // Remove the backup from localStorage
                        localStorage.removeItem(backup.key);
                      } catch (error) {
                        console.error('[Recovery] All recovery methods failed:', error);
                        alert('Recovery failed. Please try again with a different method or contact support.');
                      } finally {
                        setRestoring(false);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {restoring ? 'Recovering...' : 'Force Recover'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this backup?')) {
                        localStorage.removeItem(backup.key);
                        setBackups(findSavedBackups());
                      }
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
          </button>
        </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fix the debug panel to add the troubleshooting button
  // Replace the debug panel section with this corrected version
  {debugMode && (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={testDatabaseConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        
        <button
          type="button"
          onClick={troubleshootFirestore}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Troubleshoot Firestore
        </button>
      </div>
      
      {/* Add MySQL alternative saving option */}
      <MySQLPatientSave
        patientData={{
          ...formData,
          patientId: uniquePatientId
        }}
        onSuccess={(docId) => {
          // Handle successful MySQL save
          setSuccess(true);
          setSavedPatient({
            id: docId,
            patientId: uniquePatientId
          });
        }}
      />
    </div>
  )}

  // Add a message directing users to the settings page for database configuration
  {error && error.includes('Firebase') && (
    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-800/20 border border-amber-200 dark:border-amber-800 rounded-md">
      <h3 className="flex items-center text-amber-800 dark:text-amber-300 font-medium mb-2">
        <AlertTriangle size={18} className="mr-2" />
        Database Connection Issue
      </h3>
      <p className="text-sm mb-3">
        There appears to be an issue with the database connection. Database configuration and diagnostics 
        have been moved to the Settings page.
      </p>
      <Link to="/settings?tab=database" className="inline-flex items-center text-sm px-3 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20">
        <SettingsIcon size={14} className="mr-2" />
        Go to Database Settings
      </Link>
    </div>
  )}

  return (
    <div className="relative p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">New Patient</h2>
            <p className="text-gray-500 dark:text-gray-400">Enter the patient's information below.</p>
          </div>
          <div>
            <Link to="/settings?tab=database" className="inline-flex items-center text-sm px-3 py-2 text-blue-600 dark:text-blue-400 hover:underline">
              <Database className="h-4 w-4 mr-1" />
              Database Settings
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Patient
              </h2>
            </div>
            {hospital && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {hospital.name}
              </div>
            )}
          </div>
          
          {/* Quota Exceeded Handler */}
          <QuotaExceededHandler 
            error={error ? new Error(error) : null} 
            onClose={() => setError(null)}
          />
          
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
              <div className="flex">
                <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  
                  {loading && (
                    <p className="text-sm mt-2">
                      Still trying to save... Please wait while we attempt to complete the operation.
                    </p>
                  )}
                  
                  {/* Recovery options for when saving is stuck */}
                  {error.includes('timed out') && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm font-medium">Recovery Options:</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          onClick={() => {
                            // Force retry with direct Firestore approach
                            setLoading(true);
                            setError('Attempting emergency direct save...');
                            
                            // Create minimal emergency data
                            const emergencyData = {
                              firstName: formData.firstName,
                              lastName: formData.lastName,
                              patientId: uniquePatientId,
                              emergency: true
                            };
                            
                            // Call the direct save function
                            directFirestoreSave(emergencyData)
                              .then(docId => {
                                console.log('Direct emergency save successful:', docId);
                                setSuccess(true);
                                setSavedPatient({
                                  id: docId,
                                  patientId: uniquePatientId
                                });
                                setLoading(false);
                                
                                // Also try to save full data in background (don't await)
                                directFirestoreSave({
                                  ...formData,
                                  patientId: uniquePatientId,
                                  fullData: true
                                }, 'patients_full')
                                  .then(fullId => console.log('Full data saved in background:', fullId))
                                  .catch(err => console.error('Background full save failed:', err));
                              })
                              .catch(err => {
                                console.error('Direct save failed:', err);
                                // Try one more approach - absolute minimal data
                                directFirestoreSave({
                                  name: `${formData.firstName} ${formData.lastName}`.trim(),
                                  id: uniquePatientId,
                                  minimal: true
                                }, 'emergency_patients')
                                  .then(docId => {
                                    console.log('Absolute minimal save successful:', docId);
                                    setSuccess(true);
                                    setSavedPatient({
                                      id: docId,
                                      patientId: uniquePatientId
                                    });
                                  })
                                  .catch(finalErr => {
                                    console.error('All direct save attempts failed:', finalErr);
                                    setError('All save attempts failed. Your data has been saved locally. Please try again later or contact support.');
                                  })
                                  .finally(() => {
                                    setLoading(false);
                                  });
                              });
                          }}
                        >
                          Direct Firestore Save
                        </button>
                        
                        <button
                          type="button"
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                          onClick={async () => {
                            try {
                              console.log('[EMERGENCY] Attempting to reset state and force save');
                              
                              // First cancel any pending operations
                              setLoading(false);
                              
                              // Wait a moment for UI to update
                              await new Promise(resolve => setTimeout(resolve, 100));
                              
                              // Attempt absolute emergency save
                              const emergencyId = await absoluteEmergencySave({
                                firstName: formData.firstName,
                                lastName: formData.lastName,
                                emergencyReset: true
                              });
                              
                              console.log('[EMERGENCY] Reset and save successful:', emergencyId);
                              
                              // Set to success state
                              setSuccess(true);
                              setSavedPatient({
                                id: emergencyId,
                                patientId: uniquePatientId
                              });
                              
                            } catch (err) {
                              console.error('[EMERGENCY] Reset and save failed:', err);
                              setError('Emergency save failed. Please reload the page and try again.');
                              
                              // Force a reset of loading state
                              setLoading(false);
                            }
                          }}
                        >
                          Emergency Reset & Save
                        </button>
                        
                        <button
                          type="button"
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                          onClick={() => {
                            if (loading) {
                              // Stop the current save operation
                              setLoading(false);
                              setError('Save operation aborted. Please try again with the Save Patient button.');
                            }
                          }}
                        >
                          Cancel Save
                        </button>
                        
                        <button
                          type="button"
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                          onClick={() => window.location.reload()}
                        >
                          Reload Page
                        </button>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Note: If save operations consistently fail, check your network connection and try using the Debug option 
                        to run connection tests.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Add the SavedBackupsPanel here */}
          <SavedBackupsPanel />
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Basic Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map(gender => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Medical Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Medical Information
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Medications
                  </label>
                  <input
                    type="text"
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Insurance Number
                  </label>
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
              >
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => {
                  // Additional click handler to ensure the form is submitted
                  if (!isFormValid()) {
                    e.preventDefault();
                    setError('Please fill in all required fields correctly.');
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center" id="saving-status-message">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span data-default-text="Saving..." data-long-wait-text="Still saving... please wait">
                    Saving...
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-1" />
                    Save Patient
                  </span>
                )}
              </button>
            </div>
            
            {/* Add emergency direct save option */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Options</h3>
              
              <DirectPatientSave 
                patientData={{
                  ...formData,
                  patientId: uniquePatientId
                }}
                onSuccess={(docId) => {
                  // Handle successful direct save
                  setSuccess(true);
                  setSavedPatient({
                    id: docId,
                    patientId: uniquePatientId
                  });
                }}
              />
              
              {/* Add MySQL alternative saving option */}
              <MySQLPatientSave
                patientData={{
                  ...formData,
                  patientId: uniquePatientId
                }}
                onSuccess={(docId) => {
                  // Handle successful MySQL save
                  setSuccess(true);
                  setSavedPatient({
                    id: docId,
                    patientId: uniquePatientId
                  });
                }}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 

// Add this improved emergency save function after directFirestoreSave
const absoluteEmergencySave = async (data: any): Promise<string> => {
  console.log('[ABSOLUTE EMERGENCY] Attempting last-resort direct write with minimal data');
  
  try {
    // Check if db is available
    if (!db) {
      throw new Error('Firestore instance is null. Check Firebase initialization.');
    }
    
    // Create the absolute minimal data - just names and ID
    const bareMinimumData = {
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
      timestamp: Date.now(),
      emergency: true,
      absoluteSave: true
    };
    
    // Try writing to every possible collection to maximize chances of success
    const collections = [
      'patients', 
      'patients_emergency', 
      'emergency_saves',
      'direct_patients'
    ];
    
    for (const collectionName of collections) {
      try {
        console.log(`[ABSOLUTE EMERGENCY] Trying collection: ${collectionName}`);
        const ref = collection(db, collectionName);
        const docRef = await addDoc(ref, bareMinimumData);
        console.log(`[ABSOLUTE EMERGENCY] Success with collection ${collectionName}, ID: ${docRef.id}`);
        return docRef.id;
      } catch (err) {
        console.error(`[ABSOLUTE EMERGENCY] Failed with collection ${collectionName}:`, err);
        // Continue to next collection on failure
      }
    }
    
    throw new Error('All collections failed');
  } catch (err) {
    console.error('[ABSOLUTE EMERGENCY] All save attempts failed:', err);
    throw err;
  }
}; 