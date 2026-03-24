import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  User, FileText, Clock, Calendar, Phone, Mail, 
  MapPin, Heart, Pill, AlertTriangle, MessageCircle,
  ArrowLeft, Edit, Share2, Clipboard
} from 'lucide-react';

interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  patientId: string;
  age: number;
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
  createdAt: any;
  updatedAt: any;
}

export default function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !user || !db) return;
      
      try {
        setLoading(true);
        const patientRef = doc(db, 'patients', patientId);
        const patientSnap = await getDoc(patientRef);
        
        if (patientSnap.exists()) {
          setPatient({
            id: patientSnap.id,
            ...patientSnap.data() as Omit<PatientData, 'id'>
          });
        } else {
          setError('Patient not found');
        }
      } catch (err: any) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId, user]);
  
  const handleCopyId = () => {
    if (!patient) return;
    
    navigator.clipboard.writeText(patient.patientId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy patient ID:', err);
      });
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !patient) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error || 'Unable to load patient data'}</p>
          <button 
            onClick={() => navigate('/consultations')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/consultations')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>Back to Consultations</span>
      </button>
      
      {/* Patient header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center mt-1">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full font-mono text-sm mr-2">
                  {patient.patientId}
                </div>
                <button
                  onClick={handleCopyId}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Copy Patient ID"
                >
                  {copied ? 
                    <span className="text-green-600 text-xs font-medium">Copied!</span> : 
                    <Clipboard className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate(`/chat/${patient.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Consultation
            </button>
            <button 
              onClick={() => navigate(`/edit-patient/${patient.id}`)}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg flex items-center hover:bg-blue-200 dark:hover:bg-blue-800/30"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>
      
      {/* Patient information grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Age</div>
              <div className="font-medium">{patient.age} years</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Gender</div>
              <div className="font-medium">{patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not specified'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</div>
              <div className="font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {formatDate(patient.dateOfBirth)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
              <div className="font-medium">{patient.contactNumber || 'Not provided'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
              <div className="font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {patient.email || 'Not provided'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Address</div>
              <div className="font-medium flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1 flex-shrink-0" />
                <span>{patient.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Emergency Contact
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
              <div className="font-medium">{patient.emergencyContactName || 'Not provided'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
              <div className="font-medium">{patient.emergencyContactNumber || 'Not provided'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Insurance</div>
              <div className="font-medium">{patient.insuranceProvider || 'Not provided'}</div>
              {patient.insuranceNumber && (
                <div className="text-sm text-gray-500 mt-1">Policy: {patient.insuranceNumber}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Medical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medical History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Medical History
          </h2>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg min-h-[120px]">
            {patient.medicalHistory ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{patient.medicalHistory}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No medical history recorded</p>
            )}
          </div>
        </div>
        
        {/* Medications and Allergies */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Medications & Allergies
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Medications</div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg min-h-[60px]">
                {patient.medications ? (
                  <p className="text-gray-700 dark:text-gray-300">{patient.medications}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No medications recorded</p>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Allergies</div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg min-h-[60px]">
                {patient.allergies ? (
                  <p className="text-gray-700 dark:text-gray-300">{patient.allergies}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No allergies recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Notes */}
      {patient.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Notes
          </h2>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{patient.notes}</p>
          </div>
        </div>
      )}
      
      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>
            Created: {patient.createdAt ? (
              patient.createdAt.toDate ? 
                patient.createdAt.toDate().toLocaleString() : 
                new Date(patient.createdAt).toLocaleString()
            ) : 'Unknown'}
          </span>
        </div>
        {patient.updatedAt && patient.updatedAt !== patient.createdAt && (
          <div>
            Last updated: {patient.updatedAt.toDate ? 
              patient.updatedAt.toDate().toLocaleString() : 
              new Date(patient.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
} 