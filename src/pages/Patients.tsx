import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, getDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useHospital } from '@/context/HospitalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInYears } from 'date-fns';

interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  contactNumber?: string;
  email?: string;
  patientId?: string;
  createdAt?: string | any;
  lastVisit?: string | any;
  status?: string;
  insuranceProvider?: string;
  medicalHistory?: string;
  hospitalId?: string;
}

export default function Patients() {
  const { user } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
    
    if (hospital?.id) {
      fetchPatients();
    }
  }, [user, hospital, navigate]);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching patients start, hospital:", hospital);
      console.log("Firebase db available:", !!db);
      
      if (!db || !hospital?.id) {
        const errorMessage = !db 
          ? "Firebase Firestore instance is not available" 
          : "Hospital ID is not available";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      console.log("Creating query for hospitalId:", hospital.id);
      
      // Try with a simpler query first (without orderBy which might be causing issues)
      let patientsQuery = query(
        collection(db, 'patients'),
        where('hospitalId', '==', hospital.id),
        limit(50)
      );
      
      try {
        console.log("Executing simplified query without orderBy...");
        const snapshot = await getDocs(patientsQuery);
        console.log("Query completed, docs:", snapshot.size);
        
        if (snapshot.empty) {
          console.log("No patients found with simplified query");
          setPatients([]);
          setFilteredPatients([]);
          setHasMore(false);
        } else {
          console.log("Processing patient data from simplified query...");
          const patientsList = snapshot.docs.map(doc => {
            const data = doc.data() as Patient;
            return {
              ...data,
              id: doc.id,
              // Calculate age if dateOfBirth exists
              age: data.dateOfBirth ? 
                differenceInYears(new Date(), parseISO(data.dateOfBirth)) : 
                undefined
            };
          });
          
          console.log(`Processed ${patientsList.length} patients`);
          
          // Sort manually instead of in the query
          const sortField = sortBy === 'name' ? 'lastName' : 
                           sortBy === 'age' ? 'dateOfBirth' : sortBy;
          
          const sortedList = [...patientsList].sort((a, b) => {
            // Handle nullish values
            const valueA = a[sortField as keyof Patient];
            const valueB = b[sortField as keyof Patient];
            
            if (valueA == null && valueB == null) return 0;
            if (valueA == null) return sortOrder === 'asc' ? -1 : 1;
            if (valueB == null) return sortOrder === 'asc' ? 1 : -1;
            
            // Special handling for dates
            if (sortField === 'dateOfBirth' || sortField === 'createdAt' || sortField === 'lastVisit') {
              const dateA = typeof valueA === 'string' ? new Date(valueA) : 
                           valueA.toDate ? valueA.toDate() : new Date(0);
              const dateB = typeof valueB === 'string' ? new Date(valueB) : 
                           valueB.toDate ? valueB.toDate() : new Date(0);
              
              return sortOrder === 'asc' 
                ? dateA.getTime() - dateB.getTime() 
                : dateB.getTime() - dateA.getTime();
            }
            
            // Regular string comparison
            if (typeof valueA === 'string' && typeof valueB === 'string') {
              return sortOrder === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
            }
            
            // Number comparison
            return sortOrder === 'asc' 
              ? Number(valueA) - Number(valueB) 
              : Number(valueB) - Number(valueA);
          });
          
          setPatients(sortedList);
          setFilteredPatients(sortedList);
          
          // Update pagination state
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length >= 50);
        }
        return; // Exit early if the simplified query worked
      } catch (simplifiedErr: any) {
        console.error("Error with simplified query:", simplifiedErr);
        console.log("Falling back to original query with orderBy...");
      }
      
      // If the simplified query failed, try the original query
      patientsQuery = query(
        collection(db, 'patients'),
        where('hospitalId', '==', hospital.id),
        orderBy(mapSortFieldToFirestore(sortBy), sortOrder === 'asc' ? 'asc' : 'desc'),
        limit(50)
      );
      
      console.log("Executing original query with orderBy...");
      const snapshot = await getDocs(patientsQuery);
      console.log("Query completed, docs:", snapshot.size);
      
      if (snapshot.empty) {
        console.log("No patients found");
        setPatients([]);
        setFilteredPatients([]);
        setHasMore(false);
      } else {
        console.log("Processing patient data...");
        const patientsList = snapshot.docs.map(doc => {
          const data = doc.data() as Patient;
          return {
            ...data,
            id: doc.id,
            // Calculate age if dateOfBirth exists
            age: data.dateOfBirth ? 
              differenceInYears(new Date(), parseISO(data.dateOfBirth)) : 
              undefined
          };
        });
        
        console.log(`Processed ${patientsList.length} patients`);
        setPatients(patientsList);
        setFilteredPatients(patientsList);
        
        // Update pagination state
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= 50);
      }
    } catch (err: any) {
      console.error("Error fetching patients:", err);
      console.error("Error details:", err.code, err.message);
      
      // Provide more specific error messages based on Firebase error codes
      if (err.code === 'permission-denied') {
        setError("Permission denied. You may not have access to the patients collection. Please check your permissions.");
      } else if (err.code === 'unavailable') {
        setError("Firebase service is currently unavailable. Please check your internet connection and try again later.");
      } else if (err.code === 'not-found') {
        setError("The requested collection or document was not found. The database structure may have changed.");
      } else if (err.code === 'resource-exhausted') {
        setError("Too many requests or quota exceeded. Please try again later.");
      } else {
        setError("Failed to load patients. Please try again. " + (err.message || ""));
      }
    } finally {
      console.log("Fetch patients complete, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Helper function to map sort fields to Firestore fields
  const mapSortFieldToFirestore = (field: string): string => {
    const fieldMap: { [key: string]: string } = {
      'name': 'lastName',
      'lastVisit': 'lastVisit',
      'createdAt': 'createdAt',
      'age': 'dateOfBirth'
    };
    
    return fieldMap[field] || 'createdAt';
  };

  // Apply filters to patients
  useEffect(() => {
    if (!patients.length) return;
    
    let result = [...patients];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(patient => 
        (patient.firstName?.toLowerCase().includes(search) || 
         patient.lastName?.toLowerCase().includes(search) ||
         patient.patientId?.toLowerCase().includes(search) ||
         patient.email?.toLowerCase().includes(search))
      );
    }
    
    // Apply gender filter
    if (genderFilter !== 'all') {
      result = result.filter(patient => patient.gender === genderFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(patient => patient.status === statusFilter);
    }
    
    // Apply age range filter
    if (ageRangeFilter !== 'all') {
      result = result.filter(patient => {
        const age = patient.age || 0;
        switch(ageRangeFilter) {
          case 'under18': return age < 18;
          case '18to30': return age >= 18 && age <= 30;
          case '31to50': return age > 30 && age <= 50;
          case 'over50': return age > 50;
          default: return true;
        }
      });
    }
    
    // Apply tab filter
    switch(activeTab) {
      case 'recent':
        // Show patients from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        result = result.filter(patient => {
          if (!patient.createdAt) return false;
          const createdDate = typeof patient.createdAt === 'string' 
            ? new Date(patient.createdAt) 
            : patient.createdAt.toDate();
          return createdDate >= thirtyDaysAgo;
        });
        break;
      case 'active':
        // Show patients with status "active" or recent visits
        result = result.filter(patient => patient.status === 'active');
        break;
      case 'inactive':
        // Show patients without recent activity
        result = result.filter(patient => patient.status === 'inactive');
        break;
    }
    
    setFilteredPatients(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [patients, searchTerm, genderFilter, statusFilter, ageRangeFilter, activeTab]);

  // Get current patients for pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle new patient button click
  const handleAddNewPatient = () => {
    navigate('/add-patient');
  };

  // Handle row click to navigate to patient details
  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  // Handle export to CSV
  const exportToCSV = () => {
    if (!filteredPatients.length) return;
    
    // Create CSV content
    const headers = ['Patient ID', 'First Name', 'Last Name', 'Gender', 'Age', 'Contact', 'Email', 'Status', 'Last Visit'];
    const csvContent = [
      headers.join(','),
      ...filteredPatients.map(patient => [
        patient.patientId || '',
        patient.firstName || '',
        patient.lastName || '',
        patient.gender || '',
        patient.age || '',
        patient.contactNumber || '',
        patient.email || '',
        patient.status || '',
        patient.lastVisit ? (typeof patient.lastVisit === 'string' ? patient.lastVisit : format(patient.lastVisit.toDate(), 'yyyy-MM-dd')) : ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `patients_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setStatusFilter('all');
    setAgeRangeFilter('all');
    setActiveTab('all');
  };
  
  // Test Firebase connection
  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setError("Testing Firebase connection...");
    
    try {
      // Test 1: Check if Firebase is initialized
      if (!db) {
        setError("Firebase Firestore is not initialized properly. Check your firebase config.");
        return;
      }
      
      // Test 2: Try to read the hospitals collection (should be readable)
      try {
        console.log("Testing hospitals collection access...");
        const hospitalsRef = collection(db, 'hospitals');
        const hospitalsSnapshot = await getDocs(query(hospitalsRef, limit(1)));
        console.log("Hospitals collection accessible, docs:", hospitalsSnapshot.size);
      } catch (err: any) {
        console.error("Error accessing hospitals collection:", err);
        setError(`Cannot access hospitals collection: ${err.message}. Check Firestore permissions.`);
        return;
      }
      
      // Test 3: Try to read hospital document if available
      if (hospital?.id) {
        try {
          console.log("Testing specific hospital document access...");
          const hospitalDoc = await getDoc(doc(db, 'hospitals', hospital.id));
          console.log("Hospital document exists:", hospitalDoc.exists());
        } catch (err: any) {
          console.error("Error accessing hospital document:", err);
          setError(`Cannot access hospital document: ${err.message}`);
          return;
        }
        
        // Test 4: Try to read the patients collection
        try {
          console.log("Testing patients collection access...");
          // Just test if we can access the collection without filters
          const patientsRef = collection(db, 'patients');
          const testQuery = query(patientsRef, limit(1));
          await getDocs(testQuery);
          console.log("Patients collection is accessible");
          
          // Now test with the hospitalId filter
          const filteredQuery = query(
            patientsRef,
            where('hospitalId', '==', hospital.id),
            limit(1)
          );
          const snapshot = await getDocs(filteredQuery);
          console.log("Patients filtered query successful, found:", snapshot.size);
          
          if (snapshot.empty) {
            setError("Firebase connection is working, but no patients found for this hospital.");
          } else {
            setError("Firebase connection is working! Try refreshing the page or try again later.");
          }
        } catch (err: any) {
          console.error("Error accessing patients collection:", err);
          setError(`Cannot query patients: ${err.message}. Check Firestore permissions and rules.`);
          return;
        }
      } else {
        setError("Hospital data is missing or incomplete. Try logging out and back in.");
      }
    } catch (err: any) {
      console.error("Test failed:", err);
      setError(`Firebase test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a test patient function
  const addTestPatient = async () => {
    setIsLoading(true);
    setError("Creating a test patient...");
    
    try {
      if (!db || !hospital?.id) {
        setError("Cannot create test patient: Missing database or hospital information");
        return;
      }
      
      const testPatient = {
        firstName: "Test",
        lastName: "Patient",
        gender: "Other",
        dateOfBirth: "1990-01-01",
        contactNumber: "123-456-7890",
        email: "test@example.com",
        patientId: `TEST-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "active",
        hospitalId: hospital.id
      };
      
      const patientsRef = collection(db, 'patients');
      const docRef = await addDoc(patientsRef, testPatient);
      
      setError(`Test patient created successfully with ID: ${docRef.id}. Try refreshing the patients list.`);
      
      // Refresh the patient list
      setTimeout(() => {
        fetchPatients();
      }, 1500);
    } catch (err: any) {
      console.error("Error creating test patient:", err);
      setError(`Failed to create test patient: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Change patient status
  const changePatientStatus = async (patientId: string, newStatus: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!db || !hospital?.id) {
        setError("Cannot change patient status: Missing database or hospital information");
        return;
      }
      
      const patientsRef = collection(db, 'patients');
      const docRef = doc(patientsRef, patientId);
      await updateDoc(docRef, {
        status: newStatus
      });
      
      setError(`Patient status changed successfully to: ${newStatus}`);
      
      // Refresh the patient list
      setTimeout(() => {
        fetchPatients();
      }, 1500);
    } catch (err: any) {
      console.error("Error changing patient status:", err);
      setError(`Failed to change patient status: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and manage all your hospital patients
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchPatients}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Refresh
          </Button>
          <Button 
            onClick={handleAddNewPatient}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Patient
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <span className="block sm:inline">{error}</span>
          <div className="mt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={testFirebaseConnection}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Test Connection
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log("Debug info:");
                console.log("Firebase db:", db);
                console.log("Hospital:", hospital);
                console.log("User:", user);
                console.log("Firebase initialized:", !!db);
                
                if (db && hospital?.id) {
                  console.log("All required data is available, issue might be with Firestore permissions or network connectivity");
                } else if (!db) {
                  console.log("Firebase Firestore is not initialized properly");
                } else if (!hospital?.id) {
                  console.log("Hospital data is missing or incomplete");
                }
                
                // Show more helpful error message
                setError("Debug info logged to console. " + 
                  (!db ? "Firebase not initialized. " : "") + 
                  (!hospital?.id ? "Hospital data missing. " : "") +
                  "Please check console for details.");
              }}
            >
              Debug Issue
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addTestPatient}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Test Patient
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  All Patients
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Inactive
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredPatients.length} patients
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToCSV}
                  disabled={!filteredPatients.length}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Age Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="under18">Under 18</SelectItem>
                    <SelectItem value="18to30">18-30</SelectItem>
                    <SelectItem value="31to50">31-50</SelectItem>
                    <SelectItem value="over50">Over 50</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="px-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Tabs>
        </CardHeader>

        <CardContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPatients.length > 0 ? (
              <div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPatients.map((patient) => (
                        <TableRow
                          key={patient.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          onClick={() => handlePatientClick(patient.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {patient.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{patient.patientId}</TableCell>
                          <TableCell>{patient.gender}</TableCell>
                          <TableCell>{patient.age}</TableCell>
                          <TableCell className="text-sm">{patient.contactNumber}</TableCell>
                          <TableCell>
                            <Badge variant={
                              patient.status === 'active' ? 'default' :
                              patient.status === 'inactive' ? 'secondary' :
                              'outline'
                            }>
                              {patient.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {patient.lastVisit ? (
                              <div className="flex items-center text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {typeof patient.lastVisit === 'string' 
                                  ? format(new Date(patient.lastVisit), 'dd MMM yyyy')
                                  : patient.lastVisit.toDate 
                                    ? format(patient.lastVisit.toDate(), 'dd MMM yyyy')
                                    : 'Unknown'
                                }
                              </div>
                            ) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  navigate(`/patient/${patient.id}`);
                                }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  navigate(`/chat?patientId=${patient.id}`);
                                }}>
                                  Start Consultation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  navigate(`/edit-patient/${patient.id}`);
                                }}>
                                  Edit Patient
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="font-semibold"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    changePatientStatus(patient.id, 'active');
                                  }}
                                  className="pl-6 text-green-600 dark:text-green-500"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Active
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    changePatientStatus(patient.id, 'inactive');
                                  }}
                                  className="pl-6 text-gray-600 dark:text-gray-400"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Mark as Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    changePatientStatus(patient.id, 'waiting');
                                  }}
                                  className="pl-6 text-orange-600 dark:text-orange-500"
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Mark as Waiting
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    changePatientStatus(patient.id, 'completed');
                                  }}
                                  className="pl-6 text-blue-600 dark:text-blue-500"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => paginate(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show current page and surrounding pages
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => paginate(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No patients found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || genderFilter !== 'all' || statusFilter !== 'all' || ageRangeFilter !== 'all' ? 
                    'Try adjusting your filters to find what you\'re looking for.' : 
                    'Get started by adding your first patient.'}
                </p>
                {searchTerm || genderFilter !== 'all' || statusFilter !== 'all' || ageRangeFilter !== 'all' ? (
                  <Button variant="outline" onClick={resetFilters}>
                    <Filter className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={handleAddNewPatient}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Patient
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
} 