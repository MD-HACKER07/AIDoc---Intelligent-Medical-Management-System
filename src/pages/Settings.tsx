import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Bell, Globe, Shield, Monitor, Moon, Database, RefreshCw, Trash2, AlertTriangle, Server, Wifi, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHospital } from '@/context/HospitalContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { motion } from 'framer-motion';
import { NetworkCheck } from '@/components/NetworkCheck';
import { FirestorePermissionTest } from '@/components/FirestorePermissionTest';
import { FirebaseConnectionFix } from '@/components/FirebaseConnectionFix';
import { DirectFirebaseInit } from '@/components/DirectFirebaseInit';
import { FirestorePermissionFix } from '@/components/FirestorePermissionFix';
import { FirebaseQuotaManager } from '@/components/FirebaseQuotaManager';
import { useDatabase } from '@/context/DatabaseContext';
import { getApps } from 'firebase/app';
import { PatientService } from '@/services/patientService';
import { DatabaseStatusWidget } from '@/components/DatabaseStatusWidget';

// Define settings interface
interface AppSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  patientReminders: boolean;
  shareAnonymousData: boolean;
  dataRetentionDays: number;
  darkMode: boolean;
  highContrastMode: boolean;
  useRealtimeDB: boolean;
  automaticUpdates: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const { hospital, refreshHospital } = useHospital();
  const { databaseType, setDatabaseType, firebaseConnected, checkFirebaseConnection, isTesting, quotaExceeded } = useDatabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setShowSuccess] = useState(false);
  
  // Get default tab from URL query params
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    return tabParam && ['notifications', 'privacy', 'appearance', 'system', 'database'].includes(tabParam) 
      ? tabParam 
      : 'notifications';
  });
  
  // Database testing states
  const [databaseTestLoading, setDatabaseTestLoading] = useState(false);
  const [databaseTestError, setDatabaseTestError] = useState<string | null>(null);
  const [databaseTestSuccess, setDatabaseTestSuccess] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    // Notification settings
    emailNotifications: true,
    inAppNotifications: true,
    patientReminders: true,
    
    // Privacy settings
    shareAnonymousData: false,
    dataRetentionDays: 90,
    
    // Appearance settings
    darkMode: false,
    highContrastMode: false,
    
    // System settings
    useRealtimeDB: false,
    automaticUpdates: true,
  });

  // Function to log debug messages
  const logDebug = (message: string, ...args: any[]) => {
    if (debugMode) {
      console.log(`[Settings Debug] ${message}`, ...args);
    }
  };
  
  // Test database connection
  const testDatabaseConnection = async () => {
    setDatabaseTestLoading(true);
    setDatabaseTestError(null);
    setDatabaseTestSuccess(false);
    
    logDebug('Starting database connectivity test');
    
    try {
      logDebug('Checking Firebase app initialization');
      const apps = getApps();
      logDebug('Firebase apps initialized:', apps.length);
      
      if (apps.length === 0) {
        throw new Error('Firebase is not initialized');
      }
      
      logDebug('Testing database connection via PatientService');
      const result = await PatientService.testDatabaseAccess();
      
      if (result.success) {
        setDatabaseTestSuccess(true);
        logDebug('Database test successful:', result.message);
        setDatabaseTestError('Database connection successful: ' + result.message);
      } else {
        setDatabaseTestError(`Database test failed: ${result.message}`);
        logDebug('Database test failed:', result.message);
      }
    } catch (err: any) {
      setDatabaseTestError(`Database test error: ${err.message}`);
      logDebug('Database test error:', err);
    } finally {
      setDatabaseTestLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize settings with hospital data
    if (hospital) {
      setSettings({
        emailNotifications: hospital.settings?.emailNotifications !== false,
        inAppNotifications: hospital.settings?.inAppNotifications !== false,
        patientReminders: hospital.settings?.patientReminders !== false,
        shareAnonymousData: hospital.settings?.shareAnonymousData === true,
        dataRetentionDays: hospital.settings?.dataRetentionDays || 90,
        darkMode: hospital.settings?.darkMode === true,
        highContrastMode: hospital.settings?.highContrastMode === true,
        useRealtimeDB: hospital.settings?.useRealtimeDB === true,
        automaticUpdates: hospital.settings?.automaticUpdates !== false,
      });
    }
  }, [user, hospital, navigate]);

  const handleSwitchChange = (name: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const saveSettings = async () => {
    if (!hospital?.id || !db) return;
    
    setIsSaving(true);
    try {
      const hospitalRef = doc(db, 'hospitals', hospital.id);
      await updateDoc(hospitalRef, {
        settings,
        updatedAt: new Date().toISOString()
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Refresh hospital data
      refreshHospital();
    } catch (error) {
      console.error('Error updating hospital settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = () => {
    if (!hospital) return;
    
    // Create a JSON blob with hospital data
    const dataStr = JSON.stringify(hospital, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create a download link and trigger it
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hospital.name.replace(/\s+/g, '_').toLowerCase()}_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  // Helper to render diagnostic components with some modifications to make them more compact
  const renderDiagnosticTool = (Component: React.ComponentType<any>, props: any = {}) => {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 overflow-hidden">
        <Component 
          {...props}
          isEmbedded={true} 
          hideTitle={true}
          minimalUI={true}
        />
      </div>
    );
  };

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without navigating
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hospital Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure system preferences and privacy options
          </p>
        </div>
        
        <Button 
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
        </Button>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-md flex items-center gap-2"
        >
          <span>Settings saved successfully!</span>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive important alerts and updates via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleSwitchChange('emailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inAppNotifications">In-App Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show notifications within the application
                    </p>
                  </div>
                  <Switch
                    id="inAppNotifications"
                    checked={settings.inAppNotifications}
                    onCheckedChange={() => handleSwitchChange('inAppNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="patientReminders">Patient Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send automated reminders for appointments and follow-ups
                    </p>
                  </div>
                  <Switch
                    id="patientReminders"
                    checked={settings.patientReminders}
                    onCheckedChange={() => handleSwitchChange('patientReminders')}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="privacy">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>
                  Manage how your hospital data is handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shareAnonymousData">Share Anonymous Data</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Contribute anonymized data to improve AI services
                    </p>
                  </div>
                  <Switch
                    id="shareAnonymousData"
                    checked={settings.shareAnonymousData}
                    onCheckedChange={() => handleSwitchChange('shareAnonymousData')}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Data Backup & Export</Label>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    onClick={handleDataExport}
                  >
                    Export Hospital Data
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Exports hospital profile, settings, and non-sensitive data (no patient records)
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Label className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </Label>
                    <Button 
                      variant="destructive"
                      className="w-full justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account Data
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permanently delete all hospital data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="appearance">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable dark theme for the application
                    </p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={() => handleSwitchChange('darkMode')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="highContrastMode">High Contrast Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Increase contrast for better readability
                    </p>
                  </div>
                  <Switch
                    id="highContrastMode"
                    checked={settings.highContrastMode}
                    onCheckedChange={() => handleSwitchChange('highContrastMode')}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="system">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Manage technical aspects of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useRealtimeDB">Use Realtime Database</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between Firestore and Realtime Database
                    </p>
                  </div>
                  <Switch
                    id="useRealtimeDB"
                    checked={settings.useRealtimeDB}
                    onCheckedChange={() => handleSwitchChange('useRealtimeDB')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="automaticUpdates">Automatic Updates</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically apply system updates
                    </p>
                  </div>
                  <Switch
                    id="automaticUpdates"
                    checked={settings.automaticUpdates}
                    onCheckedChange={() => handleSwitchChange('automaticUpdates')}
                  />
                </div>
                
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label>System Maintenance</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline">
                      Clear Cache
                    </Button>
                    <Button variant="outline">
                      Check for Updates
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  System Version: 1.0.0 | Last Updated: {new Date().toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="database">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Configuration
                </CardTitle>
                <CardDescription>
                  Manage database connections and troubleshoot issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DatabaseStatusWidget />
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="databaseType">Database Type</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select which database to use for storing patient data
                      </p>
                    </div>
                    <select
                      id="databaseType"
                      value={databaseType}
                      onChange={(e) => setDatabaseType(e.target.value as any)}
                      className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
                    >
                      <option value="auto">Auto (Default)</option>
                      <option value="firebase">Firebase Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <Label className="mb-2">Additional Database Tests</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testDatabaseConnection}
                      disabled={databaseTestLoading}
                    >
                      {databaseTestLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing Database...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Verify Database Access
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {databaseTestSuccess && (
                    <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                      Database connection successful
                    </div>
                  )}
                  
                  {databaseTestError && (
                    <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                      {databaseTestError}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-medium mb-4">Advanced Diagnostics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="mb-2 block">Network Diagnostics</Label>
                      {renderDiagnosticTool(NetworkCheck)}
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Firestore Permission Test</Label>
                      {renderDiagnosticTool(FirestorePermissionTest)}
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4">
                    <h4 className="flex items-center text-amber-800 dark:text-amber-400 font-medium mb-2">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Connection Troubleshooting
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      If you're experiencing connection issues, try these options:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload Page
                      </Button>
                      {renderDiagnosticTool(FirebaseConnectionFix)}
                      {renderDiagnosticTool(DirectFirebaseInit)}
                    </div>
                  </div>
                  
                  {quotaExceeded && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-4">
                      <h4 className="flex items-center text-red-800 dark:text-red-400 font-medium mb-2">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Quota Exceeded
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Firebase quota has been exceeded. Try using direct save options or fix permissions.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {renderDiagnosticTool(FirebaseQuotaManager)}
                        {renderDiagnosticTool(FirestorePermissionFix)}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="debugMode">Debug Mode</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable detailed logging for troubleshooting
                      </p>
                    </div>
                    <Switch
                      id="debugMode"
                      checked={debugMode}
                      onCheckedChange={() => setDebugMode(!debugMode)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 