import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  limit, 
  Timestamp,
  setDoc,
  DocumentReference,
  getFirestore,
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { getApp, getApps } from 'firebase/app';
import type { PatientInfo } from '../types';

// Define a more comprehensive patient data interface that matches the form
interface PatientData {
  // Required fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  patientId?: string;
  age?: string | number;
  hospitalId?: string;
  hospitalName?: string;
  userId?: string;
  
  // Optional fields
  contactNumber?: string;
  email?: string;
  address?: string;
  medicalHistory?: string | string[];
  medications?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  notes?: string;
  
  // Allow any additional properties
  [key: string]: any;
}

export interface Patient extends PatientInfo {
  id: string;
  hospitalId: string;
  hospitalName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Service for handling patient-related operations using Firestore only
 */
export const PatientService = {
  /**
   * Gets a valid Firestore instance, handling multiple scenarios
   */
  getFirestore(): Firestore {
    try {
      // First try to use the imported db instance
      if (db) {
        console.log('Using imported Firestore instance');
        return db;
      }
      
      // If that fails, try to get it from the current app
      const apps = getApps();
      if (apps.length > 0) {
        console.log('Getting Firestore from current app');
        return getFirestore(getApp());
      }
      
      throw new Error('No Firebase app initialized');
    } catch (error) {
      console.error('Error getting Firestore instance:', error);
      throw error;
    }
  },
  
  /**
   * Creates a new patient using Firestore only with multiple retry strategies
   * @param patientData The patient data to save
   * @param hospitalId The hospital ID
   * @param userId The user ID
   * @returns Promise resolving to the patient document ID
   */
  async createPatient(
    patientData: PatientData, 
    hospitalId: string, 
    userId: string
  ): Promise<string> {
    console.log('PatientService: createPatient called with:', { 
      patientDataKeys: Object.keys(patientData),
      hospitalId, 
      userId 
    });
    
    // Check for network connectivity first
    if (!navigator.onLine) {
      console.error('PatientService: No internet connection');
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    // Use a shorter timeout for faster failure detection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), 5000);
    });
    
    try {
      // Get a valid Firestore instance
      const firestore = this.getFirestore();
      
      // Prepare both minimal and full data versions
      const timestamp = new Date().toISOString();
      
      // Generate a predictable document ID for consistent attempts
      const docId = `${hospitalId}_${patientData.patientId || Date.now().toString()}`;
      
      // Essential data (minimal but complete enough)
      const essentialData = {
        firstName: patientData.firstName || '',
        lastName: patientData.lastName || '',
        gender: patientData.gender || '',
        dateOfBirth: patientData.dateOfBirth || '',
        patientId: patientData.patientId || Date.now().toString(),
        hospitalId,
        hospitalName: patientData.hospitalName || '',
        userId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      console.log('PatientService: Using Firestore direct write with essential data');
      
      // STRATEGY 1: Direct document write with setDoc
      try {
        // Create a reference to the patients collection
        const patientRef = doc(firestore, 'patients', docId);
        
        // Race against timeout to prevent hanging
        await Promise.race([
          setDoc(patientRef, essentialData),
          timeoutPromise
        ]);
        
        console.log('PatientService: Direct write successful with ID:', docId);
        
        // Add full data in the background without awaiting (non-critical fields)
        // This ensures the essential data is saved even if the full data update fails
        updateDoc(patientRef, patientData).catch(err => {
          console.error('Background update of full patient data failed:', err);
        });
        
        return docId;
      } catch (error) {
        console.error('PatientService: Direct write failed:', error);
        
        // STRATEGY 2: Use Firestore batch for atomic operations
        try {
          console.log('PatientService: Attempting batch write approach');
          
          // Use batch for atomicity
          const batch = writeBatch(firestore);
          const batchDocId = `batch_${docId}`;
          const batchRef = doc(firestore, 'patients', batchDocId);
          
          batch.set(batchRef, {
            ...essentialData,
            savingMethod: 'batch',
            attemptTime: new Date().toISOString()
          });
          
          // Execute with timeout
          await Promise.race([
            batch.commit(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Batch operation timed out')), 4000))
          ]);
          
          console.log('PatientService: Batch write successful with ID:', batchDocId);
          return batchDocId;
        } catch (batchError) {
          console.error('PatientService: Batch write failed:', batchError);
          
          // STRATEGY 3: Let Firestore generate the ID (fallback)
          try {
            console.log('PatientService: Attempting addDoc as fallback');
            
            // Simplify data further for maximum reliability
            const minimalData = {
              name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 'Unknown',
              patientId: patientData.patientId || Date.now().toString(),
              hospitalId,
              userId,
              saveTime: new Date().toISOString(),
              savingMethod: 'fallback'
            };
            
            // Use addDoc to let Firestore generate the ID
            const addDocRef = await Promise.race([
              addDoc(collection(firestore, 'patients'), minimalData),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AddDoc operation timed out')), 3000))
            ]) as any;
            
            console.log('PatientService: Fallback successful with ID:', addDocRef.id);
            return addDocRef.id;
          } catch (addDocError) {
            console.error('PatientService: All Firestore attempts failed:', addDocError);
            
            // STRATEGY 4: Emergency collection (last resort)
            try {
              console.log('PatientService: Using emergency collection');
              
              // Minimum viable data
              const emergencyData = {
                firstName: patientData.firstName,
                lastName: patientData.lastName,
                patientId: patientData.patientId || Date.now().toString(),
                timestamp: Date.now(),
                emergencySave: true
              };
              
              const emergencyRef = collection(firestore, 'patients_emergency');
              const emergencyDocRef = await Promise.race([
                addDoc(emergencyRef, emergencyData),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Emergency save timed out')), 2000))
              ]) as any;
              
              console.log('PatientService: Emergency save successful:', emergencyDocRef.id);
              return emergencyDocRef.id;
            } catch (emergencyError) {
              // All Firestore attempts failed
              console.error('PatientService: Even emergency save failed:', emergencyError);
              
              // Store in localStorage as absolute last resort
              const backupId = `local_${Date.now()}`;
              localStorage.setItem(`patient_backup_${backupId}`, JSON.stringify({
                data: essentialData,
                timestamp: Date.now()
              }));
              
              throw new Error('Failed to save patient after multiple attempts. A local backup has been saved.');
            }
          }
        }
      }
    } catch (error) {
      console.error('PatientService: Fatal error in createPatient:', error);
      throw error;
    }
  },

  /**
   * Tests database connectivity and verifies proper access to patient data
   * Includes a retry mechanism for intermittent failures
   * @returns Promise resolving to a detailed status object
   */
  async testDatabaseAccess(retry = 1): Promise<{ 
    success: boolean; 
    message: string;
    details?: any;
  }> {
    console.log(`PatientService: Testing database access (attempt ${retry})`);
    
    // First check network connectivity
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'No internet connection. Please check your network and try again.'
      };
    }
    
    try {
      // Get a valid Firestore instance
      const firestore = this.getFirestore();
      if (!firestore) {
        throw new Error('Failed to initialize Firestore');
      }
      
      // Try accessing basic Firestore properties
      const type = firestore.type;
      console.log('PatientService: Firestore type:', type);
      
      // Try fetching a small amount of data to confirm read access
      const docCountMap: Record<string, number> = {};
      
      // Test patients collection
      try {
        const patientsTestQuery = query(
          collection(firestore, 'patients'),
          limit(1)
        );
        const patientsResult = await getDocs(patientsTestQuery);
        docCountMap.patients = patientsResult.size;
      } catch (err) {
        console.warn('PatientService: Could not read patients collection', err);
        docCountMap.patients = -1; // Error indicator
      }
      
      // Test hospitals collection
      try {
        const hospitalsTestQuery = query(
          collection(firestore, 'hospitals'),
          limit(1)
        );
        const hospitalsResult = await getDocs(hospitalsTestQuery);
        docCountMap.hospitals = hospitalsResult.size;
      } catch (err) {
        console.warn('PatientService: Could not read hospitals collection', err);
        docCountMap.hospitals = -1; // Error indicator
      }
      
      // Write a test document to verify write access
      let writeSuccess = false;
      let testId: string | null = null;
      
      try {
        const testDoc = await addDoc(collection(firestore, 'connection_tests'), {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          test: true
        });
        testId = testDoc.id;
        writeSuccess = true;
      } catch (writeErr) {
        console.warn('PatientService: Could not write test document', writeErr);
        writeSuccess = false;
      }
      
      const allTests = Object.values(docCountMap).every(count => count >= 0);
      const success = writeSuccess && allTests;
      
      return {
        success,
        message: success 
          ? 'Database connection successful. All access tests passed.' 
          : 'Partial database access. Some operations may be restricted.',
        details: {
          collections: docCountMap,
          writeTest: writeSuccess ? 'success' : 'failed',
          testDocumentId: testId
        }
      };
    } catch (error: any) {
      console.error('PatientService: Database access test failed:', error);
      
      // Retry logic for intermittent failures
      if (retry < 3) {
        console.log(`PatientService: Retrying database access test (${retry + 1}/3)...`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retry * 1000));
        return this.testDatabaseAccess(retry + 1);
      }
      
      return {
        success: false,
        message: `Database access failed: ${error.message || 'Unknown error'}`,
        details: { error: error.message, code: error.code }
      };
    }
  },

  // Get patient by ID
  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const docRef = doc(this.getFirestore(), 'patients', patientId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Patient;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw new Error('Failed to retrieve patient data');
    }
  },
  
  // Update patient data
  async updatePatient(patientId: string, patientData: Partial<PatientInfo>): Promise<void> {
    try {
      const docRef = doc(this.getFirestore(), 'patients', patientId);
      await updateDoc(docRef, {
        ...patientData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient data');
    }
  },
  
  // Get patients for a hospital
  async getHospitalPatients(hospitalId: string): Promise<Patient[]> {
    try {
      console.log('PatientService: Getting patients for hospital:', hospitalId);
      
      if (!hospitalId) {
        console.error('PatientService: getHospitalPatients called with invalid hospitalId');
        throw new Error('Invalid hospital ID');
      }
      
      if (!navigator.onLine) {
        console.error('PatientService: No internet connection when fetching patients');
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      // First try the optimal query (with ordering)
      try {
        const q = query(
          collection(this.getFirestore(), 'patients'),
          where('hospitalId', '==', hospitalId),
          orderBy('createdAt', 'desc')
        );
        
        console.log('PatientService: Executing Firestore query for hospital patients with ordering');
        const querySnapshot = await getDocs(q);
        console.log('PatientService: Query completed, documents found:', querySnapshot.size);
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('PatientService: Processing patient document:', doc.id);
          return { id: doc.id, ...data } as Patient;
        });
      } catch (indexError: any) {
        // Check if the error is specifically about missing index
        const errorMessage = indexError.message || '';
        const isIndexError = errorMessage.includes('index') || errorMessage.includes('Index');
        
        if (isIndexError) {
          console.warn('PatientService: Index error encountered, falling back to simpler query', indexError);
          
          // Fallback to a simpler query without ordering
          const fallbackQuery = query(
            collection(this.getFirestore(), 'patients'),
            where('hospitalId', '==', hospitalId)
          );
          
          console.log('PatientService: Executing fallback Firestore query without ordering');
          const fallbackSnapshot = await getDocs(fallbackQuery);
          console.log('PatientService: Fallback query completed, documents found:', fallbackSnapshot.size);
          
          // Add the index creation message to help developers
          if (errorMessage.includes('https://console.firebase.google.com')) {
            const indexUrl = errorMessage.substring(
              errorMessage.indexOf('https://console.firebase.google.com'),
              errorMessage.length
            );
            console.warn('PatientService: Index creation URL:', indexUrl);
            
            // Store the index creation URL in localStorage for the admin page
            localStorage.setItem('firestoreIndexCreationUrl', indexUrl);
          }
          
          // Return unordered results for now
          return fallbackSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data } as Patient;
          });
        } else {
          // If it's not an index error, rethrow it
          throw indexError;
        }
      }
    } catch (error: any) {
      console.error('PatientService: Error getting hospital patients:', error);
      console.error('PatientService: Error details:', { 
        code: error.code, 
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'permission-denied') {
        throw new Error('You don\'t have permission to access these patients. Please check your account.');
      } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message && error.message.includes('index')) {
        // If it's an index error, provide a helpful message
        throw new Error(`The database needs configuration. ${error.message}`);
      } else {
        throw new Error(`Failed to retrieve patients: ${error.message || 'Unknown error'}`);
      }
    }
  },
  
  // Get recent patients for a hospital
  async getRecentPatients(hospitalId: string, count: number = 5): Promise<Patient[]> {
    try {
      const q = query(
        collection(this.getFirestore(), 'patients'),
        where('hospitalId', '==', hospitalId),
        orderBy('createdAt', 'desc'),
        limit(count)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Patient;
      });
    } catch (error) {
      console.error('Error getting recent patients:', error);
      throw new Error('Failed to retrieve recent patients');
    }
  },
  
  // Search patients by name
  async searchPatients(hospitalId: string, searchTerm: string): Promise<Patient[]> {
    try {
      // Firestore doesn't support direct text search, so we need to fetch and filter
      const q = query(
        collection(this.getFirestore(), 'patients'),
        where('hospitalId', '==', hospitalId)
      );
      
      const querySnapshot = await getDocs(q);
      const patients = querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Patient;
      });
      
      // Filter on the client side
      return patients.filter(patient => {
        // Access properties safely from the raw data
        const patientData = patient as any;
        const firstName = patientData.firstName || '';
        const lastName = patientData.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        
        // Also check the name property if it exists (for compatibility)
        const nameField = patientData.name ? patientData.name.toLowerCase() : '';
        
        return fullName.includes(searchTerm.toLowerCase()) || 
               nameField.includes(searchTerm.toLowerCase());
      });
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error('Failed to search patients');
    }
  }
}; 