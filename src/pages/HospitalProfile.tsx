import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, MapPin, Phone, Mail, Globe, Clock, Edit2, Save, CheckCircle2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHospital } from '@/context/HospitalContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { motion } from 'framer-motion';

export default function HospitalProfile() {
  const { user } = useAuth();
  const { hospital, refreshHospital } = useHospital();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    specialties: '',
    description: '',
    establishmentYear: '',
    openingHours: '',
    notificationsEnabled: true,
    showDoctorInfo: true,
    enableAIConsultations: true
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check for tab parameter in URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['basic', 'details', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Initialize form with hospital data
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        website: hospital.website || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        zipCode: hospital.zipCode || '',
        country: hospital.country || '',
        specialties: hospital.specialties || '',
        description: hospital.description || '',
        establishmentYear: hospital.establishmentYear || '',
        openingHours: hospital.openingHours || '',
        notificationsEnabled: hospital.notificationsEnabled !== false,
        showDoctorInfo: hospital.showDoctorInfo !== false,
        enableAIConsultations: hospital.enableAIConsultations !== false
      });
    }
  }, [user, hospital, navigate, location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSave = async () => {
    if (!hospital?.id) return;
    
    setIsSaving(true);
    try {
      const hospitalRef = doc(db, 'hospitals', hospital.id);
      await updateDoc(hospitalRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh hospital data
      refreshHospital();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating hospital profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hospital Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your hospital information and settings
          </p>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
              {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-md flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>Profile updated successfully!</span>
        </motion.div>
      )}

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="details">Hospital Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Hospital Information
                </CardTitle>
                <CardDescription>
                  Basic information about your hospital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your hospital name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="your@hospital.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://www.yourhospital.com"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Your hospital's address information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="123 Medical Center Drive"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="details">
          <motion.div
            variants={cardVariants}
            initial="hidden" 
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Hospital Profile</CardTitle>
                <CardDescription>
                  Additional information about your hospital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">About Your Hospital</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Describe your hospital, mission, and values..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialties">Hospital Specialties</Label>
                  <Textarea
                    id="specialties"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter medical specialties your hospital offers..."
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-500">Separate specialties with commas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="establishmentYear">Year Established</Label>
                    <Input
                      id="establishmentYear"
                      name="establishmentYear"
                      value={formData.establishmentYear}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g. 1985"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openingHours">Opening Hours</Label>
                    <Input
                      id="openingHours"
                      name="openingHours"
                      value={formData.openingHours}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g. Mon-Fri: 8AM-6PM, Sat: 10AM-2PM"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Hospital Logo</CardTitle>
                <CardDescription>
                  Upload your hospital's logo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-32 w-32 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                    {hospital?.logo ? (
                      <img 
                        src={hospital.logo} 
                        alt="Hospital logo" 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  {isEditing && (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                  )}
                  
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    {isEditing 
                      ? "Upload a square image for best results. Recommended size: 512x512 pixels." 
                      : "Your hospital logo will be displayed in the navigation bar and on reports."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="settings">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle>Hospital Settings</CardTitle>
                <CardDescription>
                  Configure your preferences and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificationsEnabled">Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications about new patient activities
                    </p>
                  </div>
                  <Switch
                    id="notificationsEnabled"
                    checked={formData.notificationsEnabled}
                    onCheckedChange={() => handleSwitchChange('notificationsEnabled')}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showDoctorInfo">Show Doctor Information</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display doctor information to patients during consultations
                    </p>
                  </div>
                  <Switch
                    id="showDoctorInfo"
                    checked={formData.showDoctorInfo}
                    onCheckedChange={() => handleSwitchChange('showDoctorInfo')}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableAIConsultations">AI-Assisted Consultations</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable AI assistance for medical consultations
                    </p>
                  </div>
                  <Switch
                    id="enableAIConsultations"
                    checked={formData.enableAIConsultations}
                    onCheckedChange={() => handleSwitchChange('enableAIConsultations')}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  These settings only affect your hospital account and can be changed at any time.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 