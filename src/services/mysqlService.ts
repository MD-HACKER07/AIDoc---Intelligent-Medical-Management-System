// MySQL service has been removed from the application.
// This file provides a dummy implementation for compatibility.

export class MySQLService {
  // Test connection - returns an appropriate message
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    return { 
      success: false, 
      message: 'MySQL has been removed from this application. Please use Firebase instead.'
    };
  }

  // Create a patient - returns an appropriate message
  static async createPatient(patientData: any): Promise<{ success: boolean; id?: string; message?: string }> {
    console.warn('MySQL service has been removed. Patient not saved to MySQL.');
    return {
      success: false,
      message: 'MySQL has been removed from this application. Please use Firebase instead for storing patient data.'
    };
  }

  // Get all patients - returns an empty array and a message
  static async getAllPatients(): Promise<{ success: boolean; patients?: any[]; message?: string }> {
    console.warn('MySQL service has been removed. Cannot fetch patients from MySQL.');
    return {
      success: false,
      patients: [],
      message: 'MySQL has been removed from this application. Please use Firebase instead for retrieving patient data.'
    };
  }

  // Get a patient by ID - returns a message
  static async getPatientById(id: string): Promise<{ success: boolean; patient?: any; message?: string }> {
    console.warn(`MySQL service has been removed. Cannot fetch patient ${id} from MySQL.`);
    return {
      success: false,
      message: 'MySQL has been removed from this application. Please use Firebase instead for retrieving patient data.'
    };
  }

  // Update a patient - returns a message
  static async updatePatient(id: string, patientData: any): Promise<{ success: boolean; message?: string }> {
    console.warn(`MySQL service has been removed. Cannot update patient ${id} in MySQL.`);
    return {
      success: false,
      message: 'MySQL has been removed from this application. Please use Firebase instead for updating patient data.'
    };
  }

  // Delete a patient - returns a message
  static async deletePatient(id: string): Promise<{ success: boolean; message?: string }> {
    console.warn(`MySQL service has been removed. Cannot delete patient ${id} from MySQL.`);
    return {
      success: false,
      message: 'MySQL has been removed from this application. Please use Firebase instead for deleting patient data.'
    };
  }
} 