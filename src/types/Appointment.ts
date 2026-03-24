import { Timestamp } from 'firebase/firestore';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  doctorName?: string;
  purpose?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | string;
  hospitalId: string;
  createdAt: Timestamp | string | Date | any;
} 