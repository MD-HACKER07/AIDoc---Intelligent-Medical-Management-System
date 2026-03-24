import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useHospital } from '@/context/HospitalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarRange, 
  Download, 
  FileText, 
  Filter, 
  Loader2, 
  PieChart as PieChartIcon, 
  RefreshCw, 
  Users,
  UserRound,
  BarChart3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

// Define interfaces
interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface MonthlyPatientData {
  name: string;
  patients: number;
}

interface MonthlyConsultationData {
  name: string;
  consultations: number;
}

interface PatientData {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  createdAt?: any;
  hospitalId?: string;
  [key: string]: any;
}

interface ConsultationData {
  id: string;
  patientId?: string;
  createdAt?: any;
  hospitalId?: string;
  [key: string]: any;
}

// Define color constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const GENDER_COLORS: Record<string, string> = {
  'Male': '#0088FE',
  'Female': '#FF8042',
  'Other': '#00C49F',
  'Unknown': '#FFBB28'
};

export default function Reports() {
  const { user } = useAuth();
  const { hospital } = useHospital();
  const navigate = useNavigate();

  // State for report data
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [consultationData, setConsultationData] = useState<ConsultationData[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<ChartData[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<ChartData[]>([]);
  const [monthlyPatients, setMonthlyPatients] = useState<MonthlyPatientData[]>([]);
  const [monthlyConsultations, setMonthlyConsultations] = useState<MonthlyConsultationData[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');

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

    if (hospital?.id) {
      generateReports();
    }
  }, [user, hospital, timeRange, navigate]);

  const generateReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!db || !hospital?.id) {
        throw new Error("Firebase Firestore instance or hospital ID is not available");
      }

      // Calculate date range based on selection
      const now = new Date();
      const endDate = endOfMonth(now);
      let startDate;

      switch (timeRange) {
        case '30days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '3months':
          startDate = startOfMonth(subMonths(now, 3));
          break;
        case '6months':
          startDate = startOfMonth(subMonths(now, 6));
          break;
        case '1year':
          startDate = startOfMonth(subMonths(now, 12));
          break;
        default:
          startDate = startOfMonth(subMonths(now, 6));
      }

      // Fetch patients data
      const patientsQuery = query(
        collection(db, 'patients'),
        where('hospitalId', '==', hospital.id)
      );
      
      const patientsSnapshot = await getDocs(patientsQuery);
      
      if (!patientsSnapshot.empty) {
        const patientsList = patientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PatientData[];
        
        setPatientData(patientsList);
        
        // Process gender distribution
        const genderCounts: Record<string, number> = {};
        patientsList.forEach(patient => {
          const gender = patient.gender || 'Unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        
        const genderData: ChartData[] = Object.keys(genderCounts).map(gender => ({
          name: gender,
          value: genderCounts[gender],
          color: GENDER_COLORS[gender as keyof typeof GENDER_COLORS] || '#8884d8'
        }));
        
        setGenderDistribution(genderData);
        
        // Process age distribution
        const ageCounts: Record<string, number> = {
          'Under 18': 0,
          '18-30': 0,
          '31-45': 0,
          '46-60': 0,
          'Over 60': 0,
          'Unknown': 0
        };
        
        patientsList.forEach(patient => {
          if (!patient.dateOfBirth) {
            ageCounts['Unknown']++;
            return;
          }
          
          const birthDate = new Date(patient.dateOfBirth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          
          if (age < 18) ageCounts['Under 18']++;
          else if (age <= 30) ageCounts['18-30']++;
          else if (age <= 45) ageCounts['31-45']++;
          else if (age <= 60) ageCounts['46-60']++;
          else ageCounts['Over 60']++;
        });
        
        const ageData: ChartData[] = Object.keys(ageCounts).map((ageGroup, index) => ({
          name: ageGroup,
          value: ageCounts[ageGroup as keyof typeof ageCounts],
          color: COLORS[index % COLORS.length]
        }));
        
        setAgeDistribution(ageData);
        
        // Process monthly patient registrations
        const months = eachMonthOfInterval({
          start: startDate,
          end: endDate
        });
        
        const monthlyPatientData = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const patientsInMonth = patientsList.filter(patient => {
            if (!patient.createdAt) return false;
            
            const createdDate = typeof patient.createdAt === 'string' 
              ? new Date(patient.createdAt) 
              : patient.createdAt.toDate();
              
            return createdDate >= monthStart && createdDate <= monthEnd;
          });
          
          return {
            name: format(month, 'MMM yyyy'),
            patients: patientsInMonth.length
          };
        });
        
        setMonthlyPatients(monthlyPatientData);
      }
      
      // Fetch consultations data
      const consultationsQuery = query(
        collection(db, 'chats'),
        where('hospitalId', '==', hospital.id)
      );
      
      const consultationsSnapshot = await getDocs(consultationsQuery);
      
      if (!consultationsSnapshot.empty) {
        const consultationsList = consultationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConsultationData[];
        
        setConsultationData(consultationsList);
        
        // Process monthly consultations
        const months = eachMonthOfInterval({
          start: startDate,
          end: endDate
        });
        
        const monthlyConsultationData = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const consultationsInMonth = consultationsList.filter(consultation => {
            if (!consultation.createdAt) return false;
            
            const createdDate = typeof consultation.createdAt === 'string' 
              ? new Date(consultation.createdAt) 
              : consultation.createdAt.toDate();
              
            return createdDate >= monthStart && createdDate <= monthEnd;
          });
          
          return {
            name: format(month, 'MMM yyyy'),
            consultations: consultationsInMonth.length
          };
        });
        
        setMonthlyConsultations(monthlyConsultationData);
      }
    } catch (err: any) {
      console.error("Error generating reports:", err);
      setError("Failed to generate reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    // Create a summary report
    const reportData = {
      hospitalName: hospital?.name || 'Hospital',
      generatedDate: new Date().toISOString(),
      timeRange,
      patientStats: {
        total: patientData.length,
        genderDistribution,
        ageDistribution
      },
      consultationStats: {
        total: consultationData.length,
        monthly: monthlyConsultations
      }
    };
    
    // Convert to JSON
    const jsonData = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hospital Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate and view statistical reports for your hospital
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarRange className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateReports}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Refresh
          </Button>
          
          <Button 
            variant="default"
            size="sm"
            onClick={handleExportReport}
            disabled={isLoading || !patientData.length}
          >
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-1">
            <UserRound className="h-4 w-4" />
            Patient Analytics
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Consultation Data
          </TabsTrigger>
        </TabsList>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Patient Demographics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        {genderDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={genderDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {genderDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No patient gender data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChartIcon className="h-5 w-5" />
                          Age Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        {ageDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={ageDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {ageDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No patient age data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Monthly Patient Registrations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-80">
                        {monthlyPatients.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyPatients}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="patients" name="New Patients" fill="#0088FE" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No patient registration data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>
              
              <TabsContent value="patients">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Patient Registrations over Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-96">
                        {monthlyPatients.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyPatients}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="patients" name="New Patients" fill="#0088FE" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No patient registration data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>
              
              <TabsContent value="consultations">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Monthly Consultations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-96">
                        {monthlyConsultations.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyConsultations}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="consultations" name="Consultations" fill="#00C49F" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No consultation data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>
            </>
          )}
        </motion.div>
      </Tabs>
    </div>
  );
} 