import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, rtdb } from '../config/firebase';
import { useAuth } from './AuthContext';
import { ref, get } from 'firebase/database';

interface Hospital {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  logo?: string;
  description?: string;
  specialties?: string;
  establishmentYear?: string;
  openingHours?: string;
  settings?: {
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    patientReminders?: boolean;
    shareAnonymousData?: boolean;
    dataRetentionDays?: number;
    darkMode?: boolean;
    highContrastMode?: boolean;
    useRealtimeDB?: boolean;
    automaticUpdates?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

interface HospitalContextType {
  hospital: Hospital | null;
  loading: boolean;
  error: string | null;
  setHospital: (hospital: Hospital) => void;
  refreshHospital: () => Promise<void>;
  fetchHospital: (id: string) => Promise<Hospital | null>;
  createHospital: (hospitalData: Partial<Hospital>) => Promise<string>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export function useHospital() {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
}

export function HospitalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hospital data when user changes
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!user) {
        setHospital(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First try direct document lookup - most efficient
        const directHospitalRef = doc(db, 'hospitals', user.uid);
        const directDocSnap = await getDoc(directHospitalRef);
        
        if (directDocSnap.exists()) {
          const hospitalData = {
            id: directDocSnap.id,
            ...directDocSnap.data()
          } as Hospital;
          
          setHospital(hospitalData);
          setLoading(false);
          return;
        }
        
        // If not found, try to find hospital where this user is registered via userId field
        const hospitalsRef = collection(db, 'hospitals');
        // Check both field names since we might have inconsistent data
        const qUserId = query(hospitalsRef, where('userId', '==', user.uid));
        
        const querySnapshot = await getDocs(qUserId);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const hospitalData = {
            id: docSnap.id,
            ...docSnap.data()
          } as Hospital;
          
          setHospital(hospitalData);
        } else {
          // Try with 'uid' field if 'userId' didn't work
          const qUid = query(hospitalsRef, where('uid', '==', user.uid));
          const uidQuerySnapshot = await getDocs(qUid);
          
          if (!uidQuerySnapshot.empty) {
            const docSnap = uidQuerySnapshot.docs[0];
            const hospitalData = {
              id: docSnap.id,
              ...docSnap.data()
            } as Hospital;
            
            setHospital(hospitalData);
          } else {
            // If not found with either field, set hospital to null
            setHospital(null);
          }
        }
      } catch (err: any) {
        console.error('Error fetching hospital:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [user]);

  const refreshHospital = async () => {
    if (!hospital?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if we should use Realtime Database
      if (hospital.settings?.useRealtimeDB) {
        const hospitalRef = ref(rtdb, `hospitals/${hospital.id}`);
        const snapshot = await get(hospitalRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setHospital({
            id: hospital.id,
            ...data
          });
        }
      } else {
        // Default to Firestore
        const hospitalRef = doc(db, 'hospitals', hospital.id);
        const docSnap = await getDoc(hospitalRef);
        
        if (docSnap.exists()) {
          setHospital({
            id: docSnap.id,
            ...docSnap.data()
          } as Hospital);
        }
      }
    } catch (err: any) {
      console.error('Error refreshing hospital:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospital = async (id: string): Promise<Hospital | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const hospitalRef = doc(db, 'hospitals', id);
      const docSnap = await getDoc(hospitalRef);
      
      if (docSnap.exists()) {
        const hospitalData = {
          id: docSnap.id,
          ...docSnap.data()
        } as Hospital;
        
        return hospitalData;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error fetching hospital by ID:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createHospital = async (hospitalData: Partial<Hospital>): Promise<string> => {
    if (!user) throw new Error('User must be authenticated to create a hospital');
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new hospital document with a generated ID
      const hospitalRef = doc(collection(db, 'hospitals'));
      
      const timestamp = new Date().toISOString();
      
      const newHospital: Hospital = {
        id: hospitalRef.id,
        name: hospitalData.name || 'Unnamed Hospital',
        userId: user.uid,
        email: hospitalData.email || user.email || '',
        createdAt: timestamp,
        updatedAt: timestamp,
        ...hospitalData
      };
      
      await setDoc(hospitalRef, newHospital);
      
      // Update state
      setHospital(newHospital);
      
      return hospitalRef.id;
    } catch (err: any) {
      console.error('Error creating hospital:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    hospital,
    loading,
    error,
    setHospital,
    refreshHospital,
    fetchHospital,
    createHospital
  };

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
} 