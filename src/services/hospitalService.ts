import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import type { HospitalInfo } from '../components/HospitalRegistrationForm';

export const hospitalService = {
  // Get hospital data by user ID
  async getHospitalByUserId(userId: string): Promise<HospitalInfo | null> {
    try {
      const docRef = doc(db, 'hospitals', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as HospitalInfo;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting hospital data:', error);
      throw new Error('Failed to retrieve hospital information');
    }
  },
  
  // Update hospital data
  async updateHospital(userId: string, hospitalData: Partial<HospitalInfo>) {
    try {
      const docRef = doc(db, 'hospitals', userId);
      await updateDoc(docRef, {
        ...hospitalData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating hospital data:', error);
      throw new Error('Failed to update hospital information');
    }
  },
  
  // Check if a hospital exists for the user
  async checkHospitalExists(userId: string): Promise<boolean> {
    try {
      // Try direct document lookup first using userId as the document ID
      const directDocRef = doc(db, 'hospitals', userId);
      const directDocSnap = await getDoc(directDocRef);
      
      if (directDocSnap.exists()) {
        return true;
      }
      
      // If not found by direct ID, try query where userId field matches
      const hospitalsRef = collection(db, 'hospitals');
      const q = query(hospitalsRef, where('uid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking hospital existence:', error);
      return false;
    }
  },
  
  // Get patients for a hospital
  async getHospitalPatients(hospitalId: string) {
    try {
      const q = query(
        collection(db, 'patients'),
        where('hospitalId', '==', hospitalId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting hospital patients:', error);
      throw new Error('Failed to retrieve patient information');
    }
  },
  
  // Get all hospitals (for admin purposes)
  async getAllHospitals() {
    try {
      const querySnapshot = await getDocs(collection(db, 'hospitals'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all hospitals:', error);
      throw new Error('Failed to retrieve hospitals');
    }
  }
}; 