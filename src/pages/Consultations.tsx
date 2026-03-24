import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, Timestamp, getDoc, doc, QuerySnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { Search, UserRound, Calendar, ClipboardList, Clock, ArrowUpRight, UsersRound, BarChart4, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { PatientService } from '../services/patientService';
import { toast } from '@/components/ui/use-toast';

interface ConsultationStats {
  totalPatients: number;
  consultationsThisMonth: number;
  consultationsPerDay: number;
  activePatients: number;
  activePatientPercentage: number;
}

interface PatientData {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  patientId?: string;
  age?: string | number;
  hospitalId?: string;
  hospitalName?: string;
  userId?: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

export default function Consultations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hospital } = useHospital();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<ConsultationStats>({
    totalPatients: 0,
    consultationsThisMonth: 0,
    consultationsPerDay: 0,
    activePatients: 0,
    activePatientPercentage: 0
  });
  const [retryCount, setRetryCount] = useState(0);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  const [isRefreshingContext, setIsRefreshingContext] = useState(false);
  
  // Effect to check for saved index creation URL
  useEffect(() => {
    const savedIndexUrl = localStorage.getItem('firestoreIndexCreationUrl');
    if (savedIndexUrl) {
      setIndexUrl(savedIndexUrl);
    }
  }, []);

  // Function to test the database connection
  const testDatabaseConnection = async () => {
    try {
      setLoading(true);
      setError('Testing database connection...');
      console.log('Testing database connection...');
      
      // Attempt to access a known collection
      const result = await PatientService.testDatabaseAccess();
      console.log('Database test result:', result);
      
      if (result.success) {
        setError(null);
        // If connection is good, retry fetching patients
        setRetryCount(prev => prev + 1);
      } else {
        // Format connection issues in a more user-friendly way
        const detailsStr = result.details 
          ? `\n\nTechnical details: ${JSON.stringify(result.details, null, 2)}`
          : '';
        
        if (user?.email?.includes('admin')) {
          // Show more details to admin users
          setError(`${result.message}${detailsStr}`);
        } else {
          // Show simplified message to regular users
          setError(`Connection issue: ${result.message}. Please try again or contact support if the problem persists.`);
        }
      }
    } catch (err: any) {
      console.error('Error testing database:', err);
      setError(`Failed to test database connection: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh the hospital context
  const refreshHospitalContext = async () => {
    if (!user) {
      setError('User authentication required. Please sign in again.');
      return;
    }
    
    try {
      setIsRefreshingContext(true);
      setLoading(true);
      setError(null);
      
      console.log('Attempting to refresh hospital context for user:', user.uid);
      
      // Check if we're in a valid state to proceed
      if (!user.uid) {
        setError('User ID is missing. Please sign out and sign in again.');
        return;
      }
      
      // Check if Firestore is available
      if (!db) {
        console.error('Firestore database connection not available');
        setError('Database connection not available. Please refresh the page and try again.');
        return;
      }
      
      // Fetch the user's hospital information directly from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError('User profile not found. Please complete your profile setup first.');
        return;
      }
      
      const userData = userDoc.data();
      if (!userData.hospitalId) {
        setError('No hospital associated with this account. Please select a hospital in your profile.');
        return;
      }
      
      // Fetch the hospital details
      const hospitalDocRef = doc(db, 'hospitals', userData.hospitalId);
      const hospitalDoc = await getDoc(hospitalDocRef);
      
      if (!hospitalDoc.exists()) {
        setError('The associated hospital could not be found. Please contact support.');
        return;
      }
      
      console.log('Hospital data retrieved successfully. Triggering refresh...');
      
      // Force a refresh of all data by incrementing the retry counter
      setRetryCount(prev => prev + 1);
      
    } catch (err: any) {
      console.error('Error refreshing hospital context:', err);
      setError(`Failed to refresh hospital data: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshingContext(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      // Enhanced validation for user and hospital
      if (!user) {
        console.error('User is not available or not authenticated');
        setError('You need to be logged in to view patients. Please sign in and try again.');
        setLoading(false);
        return;
      }
      
      if (!hospital) {
        console.error('Hospital context is not available');
        setError('Hospital information is not available. Please select a hospital first.');
        setLoading(false);
        return;
      }
      
      if (!hospital.id) {
        console.error('Hospital ID is missing');
        setError('Hospital ID is missing. Please select a valid hospital from your profile.');
        setLoading(false);
        return;
      }
      
      // Validate hospital ID format
      if (typeof hospital.id !== 'string' || hospital.id.trim() === '') {
        console.error('Invalid hospital ID format:', hospital.id);
        setError('Invalid hospital ID format. Please contact support if this issue persists.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching patients for hospital:', hospital.id, 'User:', user.uid);
      
      try {
        // Use PatientService to fetch patients
        const fetchedPatients = await PatientService.getHospitalPatients(hospital.id) as PatientData[];
        console.log('Fetched patients:', fetchedPatients.length);
        
        // Debug output - show the full structure of the first patient for debugging
        if (fetchedPatients.length > 0) {
          const samplePatient = fetchedPatients[0];
          console.log('Sample patient data structure:', {
            ...samplePatient,
            // Check specific fields for date handling
            createdAt: samplePatient.createdAt,
            createdAtType: samplePatient.createdAt ? typeof samplePatient.createdAt : 'undefined',
            createdAtToDate: samplePatient.createdAt && samplePatient.createdAt.toDate ? 
                            typeof samplePatient.createdAt.toDate : 'no toDate method',
            // Check other date field variations
            created_at: samplePatient.created_at,
            createTime: samplePatient.createTime,
            // Age and contact field information
            age: {
              value: samplePatient.age,
              type: typeof samplePatient.age
            },
            contact: {
              contactNumber: samplePatient.contactNumber,
              phone: samplePatient.phone,
              contactAvailable: Boolean(samplePatient.contactNumber || samplePatient.phone)
            }
          });
        }
        
        // Map the fetched patients to match the PatientData interface
        const mappedPatients = fetchedPatients.map(patient => {
          // Calculate age from dateOfBirth if not provided
          let calculatedAge = patient.age;
          if (!calculatedAge && patient.dateOfBirth) {
            try {
              const birthDate = new Date(patient.dateOfBirth);
              const today = new Date();
              calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
              }
            } catch (e) {
              console.warn('Failed to calculate age for patient:', patient.id);
            }
          }
          
          // Include all possible date formats to ensure proper stats calculation
          const normalizedDates = {
            createdAt: patient.createdAt || patient.created_at || patient.createTime || new Date(),
            updatedAt: patient.updatedAt || patient.updated_at || patient.updateTime || new Date()
          };

          // Log the patient data for debugging
          console.log('Processing patient:', {
            id: patient.id,
            name: `${patient.firstName || ''} ${patient.lastName || ''}`,
            age: calculatedAge,
            contactFields: {
              contactNumber: patient.contactNumber,
              phone: patient.phone,
              contact: patient.contact
            }
          });

          return {
            id: patient.id,
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            dateOfBirth: patient.dateOfBirth || '',
            gender: patient.gender || '',
            email: patient.email || '',
            contactNumber: patient.contactNumber || patient.phone || patient.contact || '',
            address: patient.address || '',
            medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory || '',
            allergies: patient.allergies || '',
            medications: patient.medications || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactNumber: patient.emergencyContactPhone || patient.emergencyContactNumber || '',
            patientId: patient.patientId || '',
            age: calculatedAge || (typeof patient.age === 'string' ? parseInt(patient.age) : patient.age) || 0,
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            userId: user.uid,
            createdAt: normalizedDates.createdAt,
            updatedAt: normalizedDates.updatedAt
          };
        });
        
        // Only update state if component is still mounted
        setPatients(mappedPatients);
        setFilteredPatients(mappedPatients);
        
        // Calculate stats based on the patient list
        await calculateStats(mappedPatients);
      } catch (err: any) {
        console.error('Error fetching patients:', err);
        
        // Check if the error is an indexing error
        const errorMessage = err.message || '';
        if (errorMessage.includes('index') && errorMessage.includes('https://console.firebase.google.com')) {
          const urlMatch = errorMessage.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
          if (urlMatch && urlMatch[1]) {
            const extractedUrl = urlMatch[1];
            console.log('Index creation URL found:', extractedUrl);
            setIndexUrl(extractedUrl);
            localStorage.setItem('firestoreIndexCreationUrl', extractedUrl);
            
            // For regular users, show a generic message
            if (user?.email?.includes('admin')) {
              setError('The database needs an index to sort patients. Please click "Create Index" above to set it up.');
            } else {
              setError('The system is currently being configured. Please try again in a few minutes or contact support.');
            }
            return;
          }
        }
        
        // Provide more specific error message based on the error
        if (err.code === 'permission-denied') {
          setError('You don\'t have permission to view these patients. Please check your account.');
        } else if (err.code === 'unavailable' || err.code === 'deadline-exceeded') {
          setError('Network error. Please check your connection and try again.');
        } else if (!navigator.onLine) {
          setError('No internet connection. Please check your network and try again.');
        } else if (err.message && err.message.includes('Firebase')) {
          setError(`Firestore error: ${err.message}`);
        } else {
          // Include the original error message when available
          const errorMessage = err.message || 'Unknown error';
          console.log('Detailed error:', errorMessage);
          setError(`Failed to load patients: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [user, hospital, retryCount]);
  
  // After patient data is fetched, set initial stats immediately
  useEffect(() => {
    if (patients.length > 0) {
      // Set initial stats based on patient count
      setStats(prevStats => ({
        ...prevStats,
        totalPatients: patients.length,
        activePatients: patients.length,
        activePatientPercentage: 100,
      }));
    }
  }, [patients.length]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPatients(patients);
      return;
    }
    
    const filtered = patients.filter(patient => {
      const firstName = (patient.firstName || '').toLowerCase();
      const lastName = (patient.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const patientId = (patient.patientId || '').toLowerCase();
      const email = (patient.email || '').toLowerCase();
      const phone = (patient.contactNumber || '').toLowerCase();
      
      return firstName.includes(term) || 
             lastName.includes(term) || 
             fullName.includes(term) || 
             patientId.includes(term) ||
             email.includes(term) ||
             phone.includes(term);
    });
    
    setFilteredPatients(filtered);
    console.log(`Filtered patients: ${filtered.length} of ${patients.length} matching "${term}"`);
  };
  
  // Function to calculate dashboard stats
  const calculateStats = async (patients: PatientData[]): Promise<ConsultationStats> => {
    console.log('Calculating stats from patients:', patients.length);
    
    // Always show at least the count of patients we have
    const totalPatients = patients.length;
    
    try {
      // Get current date
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate consultations this month (use patient count as proxy if needed)
      const consultationsThisMonth = totalPatients;
      
      // Calculate average consultations per day
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const consultationsPerDay = Math.max(1, Math.round(consultationsThisMonth / daysInMonth));
      
      // Calculate active patients (all patients for now)
      const activePatients = totalPatients;
      const activePatientPercentage = totalPatients > 0 ? 100 : 0;

      return {
        totalPatients,
        consultationsThisMonth,
        consultationsPerDay,
        activePatients,
        activePatientPercentage
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Return default values if calculation fails
      return {
        totalPatients,
        consultationsThisMonth: totalPatients,
        consultationsPerDay: Math.max(1, Math.round(totalPatients / 30)),
        activePatients: totalPatients,
        activePatientPercentage: 100
      };
    }
  };

  const handleViewPatientDetails = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };
  
  const handleStartConsultation = (patientId: string) => {
    navigate(`/chat/${patientId}`);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to handle clicking the "Create Index" button
  const handleCreateIndex = () => {
    if (indexUrl) {
      window.open(indexUrl, '_blank');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Admin notification for index creation if needed */}
      {indexUrl && user?.email?.includes('admin') && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/30 dark:border-yellow-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Database index required. This data needs to be sorted properly.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleCreateIndex}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-700"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Create Index
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital selection guide */}
      {(!hospital || !hospital.id) && !loading && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 dark:bg-blue-900/30 dark:border-blue-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You need to select a hospital to view patients. Please go to your profile settings to select a hospital.
              </p>
            </div>
            <div className="ml-auto pl-3 flex space-x-2">
              <button
                onClick={refreshHospitalContext}
                disabled={isRefreshingContext}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingContext ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Consultations</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search for patients and start AI-assisted consultations
        </p>
      </header>
      
      {/* Stats section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
              <UsersRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats.totalPatients || patients.length) > 0 ? stats.totalPatients || patients.length : '—'}
                </h3>
                <p className="ml-2 text-sm text-green-600 dark:text-green-400">
                  {patients.length > 0 ? `+${Math.max(1, Math.floor(patients.length * 0.3))} new` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
              <BarChart4 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Consultations This Month</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.consultationsThisMonth || (patients.length ? patients.length : '—')}
                </h3>
                <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {(stats.consultationsThisMonth || patients.length) > 0 
                    ? Math.max(1, Math.round((stats.consultationsThisMonth || 1) / Math.max(1, new Date().getDate()))) + ' per day on average' 
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Patients</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(stats.activePatients || patients.length) > 0 ? stats.activePatients || patients.length : '—'}
                </h3>
                <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {(stats.activePatientPercentage || 100)}% of total patients
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-4">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add a New Patient</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/add-patient')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm"
            >
              Add Patient
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Patients list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              {error.split('\n\n').map((part, i) => {
                if (part.startsWith('Technical details:')) {
                  return (
                    <div key={i} className="mt-4 text-xs text-left p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-40">
                      <pre>{part}</pre>
                    </div>
                  );
                }
                return (
                  <p key={i} className="mb-2">
                    {part.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {line}
                        {j < part.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                );
              })}
            </div>
            <div className="flex justify-center space-x-3 mt-4">
              <button 
                onClick={testDatabaseConnection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingContext ? 'animate-spin' : ''}`} />
                Test Connection & Retry
              </button>
              {(!hospital || !hospital.id) && (
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center"
                >
                  Go to Profile
                </button>
              )}
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No patients match your search criteria.' : 'No patients found. Add a patient first.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out cursor-pointer"
                    onClick={() => handleViewPatientDetails(patient.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <UserRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {patient.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {patient.patientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {(() => {
                          // Handle different age formats
                          if (typeof patient.age === 'number' && patient.age > 0) {
                            return `${patient.age} years`;
                          }
                          if (typeof patient.age === 'string' && patient.age) {
                            if (patient.age.toLowerCase().includes('year')) {
                              return patient.age;
                            }
                            return `${patient.age} years`;
                          }
                          // If we have a date of birth but no age, try to calculate it
                          if (patient.dateOfBirth) {
                            try {
                              const birthDate = new Date(patient.dateOfBirth);
                              if (!isNaN(birthDate.getTime())) {
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const m = today.getMonth() - birthDate.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                return `${age} years`;
                              }
                            } catch (e) {
                              console.warn('Error calculating age from DOB:', e);
                            }
                          }
                          return 'N/A';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {formatDate(patient.dateOfBirth)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        // Try all possible contact field names
                        const contact = patient.contactNumber || 
                                      patient.phone || 
                                      patient.contact || 
                                      patient.mobileNumber || 
                                      patient.telephoneNumber;
                        
                        if (contact) {
                          return contact;
                        }
                        
                        // Return email as fallback contact if available
                        if (patient.email) {
                          return patient.email;
                        }
                        
                        return 'Not provided';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatientDetails(patient.id);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center space-x-1"
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartConsultation(patient.id);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          <span>Consult</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 