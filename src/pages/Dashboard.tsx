import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, Calendar, ChevronRight, FileText, MessageCircle, RefreshCcw, Settings, Stethoscope, Users, UserPlus, TrendingUp, BarChart4, UserRound, CalendarDays, Plus, MoreHorizontal, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useHospital } from '@/context/HospitalContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Patient } from '@/types/Patient';
import { Chat as BaseChat } from '@/types/Chat';
import { Appointment } from '@/types/Appointment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface DashboardStats {
  totalPatients: number;
  newPatientsLastMonth: number;
  consultationsThisMonth: number;
  activePatients: number;
}

// Extend the Chat interface for use in Dashboard
interface Chat extends BaseChat {
  patientName?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { hospital } = useHospital();
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [debug, setDebug] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    newPatientsLastMonth: 0,
    consultationsThisMonth: 0,
    activePatients: 0,
  });

  const fetchDashboardData = async () => {
    if (!hospital?.id || !db) return;
    
    setIsLoading(true);
    
    try {
      console.log("Starting to fetch dashboard data for hospital:", hospital.id);
      
      // Fetch patients with a simpler query
      try {
        const patientsRef = collection(db as any, 'patients');
        const patientsQuery = query(
          patientsRef,
          where('hospitalId', '==', hospital.id)
        );
        
        console.log("Fetching patients...");
        const patientsSnapshot = await getDocs(patientsQuery);
        console.log(`Found ${patientsSnapshot.size} patients`);
        
        const patientsData = patientsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data 
          } as Patient;
        });
        
        console.log("Patient data:", patientsData);
        setPatients(patientsData);
        
        // Calculate statistics right away since we have patient data
        const totalPatients = patientsData.length;
        console.log("Total patients:", totalPatients);
        
        setStats(prev => ({
          ...prev,
          totalPatients
        }));
        
      } catch (patientError) {
        console.error("Error fetching patients:", patientError);
      }
      
      // Fetch appointments with proper date filtering
      try {
        const appointmentsRef = collection(db as any, 'appointments');
        const appointmentsQuery = query(
          appointmentsRef,
          where('hospitalId', '==', hospital.id)
        );
        
        console.log("Fetching appointments...");
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        console.log(`Found ${appointmentsSnapshot.size} appointments`);
        
        // Get today's date in the same format as stored appointments
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd'); // Format: 2026-02-04
        
        console.log("Today's date:", todayStr);
        
        // If we found appointments, filter for today only
        if (appointmentsSnapshot.size > 0) {
          const appointmentsData = appointmentsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              id: doc.id, 
              ...data 
            } as Appointment;
          });
          
          console.log("All appointments:", appointmentsData);
          
          // Filter for today's appointments only
          const todaysAppointments = appointmentsData.filter(apt => {
            // Check if appointment date matches today
            if (apt.date) {
              // Handle different date formats
              let aptDate = apt.date;
              
              // If date is in format "dd MMM yyyy" (e.g., "04 Feb 2026"), convert it
              if (aptDate.includes(' ')) {
                try {
                  const parsedDate = new Date(aptDate);
                  aptDate = format(parsedDate, 'yyyy-MM-dd');
                } catch (e) {
                  console.log('Could not parse date:', aptDate);
                }
              }
              
              // If date is in format "yyyy-MM-dd", compare directly
              const isToday = aptDate === todayStr || aptDate.startsWith(todayStr);
              
              console.log(`Comparing: ${aptDate} === ${todayStr} ? ${isToday}`);
              
              return isToday;
            }
            return false;
          });
          
          console.log("Today's appointments:", todaysAppointments);
          
          // Sort by time
          todaysAppointments.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
          });
          
          // Set only today's appointments
          setTodayAppointments(todaysAppointments);
          
          // Set past appointments (previous dates)
          const past = appointmentsData.filter(apt => {
            if (apt.date) {
              let aptDate = apt.date;
              
              // Convert to yyyy-MM-dd format if needed
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
          })
          .sort((a, b) => {
            // Sort past appointments by date descending (most recent first)
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
          })
          .slice(0, 10); // Limit to 10 most recent past appointments
          
          setPastAppointments(past);
        } else {
          // No appointments found
          console.log("No appointments found");
          setTodayAppointments([]);
          setPastAppointments([]);
        }
      } catch (appointmentError) {
        console.error("Error fetching appointments:", appointmentError);
        setTodayAppointments([]);
        setPastAppointments([]);
      }
      
      // Fetch recent chats in a separate try/catch
      try {
        const chatsRef = collection(db as any, 'chats');
        const chatsQuery = query(
          chatsRef,
          where('hospitalId', '==', hospital.id),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        console.log("Fetching chats...");
        const chatsSnapshot = await getDocs(chatsQuery);
        console.log(`Found ${chatsSnapshot.size} chats`);
        
        const chatsData = chatsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Chat));
        
        setRecentChats(chatsData);
        
        // Update consultations statistic
        setStats(prev => ({
          ...prev,
          consultationsThisMonth: chatsData.length
        }));
        
      } catch (chatError) {
        console.error("Error fetching chats:", chatError);
      }
      
    } catch (error) {
      console.error('Error in main fetchDashboardData flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (hospital && hospital.id) {
      console.log('Dashboard: Starting to fetch data for hospital:', hospital.id);
      fetchDashboardData();
    } else {
      console.log('Dashboard: Waiting for hospital data...');
    }
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, navigate, hospital]);
  
  // Debug useEffect to log when stats update
  useEffect(() => {
    console.log('Dashboard stats updated to:', stats);
  }, [stats]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
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

  // JSX for the empty state message
  const appointmentsEmptyState = (
    <div className="py-8 text-center">
      <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium mb-2">No appointments for today</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
        {isLoading ? 'Loading appointments...' : 
         'There are no appointments scheduled for today. Use the Reception page to book new appointments.'}
      </p>
      {!isLoading && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="default"
            onClick={() => navigate('/reception')}
            className="sm:w-auto w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Book New Appointment
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/reception?tab=appointments')}
            className="sm:w-auto w-full"
          >
            Manage Appointments
          </Button>
        </div>
      )}
    </div>
  );

  // Add a function to update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: string, patientName: string) => {
    try {
      setIsLoading(true);
      await updateDoc(doc(db as any, 'appointments', appointmentId), {
        status
      });
      
      toast({
        title: "Appointment updated",
        description: `${patientName}'s appointment is now ${status}`,
        variant: status === 'cancelled' ? 'destructive' : 'default',
      });
      
      fetchDashboardData();
    } catch (e) {
      console.error("Error updating status:", e);
      toast({
        title: "Update failed",
        description: "Could not update the appointment status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="consultations" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Consultations</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 hidden lg:flex">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {format(new Date(), 'HH:mm, dd MMM yyyy')}
            </span>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchDashboardData}
                disabled={isLoading}
                title="Refresh data"
                className="relative"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Hidden debug toggle - double-click to activate */}
              <div 
                className="w-2 h-2 rounded-full bg-transparent" 
                onDoubleClick={() => setDebug(prev => !prev)}
                title="Double-click for debug mode"
              />
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="mt-2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Hospital Info */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {hospital?.logo ? (
                <img 
                  src={hospital.logo} 
                  alt={`${hospital.name} logo`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hospital?.name || 'Your Hospital'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {hospital?.address || `${hospital?.city || ''}, ${hospital?.state || ''}`}
                </p>
              </div>
            </motion.div>

            {/* Enhanced Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.newPatientsLastMonth || 0} from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultations This Month</CardTitle>
                  <BarChart4 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.consultationsThisMonth || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.consultationsThisMonth || 0} per day on average
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePatients || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activePatients || 0} active patients
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">All Systems Operational</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Database: Connected
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Access Cards */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-base">Add New Patient</CardTitle>
                      <CardDescription>Register a new patient in the system</CardDescription>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => navigate('/add-patient')}
                      >
                        Add Patient
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <UserRound className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <CardTitle className="text-base">Reception</CardTitle>
                      <CardDescription>Register patients and book appointments</CardDescription>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => navigate('/reception')}
                      >
                        Go to Reception
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Stethoscope className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle className="text-base">Consultations</CardTitle>
                      <CardDescription>Start AI-assisted patient consultations</CardDescription>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => navigate('/consultations')}
                      >
                        View Consultations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-base">Patient Records</CardTitle>
                      <CardDescription>View and manage patient records</CardDescription>
                      <Button 
                        className="w-full mt-2" 
                        variant="outline"
                        onClick={() => navigate('/patients')}
                      >
                        View Patients
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <CardTitle className="text-base">Reports</CardTitle>
                      <CardDescription>Generate statistics and reports</CardDescription>
                      <Button 
                        className="w-full mt-2" 
                        variant="outline"
                        onClick={() => navigate('/reports')}
                      >
                        View Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            
            {/* Additional Quick Action Cards */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Hospital Profile</CardTitle>
                        <CardDescription className="text-xs">Manage hospital information</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => navigate('/hospital-profile')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                        <Settings className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">System Settings</CardTitle>
                        <CardDescription className="text-xs">Configure application preferences</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => navigate('/settings')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
                        <BarChart4 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Analytics Dashboard</CardTitle>
                        <CardDescription className="text-xs">View detailed analytics</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => navigate('/reports')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="grid grid-cols-1 gap-6">
                {/* Recent patients and consultations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Patients</CardTitle>
                      <CardDescription>New patient registrations</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-4">
                        {patients.slice(0, 3).map((patient) => (
                          <div key={patient.id} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <UserRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {patient.createdAt && (
                                  typeof patient.createdAt === 'string' 
                                    ? format(new Date(patient.createdAt), 'MMM dd, yyyy') 
                                    : format(patient.createdAt.toDate(), 'MMM dd, yyyy')
                                )}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => navigate(`/patient/${patient.id}`)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {patients.length === 0 && (
                          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                            <p>No recent patients</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/patients')}
                      >
                        View All Patients
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Consultations</CardTitle>
                      <CardDescription>Latest patient consultations</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-4">
                        {recentChats.slice(0, 3).map((chat) => (
                          <div key={chat.id} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {chat.patientName || "Anonymous Patient"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {chat.createdAt && (
                                  typeof chat.createdAt === 'string' 
                                    ? format(new Date(chat.createdAt), 'MMM dd, yyyy') 
                                    : format(chat.createdAt.toDate(), 'MMM dd, yyyy')
                                )}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => navigate(`/chat/${chat.id}`)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {recentChats.length === 0 && (
                          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                            <p>No recent consultations</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/consultations')}
                      >
                        View All Consultations
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                {/* Today's Appointments Section */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Today's Appointments</CardTitle>
                      <CardDescription>
                        Scheduled appointments for today
                        {debug && ` (${todayAppointments.length} found)`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/reception')}
                      >
                        <CalendarDays className="h-4 w-4 mr-1" />
                        Book Appointment
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length > 0 ? (
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Patient Name</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Doctor</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayAppointments.map((appointment) => (
                              <TableRow key={appointment.id}>
                                <TableCell className="font-medium">
                                  {appointment.patientName || 'Unknown Patient'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{appointment.date || 'No date'}</div>
                                    <div className="text-gray-500">{appointment.time || 'No time'}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {appointment.doctorName || 'Any Available Doctor'}
                                </TableCell>
                                <TableCell>
                                  {appointment.purpose || 'General Checkup'}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 border-dashed">
                                        <Badge variant={
                                          appointment.status === 'completed' ? 'success' :
                                          appointment.status === 'in-progress' ? 'warning' :
                                          appointment.status === 'cancelled' ? 'destructive' :
                                          'default'
                                        }>
                                          {appointment.status || 'scheduled'}
                                        </Badge>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await updateAppointmentStatus(appointment.id, 'scheduled', appointment.patientName || '');
                                        }}
                                      >
                                        <Badge variant="default" className="mr-2">Scheduled</Badge>
                                        <span>Set as Scheduled</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await updateAppointmentStatus(appointment.id, 'in-progress', appointment.patientName || '');
                                        }}
                                      >
                                        <Badge variant="warning" className="mr-2">In Progress</Badge>
                                        <span>Set as In Progress</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await updateAppointmentStatus(appointment.id, 'completed', appointment.patientName || '');
                                        }}
                                      >
                                        <Badge variant="success" className="mr-2">Completed</Badge>
                                        <span>Set as Completed</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          await updateAppointmentStatus(appointment.id, 'cancelled', appointment.patientName || '');
                                        }}
                                      >
                                        <Badge variant="destructive" className="mr-2">Cancelled</Badge>
                                        <span>Set as Cancelled</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => navigate(`/reception?appointmentId=${appointment.id}`)}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        <span>Edit Appointment</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => navigate(`/chat/new?patientId=${appointment.patientId}`)}
                                      >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        <span>Start Consultation</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => navigate(`/patient/${appointment.patientId}`)}
                                      >
                                        <UserRound className="h-4 w-4 mr-2" />
                                        <span>View Patient</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                                        onClick={async () => {
                                          if (window.confirm(`Are you sure you want to cancel ${appointment.patientName}'s appointment?`)) {
                                            await updateAppointmentStatus(appointment.id, 'cancelled', appointment.patientName || '');
                                          }
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        <span>Cancel Appointment</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      appointmentsEmptyState
                    )}
                  </CardContent>
                  {todayAppointments.length > 0 && (
                    <CardFooter className="pt-0">
                      <div className="flex w-full justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/reception?tab=appointments')}
                        >
                          Manage All Appointments
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchDashboardData}
                          disabled={isLoading}
                        >
                          <RefreshCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>

                {/* Past Appointments Section */}
                {pastAppointments.length > 0 && (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Past Appointments</CardTitle>
                      <CardDescription>
                        Recent appointment history ({pastAppointments.length} appointments)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Patient Name</TableHead>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Doctor</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastAppointments.map((appointment) => (
                              <TableRow key={appointment.id} className="opacity-75">
                                <TableCell className="font-medium">
                                  {appointment.patientName || 'Unknown Patient'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{appointment.date || 'No date'}</div>
                                    <div className="text-gray-500">{appointment.time || 'No time'}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {appointment.doctorName || 'Any Available Doctor'}
                                </TableCell>
                                <TableCell>
                                  {appointment.purpose || 'General Checkup'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    appointment.status === 'completed' ? 'success' :
                                    appointment.status === 'cancelled' ? 'destructive' :
                                    'secondary'
                                  }>
                                    {appointment.status || 'completed'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/reception?tab=appointments')}
                      >
                        View All History
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="patients">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Patient Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This section will allow you to manage all your hospital patients
            </p>
            <Button onClick={() => navigate('/patients')}>
              Go to Patient Management
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="consultations">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Medical Consultations</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start a new consultation or view ongoing patient consultations
            </p>
            <Button onClick={() => navigate('/consultations')}>
              Open Consultation System
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Hospital Reports</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Generate and view reports for your hospital
            </p>
            <Button onClick={() => navigate('/reports')}>
              Open Reports
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Hospital Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Configure your hospital profile and system preferences
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => navigate('/hospital-profile')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Hospital Profile
              </Button>
              <Button 
                onClick={() => navigate('/settings')}
                className="w-full sm:w-auto"
              >
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 