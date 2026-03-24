import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { ChatProvider } from './context/ChatContext';
import { HospitalProvider } from './context/HospitalContext';
import { AuthProvider } from './context/AuthContext';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth } from './config/firebase';
import { ThemeProvider } from './context/ThemeContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { hospitalService } from './services/hospitalService';
import { Toast } from './components/Toast';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Chat = lazy(() => import('./components/Chat').then(module => ({ default: module.Chat })));
const ChatHistory = lazy(() => import('./components/ChatHistory').then(module => ({ default: module.ChatHistory })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/legal/TermsConditions'));
const CancellationRefund = lazy(() => import('./pages/legal/CancellationRefund'));
const Contact = lazy(() => import('./pages/Contact'));
const Welcome = lazy(() => import('./pages/Welcome'));
const LearnMore = lazy(() => import('./pages/LearnMore'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const Docs = lazy(() => import('./pages/Docs'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const HospitalProfile = lazy(() => import('./pages/HospitalProfile'));
const Reception = lazy(() => import('./pages/Reception'));
const Settings = lazy(() => import('./pages/Settings'));
const HospitalRegistrationForm = lazy(() => import('./components/HospitalRegistrationForm').then(module => ({ default: module.HospitalRegistrationForm })));
const HospitalChat = lazy(() => import('./components/HospitalChat').then(module => ({ default: module.HospitalChat })));
const NewPatient = lazy(() => import('./components/NewPatient').then(module => ({ default: module.NewPatient })));
const MainLayout = lazy(() => import('./components/MainLayout'));
const Consultations = lazy(() => import('./pages/Consultations'));
const PatientDetails = lazy(() => import('./pages/PatientDetails'));
const MedicalReports = lazy(() => import('./pages/MedicalReports'));
const MySQLPatients = lazy(() => import('./pages/MySQLPatients'));
const MySQLPatientView = lazy(() => import('./pages/MySQLPatientView').then(module => ({ default: module.MySQLPatientView })));
const MySQLPatientForm = lazy(() => import('./pages/MySQLPatientForm').then(module => ({ default: module.MySQLPatientForm })));
// Create a simple fallback component for ToastDemo since it doesn't exist
const ToastDemo = lazy(() => Promise.resolve({ default: () => (<div>Toast Demo</div>) }));
const Demo = lazy(() => import('./pages/Demo'));
// New pages
const Patients = lazy(() => import('./pages/Patients'));
const Reports = lazy(() => import('./pages/Reports'));

// Updated type definition
type FirebaseUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasHospital, setHasHospital] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("Firebase auth state listener setup");
    try {
      // Check if auth is not null before using onAuthStateChanged
      if (!auth) {
        console.error("Auth is null, cannot setup listener");
        setError("Authentication service is unavailable. Please try again later.");
        setLoading(false);
        return () => {};
      }
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("User authenticated:", user.uid);
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
          // Check if user has registered a hospital
          try {
            console.log("Checking if hospital exists for user:", user.uid);
            const exists = await hospitalService.checkHospitalExists(user.uid);
            console.log("Hospital exists:", exists);
            setHasHospital(exists);
          } catch (err) {
            console.error("Error checking hospital existence:", err);
            setHasHospital(false);
          }
        } else {
          console.log("No authenticated user");
          setUser(null);
          setHasHospital(null);
        }
        setLoading(false);
      });

      return () => {
        console.log("Cleaning up auth state listener");
        unsubscribe();
      };
    } catch (err) {
      console.error("Error setting up auth state listener:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <Loading variant="pulse" size="lg" text="Loading application..." fullScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-6 bg-white dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-xl font-semibold mb-3">Application Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Wrap a component with MainLayout
  const withMainLayout = (Component: React.ComponentType<any>) => {
    return (
      <Suspense fallback={<Loading variant="spinner" text="Loading page..." />}>
        <ErrorBoundary>
          <MainLayout>
            <Component />
          </MainLayout>
        </ErrorBoundary>
      </Suspense>
    );
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <DatabaseProvider>
            <Router>
              <SiteProvider>
                <ChatProvider>
                  <HospitalProvider>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={withMainLayout(Home)} />
                      <Route path="/demo" element={withMainLayout(Demo)} />
                      <Route path="/learn-more" element={withMainLayout(LearnMore)} />
                      <Route path="/welcome" element={
                        user ? <Navigate to="/dashboard" replace /> : withMainLayout(Welcome)
                      } />
                      <Route path="/contact" element={withMainLayout(Contact)} />
                      <Route path="/docs" element={withMainLayout(Docs)} />
                      
                      {/* Authentication Routes - No Layout */}
                      <Route path="/login" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading login..." />}>
                          <ErrorBoundary>
                            {user ? (
                              <Navigate to="/dashboard" replace />
                            ) : (
                              <Login />
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      <Route path="/signup" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading sign up..." />}>
                          <ErrorBoundary>
                            {user ? (
                              <Navigate to="/dashboard" replace />
                            ) : (
                              <SignUp />
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      {/* Legal Pages */}
                      <Route path="/privacy-policy" element={withMainLayout(PrivacyPolicy)} />
                      <Route path="/terms-conditions" element={withMainLayout(TermsConditions)} />
                      <Route path="/cancellation-refund" element={withMainLayout(CancellationRefund)} />
                      <Route path="/refund-policy" element={withMainLayout(RefundPolicy)} />

                      {/* Hospital Registration - Custom Layout */}
                      <Route path="/hospital-registration" element={
                        <Suspense fallback={<Loading variant="pulse" text="Loading registration form..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : hasHospital ? (
                              <Navigate to="/dashboard" replace />
                            ) : (
                              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                                <HospitalRegistrationForm />
                              </div>
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />

                      {/* Hospital Dashboard Area - With Layout */}
                      <Route path="/dashboard" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading dashboard..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Dashboard)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/hospital-profile" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading profile..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(HospitalProfile)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/settings" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading settings..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Settings)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/hospital-chat" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading chat..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(HospitalChat)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/add-patient" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading patient form..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(NewPatient)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/consultations" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading consultations..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Consultations)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/patient/:patientId" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading patient details..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(PatientDetails)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/chat/:patientId" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading patient chat..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Chat)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      {/* Legacy Routes maintained for compatibility */}
                      <Route path="/chat" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading chat..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Chat)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/patients" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading patients..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Patients)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/reports" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading reports..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Reports)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/reception" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading reception..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(Reception)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/chat-history" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading chat history..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(ChatHistory)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/medical-reports" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading medical reports..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              <MainLayout>
                                <MedicalReports />
                              </MainLayout>
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      {/* MySQL Patient Management Routes */}
                      <Route path="/mysql-patients" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading MySQL patients..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(MySQLPatients)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/mysql-patient/:patientId" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading MySQL patient details..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(MySQLPatientView)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/add-mysql-patient" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading MySQL patient form..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(MySQLPatientForm)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/edit-mysql-patient/:patientId" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading MySQL patient edit form..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : !hasHospital ? (
                              <Navigate to="/hospital-registration" replace />
                            ) : (
                              withMainLayout(MySQLPatientForm)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      <Route path="/toast-demo" element={
                        <Suspense fallback={<Loading variant="dots" text="Loading toast demo..." />}>
                          <ErrorBoundary>
                            {!user ? (
                              <Navigate to="/login" replace />
                            ) : (
                              withMainLayout(ToastDemo)
                            )}
                          </ErrorBoundary>
                        </Suspense>
                      } />
                      
                      {/* Catch-all route for 404 */}
                      <Route path="*" element={
                        <Suspense fallback={<Loading variant="dots" text="Page not found..." />}>
                          <ErrorBoundary>
                            <MainLayout>
                              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">404 - Page Not Found</h1>
                                <p className="mb-8 text-gray-600 dark:text-gray-400 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
                                <div className="flex gap-4 flex-wrap justify-center">
                                  <button 
                                    onClick={() => window.history.back()} 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Go Back
                                  </button>
                                  <button 
                                    onClick={() => window.location.href = '/'} 
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    Return Home
                                  </button>
                                </div>
                              </div>
                            </MainLayout>
                          </ErrorBoundary>
                        </Suspense>
                      } />
                    </Routes>
                  </HospitalProvider>
                </ChatProvider>
              </SiteProvider>
            </Router>
          </DatabaseProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
