import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, LogOut, History } from 'lucide-react';
import { auth } from '../config/firebase';
import type { PatientInfo } from '../types';

export function Form() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    country: '',
    weight: '',
    ethnicity: '',
    medicalHistory: [],
    currentMedications: []
  });

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      navigate('/patient-form', { state: { patientInfo: formData } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with user info */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-blue-600">AIDoc</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/history"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <History className="h-5 w-5 mr-1" />
                Chat History
              </Link>
              <span className="text-gray-600">
                {auth.currentUser?.displayName || auth.currentUser?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Form Content */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">AiDoc</h1>
            <div className="h-1 w-10 bg-sky-500 rounded"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Let's get to know you!
                </h2>
                <p className="text-gray-500 mb-4">
                  How should we greet you?
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  If privacy is a concern, feel free to use just a nickname.
                </p>
              </div>

              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Preferred nickname or name"
                className="w-full p-4 text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all duration-200 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!formData.name}
              className="w-full bg-sky-500 text-white py-3 px-6 rounded-lg font-medium
                hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 mt-6"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 