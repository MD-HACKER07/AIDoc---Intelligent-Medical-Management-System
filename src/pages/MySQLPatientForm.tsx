import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toast } from '@/components/Toast';

import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';

// Form schema
const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MySQLPatientForm() {
  const { patientId } = useParams<{ patientId: string }>();
  const [isEditing, setIsEditing] = useState(!!patientId);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [toastConfig, setToastConfig] = useState({ message: '', visible: false });

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      medicalHistory: "",
      allergies: "",
      medications: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  // Fetch patient data when editing
  useEffect(() => {
    if (isEditing && patientId) {
      fetchPatient(patientId);
    }
  }, [patientId, isEditing]);

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
        const patient = data.patient;
        // Map the patient data to form values
        form.reset({
          firstName: patient.firstName || "",
          lastName: patient.lastName || "",
          dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
          gender: patient.gender || undefined,
          email: patient.email || "",
          phone: patient.phone || "",
          address: patient.address || "",
          medicalHistory: patient.medicalHistory || "",
          allergies: patient.allergies || "",
          medications: patient.medications || "",
          emergencyContactName: patient.emergencyContactName || "",
          emergencyContactPhone: patient.emergencyContactPhone || "",
        });
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

  // Form submission
  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Create a FormData object to send to the PHP API
      const formData = new FormData();
      
      // Add all form values to the FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'dateOfBirth' && value instanceof Date) {
            formData.append(key, format(value, 'yyyy-MM-dd'));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // Add the patient ID if editing
      if (isEditing && patientId) {
        formData.append('id', patientId);
      }
      
      // Send the data to the appropriate endpoint
      const endpoint = isEditing ? 'update-patient.php' : 'add-patient.php';
      const response = await fetch(`php-api/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast("Patient saved successfully");
        
        // Navigate back to the patient list or to the patient details
        if (isEditing) {
          navigate(`/mysql-patient/${patientId}`);
        } else if (data.patientId) {
          navigate(`/mysql-patient/${data.patientId}`);
        } else {
          navigate('/mysql-patients');
        }
      } else {
        throw new Error(data.message || 'Failed to save patient data');
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // Scroll to the top to show the error
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };
  
  const nextTab = () => {
    if (activeTab === "personal") {
      setActiveTab("medical");
    } else if (activeTab === "medical") {
      setActiveTab("emergency");
    } else if (activeTab === "emergency") {
      form.handleSubmit(onSubmit)();
    }
  };
  
  const prevTab = () => {
    if (activeTab === "medical") {
      setActiveTab("personal");
    } else if (activeTab === "emergency") {
      setActiveTab("medical");
    }
  };

  const showToast = (message: string) => {
    setToastConfig({ message, visible: true });
    setTimeout(() => setToastConfig(prev => ({ ...prev, visible: false })), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Patient' : 'Add New Patient'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? 'Update patient information in the MySQL database' 
              : 'Register a new patient in the MySQL database'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-semibold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      <Toast
        message={toastConfig.message}
        isVisible={toastConfig.visible}
        onClose={() => setToastConfig(prev => ({ ...prev, visible: false }))}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Patient Information' : 'Patient Information'}</CardTitle>
              <CardDescription>
                Enter the patient's details below. Required fields are marked with *
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal Information</TabsTrigger>
                  <TabsTrigger value="medical">Medical Information</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Main St, City, State, Zip" 
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="medical" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the patient's medical history" 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include any significant past medical conditions, surgeries, or health issues.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any allergies the patient has" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          List all known allergies, including medications, food, and environmental allergies.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter current medications" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          List all current medications, including dosage and frequency.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="emergency" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormDescription>
                            Name of someone to contact in case of emergency.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (123) 456-7890" {...field} />
                          </FormControl>
                          <FormDescription>
                            Phone number of the emergency contact.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevTab}
                disabled={activeTab === "personal" || isLoading || isSaving}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {activeTab === "emergency" ? (
                  <Button 
                    type="submit" 
                    disabled={isLoading || isSaving}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      isEditing ? 'Update Patient' : 'Save Patient'
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextTab}
                    disabled={isLoading || isSaving}
                  >
                    Next
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default MySQLPatientForm; 