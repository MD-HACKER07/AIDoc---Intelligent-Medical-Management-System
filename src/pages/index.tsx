import React from 'react';
import { Link } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Page Index</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Main Pages */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Main Pages</h2>
          <ul className="space-y-2">
            <li><Link to="/" className="text-blue-600 hover:underline">Home</Link></li>
            <li><Link to="/login" className="text-blue-600 hover:underline">Login</Link></li>
            <li><Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link></li>
            <li><Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link></li>
            <li><Link to="/patients" className="text-blue-600 hover:underline">Patients</Link></li>
            <li><Link to="/diagnostic" className="text-blue-600 hover:underline">Diagnostic Page</Link></li>
          </ul>
        </div>
        
        {/* Patient Pages */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Patient Features</h2>
          <ul className="space-y-2">
            <li><Link to="/add-patient" className="text-blue-600 hover:underline">Add Patient</Link></li>
            <li><Link to="/consultations" className="text-blue-600 hover:underline">Consultations</Link></li>
            <li><Link to="/patient-details" className="text-blue-600 hover:underline">Patient Details</Link></li>
            <li><Link to="/patient-chat" className="text-blue-600 hover:underline">Patient Chat</Link></li>
          </ul>
        </div>
        
        {/* Reports Pages */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Reports</h2>
          <ul className="space-y-2">
            <li><Link to="/reports" className="text-blue-600 hover:underline">Reports Dashboard</Link></li>
            <li><Link to="/medical-reports" className="text-blue-600 hover:underline">Medical Reports</Link></li>
          </ul>
        </div>
        
        {/* System Pages */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">System Pages</h2>
          <ul className="space-y-2">
            <li><Link to="/hospital-profile" className="text-blue-600 hover:underline">Hospital Profile</Link></li>
            <li><Link to="/settings" className="text-blue-600 hover:underline">Settings</Link></li>
            <li><Link to="/settings?tab=database" className="text-blue-600 hover:underline">Database Settings</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Technical Information</h2>
        <p className="text-sm text-gray-600">React Version: {React.version}</p>
        <p className="text-sm text-gray-600">Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
};

export default Index; 