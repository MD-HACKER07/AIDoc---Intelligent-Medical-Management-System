import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useHospital } from '@/context/HospitalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  UserRound, 
  CalendarDays, 
  Loader2,
  Save,
  CheckCircle,
  RefreshCw,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Define interfaces
interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  patientId?: string;
  gender?: string;
  dateOfBirth?: string;
  contactNumber?: string;
  email?: string;
  status?: string;
  hospitalId: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  date: string;
  time: string;
  doctorName?: string;
  purpose?: string;
  status: string;
  hospitalId: string;
  createdAt: string;
}

export default function Reception() {
  const { user } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  // State for patient registration
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // State for appointment booking
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [appointmentPurpose, setAppointmentPurpose] = useState('');
  
  // State for appointment viewing
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('register');
  const [appointmentView, setAppointmentView] = useState<'today' | 'past'>('today');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [user, hospital, activeTab, navigate]);

  // Search patients
  const searchPatients = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      if (!db || !hospital?.id) {
        throw new Error("Firebase or hospital ID not available");
      }
      
      const patientsRef = collection(db, 'patients');
      const q = query(
        patientsRef,
        where('hospitalId', '==', hospital.id),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const results: Patient[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as Patient;
        const isMatch = 
          (data.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           data.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           data.contactNumber?.includes(searchTerm) ||
           data.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           data.patientId?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (isMatch) {
          results.push({
            ...data,
            id: doc.id
          });
        }
      });
      
      setSearchResults(results);
    } catch (err: any) {
      console.error("Error searching patients:", err);
      setError(`Failed to search patients: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Register new patient
  const registerPatient = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!db || !hospital?.id) {
        throw new Error("Firebase or hospital ID not available");
      }
      
      // Validate fields
      if (!firstName || !lastName) {
        throw new Error("First name and last name are required");
      }
      
      const timestamp = new Date().toISOString();
      const patientId = `PT-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const newPatient: Patient = {
        firstName,
        lastName,
        gender,
        dateOfBirth,
        contactNumber,
        email,
        address,
        patientId,
        status: 'new',
        hospitalId: hospital.id,
        createdAt: timestamp
      };
      
      const patientsRef = collection(db, 'patients');
      const docRef = await addDoc(patientsRef, newPatient);
      
      setSuccess(`Patient ${firstName} ${lastName} registered successfully with ID: ${patientId}`);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setGender('');
      setDateOfBirth('');
      setContactNumber('');
      setEmail('');
      setAddress('');
      
      // Set as selected patient for appointment
      setSelectedPatient({
        ...newPatient,
        id: docRef.id
      });
      
      // Switch to appointment tab
      setActiveTab('book');
    } catch (err: any) {
      console.error("Error registering patient:", err);
      setError(`Failed to register patient: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Book appointment
  const bookAppointment = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!db || !hospital?.id) {
        throw new Error("Firebase or hospital ID not available");
      }
      
      if (!selectedPatient) {
        throw new Error("Please select a patient first");
      }
      
      if (!appointmentDate) {
        throw new Error("Appointment date is required");
      }
      
      if (!appointmentTime) {
        throw new Error("Appointment time is required");
      }
      
      const timestamp = new Date().toISOString();
      const formattedDate = format(appointmentDate, 'yyyy-MM-dd');
      
      const newAppointment = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        date: formattedDate,
        time: appointmentTime,
        doctorName: doctorName || 'Any Available Doctor',
        purpose: appointmentPurpose,
        status: 'scheduled',
        hospitalId: hospital.id,
        createdAt: timestamp
      };
      
      const appointmentsRef = collection(db, 'appointments');
      await addDoc(appointmentsRef, newAppointment);
      
      setSuccess(`Appointment booked successfully for ${selectedPatient.firstName} ${selectedPatient.lastName} on ${formattedDate} at ${appointmentTime}`);
      
      // Reset form
      setSelectedPatient(null);
      setAppointmentDate(new Date());
      setAppointmentTime('');
      setDoctorName('');
      setAppointmentPurpose('');
      setSearchTerm('');
      setSearchResults([]);
      
      // Refresh appointments list
      setActiveTab('appointments');
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      setError(`Failed to book appointment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!db || !hospital?.id) {
        throw new Error("Firebase or hospital ID not available");
      }
      
      const appointmentsRef = collection(db, 'appointments');
      
      // Get today's date
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd'); // Format: 2026-02-04
      
      console.log("Fetching appointments for today:", todayStr);
      
      // Use a simpler query without multiple orderBy clauses
      const q = query(
        appointmentsRef,
        where('hospitalId', '==', hospital.id),
        limit(100) // Get more to filter client-side
      );
      
      try {
        const snapshot = await getDocs(q);
        const appointmentsList: Appointment[] = [];
        
        snapshot.forEach(doc => {
          appointmentsList.push({
            ...doc.data() as Appointment,
            id: doc.id
          });
        });
        
        console.log("All appointments fetched:", appointmentsList.length);
        
        // Filter for today's appointments only
        const todaysAppointments = appointmentsList.filter(apt => {
          if (apt.date) {
            let aptDate = apt.date;
            
            // Handle different date formats
            if (aptDate.includes(' ')) {
              try {
                const parsedDate = new Date(aptDate);
                aptDate = format(parsedDate, 'yyyy-MM-dd');
              } catch (e) {
                console.log('Could not parse date:', aptDate);
                return false;
              }
            }
            
            // Compare dates
            const isToday = aptDate === todayStr || aptDate.startsWith(todayStr);
            return isToday;
          }
          return false;
        });
        
        console.log("Today's appointments:", todaysAppointments.length);
        
        // Sort by time
        todaysAppointments.sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
        
        setAppointments(todaysAppointments);
        
        // Also get past appointments
        const pastAppts = appointmentsList.filter(apt => {
          if (apt.date) {
            let aptDate = apt.date;
            
            if (aptDate.includes(' ')) {
              try {
                const parsedDate = new Date(aptDate);
                aptDate = format(parsedDate, 'yyyy-MM-dd');
              } catch (e) {
                return false;
              }
            }
            
            return aptDate < todayStr;
          }
          return false;
        });
        
        // Sort past appointments by date descending
        pastAppts.sort((a, b) => {
          let dateA = a.date;
          let dateB = b.date;
          
          if (dateA.includes(' ')) {
            try {
              dateA = format(new Date(dateA), 'yyyy-MM-dd');
            } catch (e) {
              return 0;
            }
          }
          
          if (dateB.includes(' ')) {
            try {
              dateB = format(new Date(dateB), 'yyyy-MM-dd');
            } catch (e) {
              return 0;
            }
          }
          
          return dateB.localeCompare(dateA);
        });
        
        setPastAppointments(pastAppts);
      } catch (error) {
        console.log("Error with query, falling back to simpler query", error);
        
        const fallbackQuery = query(
          appointmentsRef,
          where('hospitalId', '==', hospital.id)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackAppointmentsList: Appointment[] = [];
        
        fallbackSnapshot.forEach(doc => {
          fallbackAppointmentsList.push({
            ...doc.data() as Appointment,
            id: doc.id
          });
        });
        
        // Filter for today only
        const todaysAppointments = fallbackAppointmentsList.filter(apt => {
          if (apt.date) {
            let aptDate = apt.date;
            
            if (aptDate.includes(' ')) {
              try {
                const parsedDate = new Date(aptDate);
                aptDate = format(parsedDate, 'yyyy-MM-dd');
              } catch (e) {
                return false;
              }
            }
            
            return aptDate === todayStr || aptDate.startsWith(todayStr);
          }
          return false;
        });
        
        // Sort by time
        todaysAppointments.sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
        
        setAppointments(todaysAppointments);
        
        // Also get past appointments from fallback
        const pastAppts = fallbackAppointmentsList.filter(apt => {
          if (apt.date) {
            let aptDate = apt.date;
            
            if (aptDate.includes(' ')) {
              try {
                const parsedDate = new Date(aptDate);
                aptDate = format(parsedDate, 'yyyy-MM-dd');
              } catch (e) {
                return false;
              }
            }
            
            return aptDate < todayStr;
          }
          return false;
        });
        
        // Sort past appointments by date descending
        pastAppts.sort((a, b) => {
          let dateA = a.date;
          let dateB = b.date;
          
          if (dateA.includes(' ')) {
            try {
              dateA = format(new Date(dateA), 'yyyy-MM-dd');
            } catch (e) {
              return 0;
            }
          }
          
          if (dateB.includes(' ')) {
            try {
              dateB = format(new Date(dateB), 'yyyy-MM-dd');
            } catch (e) {
              return 0;
            }
          }
          
          return dateB.localeCompare(dateA);
        });
        
        setPastAppointments(pastAppts);
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(`Failed to fetch appointments: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hospital Reception</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Register new patients and book appointments
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="register" className="flex items-center gap-1">
            <UserRound className="h-4 w-4" />
            Register Patient
          </TabsTrigger>
          <TabsTrigger value="book" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Book Appointment
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Today's Appointments
          </TabsTrigger>
        </TabsList>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Patient Registration</CardTitle>
                <CardDescription>
                  Register a new patient in the hospital system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input 
                        id="dateOfBirth" 
                        type="date" 
                        value={dateOfBirth} 
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input 
                        id="contactNumber" 
                        value={contactNumber} 
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Residential address"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={registerPatient}
                  disabled={isLoading || !firstName || !lastName}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Register Patient
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="book">
            <Card>
              <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
                <CardDescription>
                  Schedule an appointment for a patient
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPatient ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Search for Patient</Label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                          <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, contact, email or ID..."
                            className="pl-8"
                          />
                        </div>
                        <Button 
                          onClick={searchPatients}
                          disabled={isSearching || searchTerm.length < 2}
                          variant="outline"
                        >
                          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map((patient) => (
                              <TableRow key={patient.id}>
                                <TableCell className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </TableCell>
                                <TableCell>{patient.patientId}</TableCell>
                                <TableCell>{patient.contactNumber}</TableCell>
                                <TableCell>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedPatient(patient)}
                                    variant="outline"
                                  >
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">OR</span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                    </div>

                    <Button 
                      onClick={() => setActiveTab('register')}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Register a New Patient
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                      <h3 className="font-medium text-blue-700 dark:text-blue-400">
                        Selected Patient: {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-500">
                        {selectedPatient.patientId || 'No ID'} • {selectedPatient.contactNumber || 'No contact'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-blue-700 dark:text-blue-400"
                        onClick={() => setSelectedPatient(null)}
                      >
                        Change Patient
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="appointmentDate">Appointment Date <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {appointmentDate ? format(appointmentDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={appointmentDate}
                              onSelect={setAppointmentDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentTime">Appointment Time <span className="text-red-500">*</span></Label>
                        <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">09:00 AM</SelectItem>
                            <SelectItem value="09:30">09:30 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="10:30">10:30 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="11:30">11:30 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="12:30">12:30 PM</SelectItem>
                            <SelectItem value="14:00">02:00 PM</SelectItem>
                            <SelectItem value="14:30">02:30 PM</SelectItem>
                            <SelectItem value="15:00">03:00 PM</SelectItem>
                            <SelectItem value="15:30">03:30 PM</SelectItem>
                            <SelectItem value="16:00">04:00 PM</SelectItem>
                            <SelectItem value="16:30">04:30 PM</SelectItem>
                            <SelectItem value="17:00">05:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="doctorName">Doctor Name</Label>
                        <Input 
                          id="doctorName" 
                          value={doctorName} 
                          onChange={(e) => setDoctorName(e.target.value)}
                          placeholder="Assign to a specific doctor (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentPurpose">Purpose</Label>
                        <Input 
                          id="appointmentPurpose" 
                          value={appointmentPurpose} 
                          onChange={(e) => setAppointmentPurpose(e.target.value)}
                          placeholder="Reason for appointment"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {selectedPatient && (
                  <Button 
                    onClick={bookAppointment}
                    disabled={isLoading || !appointmentDate || !appointmentTime}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CalendarDays className="h-4 w-4 mr-1" />}
                    Book Appointment
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{appointmentView === 'today' ? "Today's Appointments" : "Past Appointments"}</CardTitle>
                  <CardDescription>
                    {appointmentView === 'today' 
                      ? `View and manage scheduled appointments (${appointments.length} today)` 
                      : `View appointment history (${pastAppointments.length} past appointments)`
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex border rounded-md">
                    <Button 
                      variant={appointmentView === 'today' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAppointmentView('today')}
                      className="rounded-r-none"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Today
                    </Button>
                    <Button 
                      variant={appointmentView === 'past' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAppointmentView('past')}
                      className="rounded-l-none"
                    >
                      <History className="h-4 w-4 mr-1" />
                      Past
                    </Button>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={fetchAppointments}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (appointmentView === 'today' ? appointments : pastAppointments).length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(appointmentView === 'today' ? appointments : pastAppointments).map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-medium">
                              {appointment.patientName}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{format(new Date(appointment.date), 'dd MMM yyyy')}</span>
                                <span className="text-gray-500 text-sm">{appointment.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>{appointment.doctorName}</TableCell>
                            <TableCell>{appointment.purpose || 'General checkup'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                appointment.status === 'completed' ? 'success' :
                                appointment.status === 'in-progress' ? 'warning' :
                                appointment.status === 'cancelled' ? 'destructive' :
                                'default'
                              }>
                                {appointment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <CalendarDays className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-2">No appointments found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      There are no appointments scheduled for today.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('book')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Book New Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
} 