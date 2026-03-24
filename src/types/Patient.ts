export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
  status?: string;
  createdAt: any;
  updatedAt?: any;
  patientId?: string;
  hospitalId?: string;
} 