import { Notebook as Robot } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-4xl w-full">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to AiDoc</h1>
          <p className="text-xl text-gray-600">Your AI-powered medical consultation companion</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-blue-100 p-8 rounded-full">
            <Robot className="w-24 h-24 text-blue-600" />
          </div>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">How AiDoc Can Help You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Quick Consultation</h3>
                <p className="text-gray-600">Get immediate medical guidance for non-emergency situations</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Symptom Assessment</h3>
                <p className="text-gray-600">Understand your symptoms and get recommended next steps</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>

            <p className="text-sm text-gray-500">
              Note: AiDoc is not a replacement for professional medical advice. In case of emergency,
              please contact your local emergency services immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}