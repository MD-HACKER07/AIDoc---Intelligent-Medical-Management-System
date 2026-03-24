import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Image } from 'lucide-react';
import { auth, db, storage, rtdb } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as databaseRef, set } from 'firebase/database';

export type HospitalInfo = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  doctors: {
    name: string;
    specialization: string;
    experience: string;
  }[];
  logo: string | null;
  registrationNumber: string;
  establishedYear: string;
}

type FormStep = 'basic' | 'contact' | 'specialties' | 'doctors' | 'logo';

export function HospitalRegistrationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FormStep>('basic');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<HospitalInfo>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    specialties: [],
    doctors: [],
    logo: null,
    registrationNumber: '',
    establishedYear: '',
  });

  const steps: FormStep[] = ['basic', 'contact', 'specialties', 'doctors', 'logo'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const specialties = e.target.value.split(',').map(item => item.trim());
    setFormData(prev => ({ ...prev, specialties }));
  };

  const handleAddDoctor = () => {
    setFormData(prev => ({
      ...prev,
      doctors: [
        ...prev.doctors,
        { name: '', specialization: '', experience: '' }
      ]
    }));
  };

  const handleRemoveDoctor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, i) => i !== index)
    }));
  };

  const handleDoctorChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedDoctors = [...prev.doctors];
      updatedDoctors[index] = { ...updatedDoctors[index], [field]: value };
      return { ...prev, doctors: updatedDoctors };
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setDirection('forward');
      setStep(steps[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setDirection('backward');
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      let logoUrl = null;
      // Upload logo if available
      if (logoFile) {
        const logoStorage = storageRef(storage, `hospital_logos/${user.uid}`);
        await uploadBytes(logoStorage, logoFile);
        logoUrl = await getDownloadURL(logoStorage);
      }

      // Prepare hospital data
      const hospitalData = {
        ...formData,
        logo: logoUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid,
        uid: user.uid
      };

      // Choose where to store the data
      const useRealtimeDatabase = false; // Set to true to use Realtime Database, false for Firestore
      
      if (useRealtimeDatabase) {
        // Save to Realtime Database
        const hospitalRef = databaseRef(rtdb, `hospitals/${user.uid}`);
        await set(hospitalRef, {
          ...hospitalData,
          // Convert Firestore timestamp to simple Date for Realtime DB
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Save to Firestore - use user.uid as the document ID for easy lookup
        await setDoc(doc(db, "hospitals", user.uid), hospitalData);
      }
      
      setSuccess(true);
      // Wait a moment to show success message before redirecting
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error("Error saving hospital data:", err);
      setError(err.message || "Failed to save hospital information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const slideClass = direction === 'forward' 
      ? 'animate-slide-left' 
      : 'animate-slide-right';

    switch (step) {
      case 'basic':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white animate-fade-in">Basic Information</h3>
            <p className="text-gray-600 dark:text-gray-300 animate-fade-in delay-100">Please provide your hospital or clinic details</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital/Clinic Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name of your hospital/clinic"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  required
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your medical establishment registration number"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Established</label>
                <input
                  type="text"
                  name="establishedYear"
                  required
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  placeholder="When was your hospital/clinic established?"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Address</label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white animate-fade-in">Contact Information</h3>
            <p className="text-gray-600 dark:text-gray-300 animate-fade-in delay-100">How can patients reach your hospital?</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter hospital contact number"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter hospital email address"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website (optional)</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="Enter hospital website URL"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'specialties':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white animate-fade-in">Hospital Specialties</h3>
            <p className="text-gray-600 dark:text-gray-300 animate-fade-in delay-100">What medical specialties does your hospital offer?</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Specialties (comma separated)
              </label>
              <textarea
                name="specialties"
                required
                value={formData.specialties.join(', ')}
                onChange={handleSpecialtiesChange}
                placeholder="e.g., Cardiology, Neurology, Pediatrics, Orthopedics"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={5}
              />
            </div>
          </div>
        );

      case 'doctors':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white animate-fade-in">Hospital Doctors</h3>
            <p className="text-gray-600 dark:text-gray-300 animate-fade-in delay-100">Please add information about the doctors at your hospital</p>
            
            <div className="space-y-6">
              {formData.doctors.map((doctor, index) => (
                <div key={index} className="p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white">Doctor #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(index)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={doctor.name}
                        onChange={(e) => handleDoctorChange(index, 'name', e.target.value)}
                        placeholder="Doctor's full name"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={doctor.specialization}
                        onChange={(e) => handleDoctorChange(index, 'specialization', e.target.value)}
                        placeholder="e.g., Cardiologist, Neurologist"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Years of Experience</label>
                      <input
                        type="text"
                        value={doctor.experience}
                        onChange={(e) => handleDoctorChange(index, 'experience', e.target.value)}
                        placeholder="e.g., 10 years"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddDoctor}
                className="w-full p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
              >
                + Add Another Doctor
              </button>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white animate-fade-in">Hospital Logo</h3>
            <p className="text-gray-600 dark:text-gray-300 animate-fade-in delay-100">Upload your hospital logo to personalize your account</p>
            
            <div className="flex flex-col items-center space-y-4">
              {logoPreview ? (
                <div className="relative h-40 w-40">
                  <img 
                    src={logoPreview} 
                    alt="Hospital logo preview" 
                    className="h-full w-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-40 w-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <label className="block w-full">
                <span className="sr-only">Choose hospital logo</span>
                <input 
                  type="file"
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Registration</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={(e) => e.preventDefault()}>
        {renderStepContent()}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            Hospital registration successful! Redirecting to dashboard...
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || loading}
            className={`px-4 py-2 flex items-center gap-2 rounded-lg ${
              currentStepIndex === 0
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Processing...</>
            ) : currentStepIndex === steps.length - 1 ? (
              <>Complete Registration</>
            ) : (
              <>Next <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 