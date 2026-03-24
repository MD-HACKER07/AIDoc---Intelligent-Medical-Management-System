import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, Globe2 } from 'lucide-react';
import type { PatientInfo, FormStep } from '../types';
import { COUNTRIES, ETHNICITIES, GENDERS } from '../types';

export function PatientForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FormStep>('name');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<PatientInfo>({
    name: '',
    country: '',
    age: '',
    weight: '',
    ethnicity: '',
    gender: '',
    medicalHistory: [],
    currentMedications: []
  });

  const steps: FormStep[] = ['name', 'country', 'age', 'weight', 'ethnicity', 'gender', 'medical'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setDirection('forward');
      setStep(steps[currentIndex + 1]);
    } else {
      navigate('/chat', { state: { patientInfo: formData } });
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setDirection('backward');
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNext();
  };

  const renderStepContent = () => {
    const slideClass = direction === 'forward' 
      ? 'animate-slide-left' 
      : 'animate-slide-right';

    switch (step) {
      case 'name':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">What's your name?</h3>
            <p className="text-gray-600 animate-fade-in delay-100">Please enter your full name as it appears on your ID</p>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in delay-200"
            />
          </div>
        );

      case 'country':
        return (
          <div className={`space-y-6 ${slideClass}`}>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">What's your country of residence?</h3>
              <p className="text-gray-600 animate-fade-in delay-100">
                Selecting country helps us tailor our services and ensure compliance with local regulations.
              </p>
            </div>
            
            <div className="relative animate-fade-in delay-200">
              <div className="mb-6">
                <img
                  src="https://images.unsplash.com/photo-1589519160732-57fc498494f8?auto=format&fit=crop&w=1200&q=80"
                  alt="World Map"
                  className="w-full h-48 object-cover rounded-lg opacity-25"
                />
                <Globe2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-blue-600" />
              </div>
              
              <div className="relative">
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-4 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] appearance-none bg-white"
                >
                  <option value="">Please select your country</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );

      case 'age':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">How old are you?</h3>
            <p className="text-gray-600 animate-fade-in delay-100">Your age helps us provide more accurate medical guidance</p>
            <input
              type="number"
              name="age"
              required
              min="0"
              max="120"
              value={formData.age || ''}
              onChange={handleInputChange}
              placeholder="Age"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in delay-200"
            />
          </div>
        );

      case 'weight':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">What's your weight?</h3>
            <p className="text-gray-600 animate-fade-in delay-100">Please enter your weight in kilograms</p>
            <input
              type="number"
              name="weight"
              required
              min="0"
              max="500"
              value={formData.weight || ''}
              onChange={handleInputChange}
              placeholder="Weight in kg"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in delay-200"
            />
          </div>
        );

      case 'ethnicity':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">What's your ethnicity?</h3>
            <p className="text-gray-600 animate-fade-in delay-100">This helps us provide more personalized care</p>
            <select
              name="ethnicity"
              required
              value={formData.ethnicity}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in delay-200"
            >
              <option value="">Select your ethnicity</option>
              {ETHNICITIES.map(ethnicity => (
                <option key={ethnicity} value={ethnicity}>
                  {ethnicity}
                </option>
              ))}
            </select>
          </div>
        );

      case 'gender':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">What's your gender?</h3>
            <p className="text-gray-600 animate-fade-in delay-100">Select your gender identity</p>
            <select
              name="gender"
              required
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in delay-200"
            >
              <option value="">Select your gender</option>
              {GENDERS.map(gender => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>
        );

      case 'medical':
        return (
          <div className={`space-y-4 ${slideClass}`}>
            <h3 className="text-xl font-semibold text-gray-800 animate-fade-in">Medical Information</h3>
            <div className="space-y-6">
              <div className="animate-fade-in delay-100">
                <label className="block text-gray-600 mb-2">
                  Do you have any pre-existing medical conditions?
                </label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory.join(', ')}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    medicalHistory: e.target.value.split(',').map(item => item.trim())
                  }))}
                  placeholder="e.g., Asthma, Diabetes, High Blood Pressure"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02]"
                  rows={3}
                />
              </div>
              <div className="animate-fade-in delay-200">
                <label className="block text-gray-600 mb-2">
                  Are you currently taking any medications?
                </label>
                <textarea
                  name="currentMedications"
                  value={formData.currentMedications.join(', ')}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    currentMedications: e.target.value.split(',').map(item => item.trim())
                  }))}
                  placeholder="e.g., Aspirin, Insulin, Ventolin"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transform transition-all duration-300 hover:scale-[1.02]"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 transform transition-all duration-500 hover:shadow-xl max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span className="animate-fade-in">Step {currentStepIndex + 1} of {steps.length}</span>
          <span className="animate-fade-in">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center text-gray-600 hover:text-gray-800 transform transition-all duration-300 hover:scale-105 ${
              currentStepIndex === 0 ? 'invisible' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {currentStepIndex === steps.length - 1 ? (
              'Start Consultation'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-center text-sm text-gray-500 animate-fade-in">
        <Lock className="w-4 h-4 mr-1" />
        Your information is protected and encrypted
      </div>
    </div>
  );
}