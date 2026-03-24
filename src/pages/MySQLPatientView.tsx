import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, User, Mail, Phone, MapPin, ClipboardList, AlertTriangle, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Toast } from '@/components/Toast';

type Patient = {
  id: number;
  patient_id: string;
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
  created_at: string;
  updated_at: string;
};

export function MySQLPatientView() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (patientId) {
      fetchPatient(patientId);
    }
  }, [patientId]);

  const fetchPatient = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`php-api/get-patient.php?id=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPatient(data.patient);
      } else {
        setError(data.message || 'Failed to fetch patient details');
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      formData.append('id', patient.patient_id);
      
      const response = await fetch('php-api/delete-patient.php', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToastMessage("Patient has been deleted successfully.");
        navigate('/mysql-patients');
      } else {
        showToastMessage(data.message || "Failed to delete patient", 'error');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      showToastMessage(err instanceof Error ? err.message : "An unknown error occurred", 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading patient details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>Failed to load patient details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <p>{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                The patient may not exist or there was an error connecting to the database.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/mysql-patients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Button onClick={() => fetchPatient(patientId!)}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Not Found</CardTitle>
          <CardDescription>The requested patient could not be found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            The patient with ID {patientId} does not exist or has been deleted.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => navigate('/mysql-patients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Patient Details</h1>
          <p className="text-muted-foreground">
            View information for {patient.firstName} {patient.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/mysql-patients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/edit-mysql-patient/${patient.patient_id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePatient}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 text-sm">
        <div className="flex items-center">
          <span className="text-muted-foreground mr-2">Patient ID:</span>
          <span className="font-semibold">{patient.patient_id}</span>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground mr-2">Created:</span>
          <span>{new Date(patient.created_at).toLocaleDateString()}</span>
        </div>
        {patient.updated_at && (
          <div className="flex items-center">
            <span className="text-muted-foreground mr-2">Last Updated:</span>
            <span>{new Date(patient.updated_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{patient.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {patient.dateOfBirth 
                        ? new Date(patient.dateOfBirth).toLocaleDateString() 
                        : 'Not specified'}
                    </p>
                    {patient.dateOfBirth && (
                      <p className="text-xs text-muted-foreground">
                        Age: {calculateAge(new Date(patient.dateOfBirth))} years
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {patient.email ? (
                      <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">
                        {patient.email}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {patient.phone ? (
                      <a href={`tel:${patient.phone}`} className="text-blue-600 hover:underline">
                        {patient.phone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {(patient.emergencyContactName || patient.emergencyContactPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.emergencyContactName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {patient.emergencyContactPhone ? (
                      <a href={`tel:${patient.emergencyContactPhone}`} className="text-blue-600 hover:underline">
                        {patient.emergencyContactPhone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">
                {patient.medicalHistory || 'No medical history recorded.'}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">
                  {patient.allergies || 'No allergies recorded.'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">
                  {patient.medications || 'No medications recorded.'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{patient.firstName} {patient.lastName}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">
                  {patient.email ? (
                    <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">
                      {patient.email}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">
                  {patient.phone ? (
                    <a href={`tel:${patient.phone}`} className="text-blue-600 hover:underline">
                      {patient.phone}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">
                {patient.address || 'No address provided.'}
              </div>
              {patient.address && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(patient.address!)}`, '_blank')}
                >
                  View on Map
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{patient.emergencyContactName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">
                  {patient.emergencyContactPhone ? (
                    <a href={`tel:${patient.emergencyContactPhone}`} className="text-blue-600 hover:underline">
                      {patient.emergencyContactPhone}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default MySQLPatientView; 